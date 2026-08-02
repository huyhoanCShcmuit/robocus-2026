import type { CompetitionData } from '../types';
import { INITIAL_COMPETITION_DATA } from '../data/initialData';
import { db, ref, onValue, set } from './firebase';

const STORAGE_KEY = 'robocus_2026_leaderboard_data';
const CHANNEL_NAME = 'robocus_2026_sync_channel';

class SyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: ((data: CompetitionData) => void)[] = [];
  private memoryCache: CompetitionData | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'DATA_UPDATED') {
            const freshData = this.loadData();
            this.notifyListeners(freshData);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          const freshData = this.loadData();
          this.notifyListeners(freshData);
        }
      });

      // 1. Connect to Firebase Realtime Database for Global Real-time Sync
      this.initFirebaseSync();

      // 2. Initial fetch from local server endpoint if available
      this.fetchRemoteData();

      // 3. Connect to local Server-Sent Events stream if available
      this.initRealtimeStream();
    }
  }

  private initFirebaseSync() {
    if (!db) return;
    try {
      const dbRef = ref(db, 'leaderboard_data');
      onValue(
        dbRef,
        (snapshot) => {
          try {
            const remoteData = snapshot.val();
            if (remoteData) {
              this.updateLocalState(remoteData);
            }
          } catch (e) {
            console.warn('Error processing Firebase snapshot:', e);
          }
        },
        (error) => {
          console.warn('Firebase subscription error (permission denied or network):', error);
        }
      );
    } catch (e) {
      console.warn('Firebase Realtime Sync warning:', e);
    }
  }

  private initRealtimeStream() {
    try {
      const eventSource = new EventSource('/api/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.type === 'DATA_UPDATED' && payload.data) {
            this.updateLocalState(payload.data);
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };
      eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch (e) {
      console.warn('SSE not supported or connection error:', e);
    }
  }

  private async fetchRemoteData() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData) {
          this.updateLocalState(remoteData);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote data:', e);
    }
  }

  private updateLocalState(data: CompetitionData) {
    if (!data) return;
    if (this.memoryCache && data.lastUpdated && this.memoryCache.lastUpdated === data.lastUpdated) {
      return;
    }
    this.memoryCache = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to update local storage:', e);
    }
    this.notifyListeners(data);
  }

  public loadData(): CompetitionData {
    if (typeof window === 'undefined') return INITIAL_COMPETITION_DATA;
    if (this.memoryCache) return this.memoryCache;
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) {
        this.saveData(INITIAL_COMPETITION_DATA);
        return INITIAL_COMPETITION_DATA;
      }
      const parsed = JSON.parse(json);
      if (!parsed || !parsed.version || parsed.version < 5) {
        console.warn('Outdated local storage version detected. Resetting to version 5...');
        this.saveData(INITIAL_COMPETITION_DATA);
        return INITIAL_COMPETITION_DATA;
      }
      this.memoryCache = parsed;
      return parsed;
    } catch (e) {
      console.error('Failed to parse storage data:', e);
      return INITIAL_COMPETITION_DATA;
    }
  }

  public saveData(data: CompetitionData): void {
    if (typeof window === 'undefined' || !data) return;
    try {
      const updatedData = { ...data, lastUpdated: Date.now() };
      this.updateLocalState(updatedData);

      if (this.channel) {
        try {
          this.channel.postMessage({ type: 'DATA_UPDATED', timestamp: updatedData.lastUpdated });
        } catch (e) {
          console.warn('Channel postMessage warning:', e);
        }
      }

      // 1. Sync with Firebase Realtime Database safely
      if (db) {
        try {
          const dbRef = ref(db, 'leaderboard_data');
          set(dbRef, updatedData).catch((e) => {
            console.warn('Firebase save warning (non-fatal):', e);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('firebase-sync-error', { detail: e }));
            }
          });
        } catch (e) {
          console.warn('Firebase set error:', e);
        }
      }

      // 2. Sync with local server file storage as fallback
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      }).catch((e) => console.warn('Failed to sync data with server:', e));

    } catch (e) {
      console.error('Failed to save storage data:', e);
    }
  }

  public resetToDefault(): CompetitionData {
    this.saveData(INITIAL_COMPETITION_DATA);
    return INITIAL_COMPETITION_DATA;
  }

  public clearAllData(): CompetitionData {
    this.saveData(INITIAL_COMPETITION_DATA);
    return INITIAL_COMPETITION_DATA;
  }

  public subscribe(callback: (data: CompetitionData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(data: CompetitionData) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Error in subscribe listener:', e);
      }
    });
  }
}

export const syncManager = new SyncManager();
