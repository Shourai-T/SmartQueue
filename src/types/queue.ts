export interface QueueConfig {
  id: string;
  current_number: number;
  next_number: number;
  updated_at: string;
}

export interface QueueTicket {
  id: string;
  ticket_number: number;
  status: 'waiting' | 'serving' | 'completed';
  created_at: string;
  served_at: string | null;
  completed_at: string | null;
}

export interface QueueStatus {
  currentNumber: number;
  nextNumber: number;
  waiting: number[];
  totalQueue: number;
}
