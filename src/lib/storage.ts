import type { AppSettings, HistoryItem } from './types';
import { DEFAULT_SETTINGS } from './types';

const SETTINGS_KEY = 'quotex_predictor_settings';
const HISTORY_KEY = 'quotex_predictor_history';
const STORAGE_VERSION_KEY = 'quotex_predictor_version';
const CURRENT_VERSION = 1;

function getChromeStorage(): typeof chrome.storage.local | null {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
}

function getChromeSync(): typeof chrome.storage.sync | null {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    return chrome.storage.sync;
  }
  return null;
}

export async function getSettings(): Promise<AppSettings> {
  const sync = getChromeSync();
  if (sync) {
    return new Promise((resolve) => {
      sync.get([SETTINGS_KEY, STORAGE_VERSION_KEY], (result) => {
        if (result[SETTINGS_KEY]) {
          resolve({ ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] });
        } else {
          resolve({ ...DEFAULT_SETTINGS });
        }
      });
    });
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const sync = getChromeSync();
  if (sync) {
    return new Promise((resolve) => {
      sync.set({ [SETTINGS_KEY]: settings, [STORAGE_VERSION_KEY]: CURRENT_VERSION }, resolve);
    });
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
}

export async function getHistory(): Promise<HistoryItem[]> {
  const storage = getChromeStorage();
  if (storage) {
    return new Promise((resolve) => {
      storage.get([HISTORY_KEY], (result) => {
        resolve(result[HISTORY_KEY] || []);
      });
    });
  }
  const raw = localStorage.getItem(HISTORY_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveHistory(items: HistoryItem[]): Promise<void> {
  const storage = getChromeStorage();
  if (storage) {
    return new Promise((resolve) => {
      storage.set({ [HISTORY_KEY]: items }, resolve);
    });
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  const settings = await getSettings();
  const items = await getHistory();
  items.unshift(item);
  const trimmed = items.slice(0, settings.historyRetentionLimit);
  await saveHistory(trimmed);
}

export async function updateHistoryItem(id: string, updates: Partial<HistoryItem>): Promise<void> {
  const items = await getHistory();
  const index = items.findIndex((i) => i.id === id);
  if (index >= 0) {
    items[index] = { ...items[index], ...updates };
    await saveHistory(items);
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const items = await getHistory();
  const filtered = items.filter((i) => i.id !== id);
  await saveHistory(filtered);
}

export async function clearAllHistory(): Promise<void> {
  await saveHistory([]);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
