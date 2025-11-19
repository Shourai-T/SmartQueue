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
let lastWaitingCount = 0; // THÊM: theo dõi số người chờ

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

  parser.on('data', handleArduinoMessage);
}

function sendToArduino(message: string): void {
  if (!isReady || !port || !port.isOpen) {
    console.log('⚠️ Cổng chưa sẵn sàng, bỏ qua:', message);
    return;
  }
  port.write(message + '\n');
  console.log(`📤 Gửi xuống Arduino: ${message}`);
}

// ============ ARDUINO MESSAGE HANDLER ============
async function handleArduinoMessage(line: string): Promise<void> {
  const msg = line.trim();
  console.log(`📥 Nhận từ Arduino: ${msg}`);
  
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

// THÊM: Hàm lấy số người chờ
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

    // THÊM: Lấy số người chờ
    const waitingCount = await getWaitingCount();

    const currentNumber = config.current_number;
    const totalTickets = config.next_number - 1;

    // THÊM: Gửi cả waiting count
    const stateMessage = `STATE current=${currentNumber};total=${totalTickets};waiting=${waitingCount}`;
    sendToArduino(stateMessage);
    
    console.log(`✅ Đã gửi state: current=${currentNumber}, total=${totalTickets}, waiting=${waitingCount}`);
    
    lastCurrentNumber = currentNumber;
    lastNextNumber = config.next_number;
    lastWaitingCount = waitingCount; // THÊM
  } catch (error) {
    console.error('❌ Lỗi gửi state:', error);
  }
}

async function syncStateToArduino(currentNumber: number, nextNumber: number): Promise<void> {
  const totalTickets = nextNumber - 1;
  
  // THÊM: Lấy số người chờ mới nhất
  const waitingCount = await getWaitingCount();
  
  console.log(`🔄 Đồng bộ state → Arduino: current=${currentNumber}, total=${totalTickets}, waiting=${waitingCount}`);
  
  if (currentNumber !== lastCurrentNumber) {
    sendToArduino(`CALL ${currentNumber}`);
    lastCurrentNumber = currentNumber;
  }
  
  if (nextNumber !== lastNextNumber) {
    sendToArduino(`TAKE ${totalTickets}`);
    lastNextNumber = nextNumber;
  }

  // THÊM: Gửi cập nhật số người chờ
  if (waitingCount !== lastWaitingCount) {
    sendToArduino(`QUEUE ${waitingCount}`);
    lastWaitingCount = waitingCount;
  }
}

// ============ REALTIME SUBSCRIPTION ============
function subscribeToSupabase(): void {
  console.log('👂 Đang lắng nghe thay đổi từ Supabase...');

  // Subscribe vào queue_config
  supabase
    .channel('queue_config_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'queue_config'
      },
      async (payload: any) => {
        const newCurrent = payload.new.current_number;
        const newNext = payload.new.next_number;
        
        console.log(`🔔 Config thay đổi từ web: current=${newCurrent}, next=${newNext}`);
        
        if (newCurrent === 0 && newNext === 1) {
          console.log('🔴 Phát hiện RESET từ web');
          sendToArduino('RESET');
          lastCurrentNumber = 0;
          lastNextNumber = 1;
          lastWaitingCount = 0;
        } else {
          await syncStateToArduino(newCurrent, newNext);
        }
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Đã subscribe config channel');
      }
    });

  // THÊM: Subscribe vào queue_tickets để theo dõi số người chờ
  supabase
    .channel('queue_tickets_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Lắng nghe INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'queue_tickets'
      },
      async (payload: any) => {
        console.log(`🎫 Tickets thay đổi:`, payload.eventType);
        
        // Lấy config hiện tại để sync
        const { data: config } = await supabase
          .from('queue_config')
          .select('*')
          .eq('id', CONFIG_ID)
          .single();

        if (config) {
          await syncStateToArduino(config.current_number, config.next_number);
        }
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Đã subscribe tickets channel');
      }
    });
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
console.log('🚀 Khởi động Bridge Arduino ↔ Web');
console.log(`📍 COM Port: ${COM_PORT}`);
console.log(`🌐 Supabase: ${process.env.VITE_SUPABASE_URL}`);
console.log('');

connectSerial();

process.on('SIGINT', () => {
  console.log('\n👋 Đang đóng kết nối...');
  if (port && port.isOpen) {
    port.close();
  }
  process.exit(0);
});