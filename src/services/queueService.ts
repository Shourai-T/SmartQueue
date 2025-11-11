import { supabase } from '../lib/supabase';
import type { QueueConfig, QueueTicket, QueueStatus } from '../types/queue';

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

export async function getQueueStatus(): Promise<QueueStatus> {
  const { data: config } = await supabase
    .from('queue_config')
    .select('*')
    .eq('id', CONFIG_ID)
    .maybeSingle();

  const { data: tickets } = await supabase
    .from('queue_tickets')
    .select('ticket_number')
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true });

  const waiting = tickets?.map(t => t.ticket_number) || [];

  return {
    currentNumber: config?.current_number || 0,
    nextNumber: config?.next_number || 1,
    waiting,
    totalQueue: waiting.length
  };
}

export async function takeNumber(): Promise<number> {
  const { data: config } = await supabase
    .from('queue_config')
    .select('next_number')
    .eq('id', CONFIG_ID)
    .maybeSingle();

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
  const { data: nextTicket } = await supabase
    .from('queue_tickets')
    .select('*')
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextTicket) return;

  const { data: currentTicket } = await supabase
    .from('queue_tickets')
    .select('*')
    .eq('status', 'serving')
    .maybeSingle();

  if (currentTicket) {
    await supabase
      .from('queue_tickets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', currentTicket.id);
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
  const configChannel = supabase
    .channel('queue_config_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_config'
      },
      callback
    )
    .subscribe();

  const ticketsChannel = supabase
    .channel('queue_tickets_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_tickets'
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(configChannel);
    supabase.removeChannel(ticketsChannel);
  };
}
