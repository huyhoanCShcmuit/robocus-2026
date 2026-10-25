import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CompetitionData } from '../../types';
import { INITIAL_COMPETITION_DATA } from '../../data/initialData';

const STORAGE_KEY = 'robocus_2026_leaderboard_data';

// Minimal browser environment so SyncManager runs its window code paths in Node
function setupBrowserGlobals() {
  const store = new Map<string, string>();
  vi.stubGlobal('window', { addEventListener: vi.fn(), dispatchEvent: vi.fn() });
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  return store;
}

async function loadSyncManager() {
  vi.resetModules();
  const mod = await import('../syncManager');
  const initial = (await import('../../data/initialData')).INITIAL_COMPETITION_DATA;
  return { sm: mod.syncManager as any, initial };
}

const withTimestamp = (lastUpdated: number, title = 'X'): CompetitionData => ({
  ...INITIAL_COMPETITION_DATA,
  settings: { ...INITIAL_COMPETITION_DATA.settings, title },
  lastUpdated,
});

describe('syncManager', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = setupBrowserGlobals();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('seeds localStorage with initial data on first load', async () => {
    const { sm, initial } = await loadSyncManager();
    const data = sm.loadData();
    expect(data).toEqual(initial);
    expect(store.has(STORAGE_KEY)).toBe(true);
  });

  it('resets outdated storage versions', async () => {
    store.set(STORAGE_KEY, JSON.stringify({ ...withTimestamp(1), version: 2 }));
    const { sm, initial } = await loadSyncManager();
    expect(sm.loadData()).toEqual(initial);
  });

  it('returns saved data from localStorage', async () => {
    store.set(STORAGE_KEY, JSON.stringify(withTimestamp(1000, 'Saved')));
    const { sm } = await loadSyncManager();
    expect(sm.loadData().settings.title).toBe('Saved');
  });

  it('applies newer remote data and notifies subscribers', async () => {
    const { sm } = await loadSyncManager();
    sm.updateLocalState(withTimestamp(1000, 'Old'));
    const listener = vi.fn();
    sm.subscribe(listener);

    sm.updateLocalState(withTimestamp(2000, 'New'));
    expect(sm.loadData().settings.title).toBe('New');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(store.get(STORAGE_KEY)!).settings.title).toBe('New');
  });

  it('ignores older remote data so it cannot overwrite newer local data', async () => {
    const { sm } = await loadSyncManager();
    sm.updateLocalState(withTimestamp(2000, 'Newer'));
    const listener = vi.fn();
    sm.subscribe(listener);

    sm.updateLocalState(withTimestamp(1000, 'Stale'));
    expect(sm.loadData().settings.title).toBe('Newer');
    expect(listener).not.toHaveBeenCalled();
  });

  it('compares against localStorage when the memory cache is empty', async () => {
    store.set(STORAGE_KEY, JSON.stringify(withTimestamp(5000, 'Local')));
    const { sm } = await loadSyncManager();
    sm.updateLocalState(withTimestamp(4000, 'Stale'));
    expect(JSON.parse(store.get(STORAGE_KEY)!).settings.title).toBe('Local');
  });

  it('skips duplicate updates with the same timestamp', async () => {
    const { sm } = await loadSyncManager();
    sm.updateLocalState(withTimestamp(3000));
    const listener = vi.fn();
    sm.subscribe(listener);
    sm.updateLocalState(withTimestamp(3000));
    expect(listener).not.toHaveBeenCalled();
  });

  it('saveData stamps a fresh lastUpdated and posts to the server', async () => {
    const { sm } = await loadSyncManager();
    vi.spyOn(Date, 'now').mockReturnValue(9999);
    sm.saveData(withTimestamp(1, 'Saved'));
    expect(sm.loadData()).toMatchObject({ lastUpdated: 9999, settings: { title: 'Saved' } });
    expect(fetch).toHaveBeenCalledWith('/api/data', expect.objectContaining({ method: 'POST' }));
  });

  it('unsubscribe stops notifications', async () => {
    const { sm } = await loadSyncManager();
    const listener = vi.fn();
    const unsubscribe = sm.subscribe(listener);
    unsubscribe();
    sm.updateLocalState(withTimestamp(Date.now() + 1000));
    expect(listener).not.toHaveBeenCalled();
  });
});
