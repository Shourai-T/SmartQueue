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
      console.log('🔄 Fetching queue status...');
      const data = await getQueueStatus();
      console.log('✅ Queue status:', data);
      setStatus(data);
    } catch (error) {
      console.error('❌ Error fetching queue status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎯 useQueue hook mounted');
    fetchStatus();

    console.log('👂 Setting up realtime subscriptions...');
    const unsubscribe = subscribeToQueueUpdates(() => {
      console.log('🔔 Realtime update received! Refreshing...');
      fetchStatus();
    });

    return () => {
      console.log('🔌 useQueue hook unmounting, unsubscribing...');
      unsubscribe();
    };
  }, []);

  return { status, loading, refresh: fetchStatus };
}