import { MMKV } from 'react-native-mmkv';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as Network from 'expo-network';

export const storage = new MMKV();
const QUEUE_KEY = 'flashcard_offline_queue';

export type SyncEvent = {
  card_id: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
  reviewed_at: string;
  client_uuid: string;
};

export const offlineQueue = {
  getQueue: (): SyncEvent[] => {
    const data = storage.getString(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  enqueue: (card_id: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    const queue = offlineQueue.getQueue();
    const event: SyncEvent = {
      card_id,
      rating,
      reviewed_at: new Date().toISOString(),
      client_uuid: uuidv4(),
    };
    queue.push(event);
    storage.set(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Enqueued event ${event.client_uuid}. Total items: ${queue.length}`);
  },

  clearQueue: () => {
    storage.delete(QUEUE_KEY);
  },

  sync: async (apiClient: any): Promise<void> => {
    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      console.log('[OfflineQueue] Cannot sync. Device is offline.');
      return;
    }

    const queue = offlineQueue.getQueue();
    if (queue.length === 0) {
      console.log('[OfflineQueue] Queue is empty. Nothing to sync.');
      return;
    }

    try {
      console.log(`[OfflineQueue] Attempting to sync ${queue.length} events...`);
      const response = await apiClient.post('/flashcards/sync', { events: queue });
      
      if (response.success) {
        console.log(`[OfflineQueue] Sync successful. Cleared ${response.syncedCount} events.`);
        offlineQueue.clearQueue();
      }
    } catch (error) {
      console.error('[OfflineQueue] Sync failed. Will retry later.', error);
    }
  }
};
