import type { UserSettings } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  maxHistory: 1000,
  theme: 'system',
  enableSnippetExpansion: true,
  enableImageCapture: false,
  enableRichText: false,
  enableSourceTracking: true,
  skipPasswordFields: true,
  showNotifications: false,
  searchMode: 'fuzzy',
  defaultTab: 'all',
};

export const MAX_CONTENT_LENGTH = 50_000;
export const SEARCH_DEBOUNCE_MS = 50;
export const PAGE_SIZE = 50;
export const DB_NAME = 'clippy-db';
export const DB_VERSION = 1;
export const CLIPS_STORE = 'clips';
export const SETTINGS_SYNC_KEY = 'clippy-settings';
