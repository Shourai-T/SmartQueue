import dotenv from 'dotenv';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';
const COM_PORT = process.env.QUEUE_COM_PORT || 'COM4';

let port: SerialPort;
let parser: ReadlineParser;
let isReady = false;
let lastCurrentNumber = 0;
let lastNextNumber = 1;
let lastWaitingCount = 0;

function connectSerial(): void {
  console.log(`🔌 Đang kết nối Arduino qua ${COM_PORT} @57600`);
  
  port = new SerialPort({
    path: COM_PORT,
    baudRate: 57600,
    autoOpen: false
  });

  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.open((err) => {
    if (err) {
      console.error('⚠️ Lỗi mở cổng:', err.message);
      console.log('🔄 Thử lại sau 3 giây...');
      setTimeout(connectSerial, 3000);
      return;
    }

    console.log(`✅ Đã kết nối ${COM_PORT} thành công`);
    isReady = true;
    initializeSystem();
  });

  port.on('error', (err) => {
    console.error('⚠️ Lỗi Serial:', err.message);
    isReady = false;
  });

  port.on('close', () => {
    console.log('⚠️ Cổng Serial đã đóng, đang kết nối lại...');
    isReady = false;
    setTimeout(connectSerial, 3000);
  });

  // THÊM: Log mọi data nhận được
  port.on('data', (data) => {
    console.log('🔍 [RAW Serial]:', data.toString().replace(/\n/g, '\\n'));
  });

  parser.on('data', handleArduinoMessage);
}

function sendToArduino(message: string): void {
  if (!isReady || !port || !port.isOpen) {
    console.error('❌ KHÔNG THỂ GỬI - Cổng chưa sẵn sàng:', message);
    console.log('   isReady:', isReady);
    console.log('   port exists:', !!port);
    console.log('   port.isOpen:', port?.isOpen);
    return;
  }
  
  try {
    port.write(message + '\n', (err) => {
      if (err) {
        console.error('❌ Lỗi ghi Serial:', err.message);
      } else {
        console.log(`✅ ĐÃ GỬI xuống Arduino: "${message}"`);
      }
    });
  } catch (error) {
    console.error('❌ Exception khi gửi:', error);
  }
}

// ============ ARDUINO MESSAGE HANDLER ============
async function handleArduinoMessage(line: string): Promise<void> {
  const msg = line.trim();
  console.log(`📥 [Parsed] Nhận từ Arduino: "${msg}"`);
  
  if (msg === 'REQ') {
    console.log('🔄 Arduino yêu cầu đồng bộ, gửi STATE...');
    await sendCurrentStateToArduino();
    return;
  }
  
  if (msg.startsWith('Nguoi tiep theo:')) {
    const ticketNumber = parseInt(msg.split(':')[1].trim());
    if (!isNaN(ticketNumber)) {
      await createTicketFromArduino(ticketNumber);
    }
  }

  // Log confirm từ Arduino
  if (msg.startsWith('Dang phuc vu:') || 
      msg.startsWith('Cap nhat hang cho:') ||
      msg.startsWith('Dong bo') ||
      msg.startsWith('Da reset')) {
    console.log('✅ Arduino confirm:', msg);
  }
}

// ============ SUPABASE OPERATIONS ============
async function createTicketFromArduino(ticketNumber: number): Promise<void> {
  try {
    console.log(`🎫 Tạo ticket #${ticketNumber} từ Arduino`);
    
    const { error: insertError } = await supabase
      .from('queue_tickets')
      .insert({
        ticket_number: ticketNumber,
        status: 'waiting'
      });

    if (insertError) throw insertError;
    
    const { error: updateError } = await supabase
      .from('queue_config')
      .update({
        next_number: ticketNumber + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', CONFIG_ID);

    if (updateError) throw updateError;
    
    console.log(`✅ Đã thêm ticket #${ticketNumber} vào hàng đợi`);
  } catch (error) {
    console.error('❌ Lỗi tạo ticket:', error);
  }
}

async function getWaitingCount(): Promise<number> {
  const { data: waitingTickets, error } = await supabase
    .from('queue_tickets')
    .select('id')
    .eq('status', 'waiting');

  if (error) {
    console.error('❌ Lỗi lấy waiting count:', error);
    return 0;
  }

  return waitingTickets?.length || 0;
}

async function sendCurrentStateToArduino(): Promise<void> {
  try {
    const { data: config, error } = await supabase
      .from('queue_config')
      .select('*')
      .eq('id', CONFIG_ID)
      .single();

    if (error) throw error;

    const waitingCount = await getWaitingCount();
    const currentNumber = config.current_number;
    const totalTickets = config.next_number - 1;

    const stateMessage = `STATE current=${currentNumber};total=${totalTickets};waiting=${waitingCount}`;
    sendToArduino(stateMessage);
    
    console.log(`✅ Đã gửi state: current=${currentNumber}, total=${totalTickets}, waiting=${waitingCount}`);
    
    lastCurrentNumber = currentNumber;
    lastNextNumber = config.next_number;
    lastWaitingCount = waitingCount;
  } catch (error) {
    console.error('❌ Lỗi gửi state:', error);
  }
}

async function syncStateToArduino(currentNumber: number, nextNumber: number): Promise<void> {
  const totalTickets = nextNumber - 1;
  const waitingCount = await getWaitingCount();
  
  console.log(`🔄 ===== SYNC STATE TO ARDUINO =====`);
  console.log(`   Current: ${currentNumber} (last: ${lastCurrentNumber})`);
  console.log(`   Next: ${nextNumber} (last: ${lastNextNumber})`);
  console.log(`   Waiting: ${waitingCount} (last: ${lastWaitingCount})`);
  
  if (currentNumber !== lastCurrentNumber) {
    console.log(`📢 Cần gửi CALL ${currentNumber}`);
    sendToArduino(`CALL ${currentNumber}`);
    lastCurrentNumber = currentNumber;
  } else {
    console.log(`   Current không đổi, bỏ qua CALL`);
  }
  
  if (nextNumber !== lastNextNumber) {
    console.log(`📢 Cần gửi TAKE ${totalTickets}`);
    sendToArduino(`TAKE ${totalTickets}`);
    lastNextNumber = nextNumber;
  } else {
    console.log(`   Next không đổi, bỏ qua TAKE`);
  }

  if (waitingCount !== lastWaitingCount) {
    console.log(`📢 Cần gửi QUEUE ${waitingCount}`);
    sendToArduino(`QUEUE ${waitingCount}`);
    lastWaitingCount = waitingCount;
  } else {
    console.log(`   Waiting không đổi, bỏ qua QUEUE`);
  }
  
  console.log(`===================================`);
}

// ============ REALTIME SUBSCRIPTION ============
function subscribeToSupabase(): void {
  console.log('👂 Đang lắng nghe thay đổi từ Supabase...');
  console.log('🌐 URL:', process.env.VITE_SUPABASE_URL);

  // Subscribe vào queue_config
  const configChannel = supabase
    .channel('queue_config_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'queue_config'
      },
      async (payload: any) => {
        console.log('🔔 ========== CONFIG UPDATE EVENT ==========');
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        
        const newCurrent = payload.new.current_number;
        const newNext = payload.new.next_number;
        
        console.log(`🔔 Config thay đổi: current=${newCurrent}, next=${newNext}`);
        
        if (newCurrent === 0 && newNext === 1) {
          console.log('🔴 Phát hiện RESET từ web → Gửi RESET');
          sendToArduino('RESET');
          lastCurrentNumber = 0;
          lastNextNumber = 1;
          lastWaitingCount = 0;
        } else {
          console.log('🔄 Gọi syncStateToArduino...');
          await syncStateToArduino(newCurrent, newNext);
        }
        console.log('==========================================');
      }
    )
    .subscribe((status: string, err?: any) => {
      console.log('📡 Config channel status:', status);
      if (err) {
        console.error('❌ Config channel error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ ĐÃ SUBSCRIBE CONFIG CHANNEL THÀNH CÔNG');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error - Thử lại...');
      }
    });

  // Subscribe vào queue_tickets
  const ticketsChannel = supabase
    .channel('queue_tickets_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_tickets'
      },
      async (payload: any) => {
        console.log('🎫 ========== TICKETS EVENT ==========');
        console.log('📦 Event type:', payload.eventType);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        
        const { data: config } = await supabase
          .from('queue_config')
          .select('*')
          .eq('id', CONFIG_ID)
          .single();

        if (config) {
          console.log('🔄 Sync sau khi tickets thay đổi...');
          await syncStateToArduino(config.current_number, config.next_number);
        }
        console.log('=====================================');
      }
    )
    .subscribe((status: string, err?: any) => {
      console.log('📡 Tickets channel status:', status);
      if (err) {
        console.error('❌ Tickets channel error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ ĐÃ SUBSCRIBE TICKETS CHANNEL THÀNH CÔNG');
      }
    });

  // THÊM: Heartbeat
  setInterval(() => {
    console.log('💓 Heartbeat - isReady:', isReady, '| port.isOpen:', port?.isOpen);
  }, 30000);
}

// ============ INITIALIZATION ============
async function initializeSystem(): Promise<void> {
  try {
    const { data: config, error } = await supabase
      .from('queue_config')
      .select('*')
      .eq('id', CONFIG_ID)
      .single();

    if (error) throw error;

    console.log('📊 Trạng thái ban đầu:', {
      current: config.current_number,
      next: config.next_number
    });

    lastCurrentNumber = config.current_number;
    lastNextNumber = config.next_number;
    
    await sendCurrentStateToArduino();
    subscribeToSupabase();
  } catch (error) {
    console.error('❌ Lỗi khởi tạo:', error);
  }
}

// ============ START BRIDGE ============
console.log('🚀 ========== KHỞI ĐỘNG BRIDGE ==========');
console.log(`📍 COM Port: ${COM_PORT}`);
console.log(`🌐 Supabase: ${process.env.VITE_SUPABASE_URL}`);
console.log('==========================================\n');

connectSerial();

process.on('SIGINT', () => {
  console.log('\n👋 Đang đóng kết nối...');
  if (port && port.isOpen) {
    port.close();
  }
  process.exit(0);
});