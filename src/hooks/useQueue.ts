import { useState, useEffect } from 'react';
import { getQueueStatus, subscribeToQueueUpdates } from '../services/queueService';
import type { QueueStatus } from '../types/queue';

export function useQueue() {
  const [status, setStatus] = useState<QueueStatus>({
    currentNumber: 0,
    nextNumber: 1,
    waiting: [],
    totalQueue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await getQueueStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching queue status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const unsubscribe = subscribeToQueueUpdates(() => {
      fetchStatus();
    });

    return unsubscribe;
  }, []);

  return { status, loading, refresh: fetchStatus };
}
