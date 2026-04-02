import type { UserSettings } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  maxHistory: 1000,
  theme: 'system',
  enableSnippetExpansion: true,
  enableSourceTracking: true,
  skipPasswordFields: true,
  showNotifications: false,
  defaultTab: 'all',
};

export const MAX_CONTENT_LENGTH = 50_000;
export const SEARCH_DEBOUNCE_MS = 50;
export const PAGE_SIZE = 50;
export const DB_NAME = 'clippy-db';
export const DB_VERSION = 1;
export const CLIPS_STORE = 'clips';
export const SETTINGS_SYNC_KEY = 'clippy-settings';
export const SNIPPET_BUFFER_SIZE = 50;
export const SEARCH_PREVIEW_LENGTH = 500;
export const CLIP_DISPLAY_LENGTH = 200;
