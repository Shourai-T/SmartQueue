import { supabase } from '../lib/supabase';
import type { QueueStatus } from '../types/queue';

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

export async function getQueueStatus(): Promise<QueueStatus> {
  const { data: config, error: configError } = await supabase
    .from('queue_config')
    .select('*')
    .eq('id', CONFIG_ID)
    .single();

  if (configError) throw configError;

  const { data: tickets, error: ticketsError } = await supabase
    .from('queue_tickets')
    .select('*')
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true });

  if (ticketsError) throw ticketsError;

  const result = {
    currentNumber: config.current_number,
    nextNumber: config.next_number,
    waiting: tickets.map(t => t.ticket_number),
    totalQueue: tickets.length
  };

  console.log('📊 getQueueStatus result:', result);
  return result;
}

export async function takeNumber(): Promise<number> {
  const { data: config } = await supabase
    .from('queue_config')
    .select('next_number')
    .eq('id', CONFIG_ID)
    .single();

  const ticketNumber = config?.next_number || 1;

  await supabase
    .from('queue_tickets')
    .insert({
      ticket_number: ticketNumber,
      status: 'waiting'
    });

  await supabase
    .from('queue_config')
    .update({
      next_number: ticketNumber + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', CONFIG_ID);

  return ticketNumber;
}

export async function callNext(): Promise<void> {
  await supabase
    .from('queue_tickets')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('status', 'serving');

  const { data: nextTicket } = await supabase
    .from('queue_tickets')
    .select('*')
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true })
    .limit(1)
    .single();

  if (!nextTicket) {
    throw new Error('Không có người đang chờ');
  }

  await supabase
    .from('queue_tickets')
    .update({
      status: 'serving',
      served_at: new Date().toISOString()
    })
    .eq('id', nextTicket.id);

  await supabase
    .from('queue_config')
    .update({
      current_number: nextTicket.ticket_number,
      updated_at: new Date().toISOString()
    })
    .eq('id', CONFIG_ID);
}

export function subscribeToQueueUpdates(callback: () => void) {
  console.log('🔗 Setting up Supabase Realtime channels...');

  const configChannel = supabase
    .channel('queue-config-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_config'
      },
      (payload) => {
        console.log('📊 queue_config changed:', payload);
        callback();
      }
    )
    .subscribe((status) => {
      console.log('📡 Config channel status:', status);
    });

  const ticketsChannel = supabase
    .channel('queue-tickets-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_tickets'
      },
      (payload) => {
        console.log('🎫 queue_tickets changed:', payload);
        callback();
      }
    )
    .subscribe((status) => {
      console.log('📡 Tickets channel status:', status);
    });

  return () => {
    console.log('🔌 Unsubscribing from Supabase channels');
    configChannel.unsubscribe();
    ticketsChannel.unsubscribe();
  };
}

export async function resetQueue(): Promise<void> {
  console.log('🔄 Starting queue reset...');

  try {
    const { data: allTickets, error: fetchError } = await supabase
      .from('queue_tickets')
      .select('id');

    if (fetchError) {
      console.error('❌ Error fetching tickets:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${allTickets?.length || 0} tickets to delete`);
    if (allTickets && allTickets.length > 0) {
      const { error: deleteError } = await supabase
        .from('queue_tickets')
        .delete()
        .in('id', allTickets.map(t => t.id));

      if (deleteError) {
        console.error('❌ Error deleting tickets:', deleteError);
        throw deleteError;
      }
      console.log('✅ Deleted all tickets');
    }
    const { error: updateError } = await supabase
      .from('queue_config')
      .update({
        current_number: 0,
        next_number: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', CONFIG_ID);

    if (updateError) {
      console.error('❌ Error updating config:', updateError);
      throw updateError;
    }
    console.log('✅ Reset config to 0/1');
    const status = await getQueueStatus();
    console.log('🔍 Status after reset:', status);

    if (status.currentNumber !== 0 || status.nextNumber !== 1 || status.totalQueue !== 0) {
      console.error('⚠️ Reset không thành công hoàn toàn:', status);
    }

  } catch (error) {
    console.error('❌ Error in resetQueue:', error);
    throw error;
  }
}