import type { CompetitionData } from '../types';
import { INITIAL_COMPETITION_DATA } from '../data/initialData';

const STORAGE_KEY = 'robocus_2026_leaderboard_data';
const CHANNEL_NAME = 'robocus_2026_sync_channel';

class SyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: ((data: CompetitionData) => void)[] = [];
  private memoryCache: CompetitionData | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data && event.data.type === 'DATA_UPDATED') {
          const freshData = this.loadData();
          this.notifyListeners(freshData);
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          const freshData = this.loadData();
          this.notifyListeners(freshData);
        }
      });

      // 1. Initial fetch from server file storage
      this.fetchRemoteData();

      // 2. Connect to Server-Sent Events stream for cross-browser real-time sync
      this.initRealtimeStream();
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
      if (!parsed.version || parsed.version < 5) {
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
    if (typeof window === 'undefined') return;
    try {
      const updatedData = { ...data, lastUpdated: Date.now() };
      this.updateLocalState(updatedData);

      if (this.channel) {
        this.channel.postMessage({ type: 'DATA_UPDATED', timestamp: updatedData.lastUpdated });
      }

      // Sync with server file storage & broadcast to all connected devices via SSE
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      }).catch((e) => console.error('Failed to sync data with server:', e));

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
    this.listeners.forEach((cb) => cb(data));
  }
}

export const syncManager = new SyncManager();
