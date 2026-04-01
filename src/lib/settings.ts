import { DEFAULT_SETTINGS, SETTINGS_SYNC_KEY } from './constants';
import type { UserSettings } from './types';

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_SYNC_KEY);
  return { ...DEFAULT_SETTINGS, ...result[SETTINGS_SYNC_KEY] };
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await chrome.storage.sync.set({ [SETTINGS_SYNC_KEY]: updated });
  return updated;
}
