export enum ClipType {
  PlainText = 'text',
  URL = 'url',
  Email = 'email',
  Phone = 'phone',
  Code = 'code',
  JSON = 'json',
  Image = 'image',
  RichText = 'richtext',
}

export interface ClipEntry {
  id: string;
  content: string;
  richContent?: string;
  type: ClipType;
  sourceUrl: string;
  sourceTitle: string;
  timestamp: number;
  pinned: boolean;
  isSnippet: boolean;
  shortcut?: string;
  hash: string;
  charCount: number;
}

export interface UserSettings {
  maxHistory: number;
  theme: 'system' | 'light' | 'dark';
  enableSnippetExpansion: boolean;
  enableSourceTracking: boolean;
  skipPasswordFields: boolean;
  showNotifications: boolean;
  defaultTab: 'all' | 'favorites' | 'snippets';
}

export enum MessageType {
  CLIP_CAPTURED = 'CLIP_CAPTURED',
  WRITE_CLIPBOARD = 'WRITE_CLIPBOARD',
  GET_CLIPS = 'GET_CLIPS',
  GET_CLIPS_RESPONSE = 'GET_CLIPS_RESPONSE',
  SEARCH_CLIPS = 'SEARCH_CLIPS',
  TOGGLE_PIN = 'TOGGLE_PIN',
  DELETE_CLIP = 'DELETE_CLIP',
  UPDATE_CLIP = 'UPDATE_CLIP',
  SAVE_SNIPPET = 'SAVE_SNIPPET',
  GET_SNIPPETS = 'GET_SNIPPETS',
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA',
  CLIP_COUNT = 'CLIP_COUNT',
  SNIPPETS_UPDATED = 'SNIPPETS_UPDATED',
}

export interface ClipCapturedPayload {
  content: string;
  richContent?: string;
  sourceUrl: string;
  sourceTitle: string;
}

export interface GetClipsPayload {
  tab: 'all' | 'favorites' | 'snippets';
  limit: number;
  offset: number;
  query?: string;
}

export interface SaveSnippetPayload {
  shortcut: string;
  content: string;
  id?: string;
}

export type MessagePayload =
  | { type: MessageType.CLIP_CAPTURED; payload: ClipCapturedPayload }
  | { type: MessageType.GET_CLIPS; payload: GetClipsPayload }
  | { type: MessageType.TOGGLE_PIN; payload: { id: string } }
  | { type: MessageType.DELETE_CLIP; payload: { id: string } }
  | { type: MessageType.UPDATE_CLIP; payload: { id: string; content: string } }
  | { type: MessageType.SAVE_SNIPPET; payload: SaveSnippetPayload }
  | { type: MessageType.GET_SNIPPETS; payload: undefined }
  | { type: MessageType.GET_SETTINGS; payload: undefined }
  | { type: MessageType.UPDATE_SETTINGS; payload: Partial<UserSettings> }
  | { type: MessageType.EXPORT_DATA; payload: undefined }
  | { type: MessageType.IMPORT_DATA; payload: { clips: ClipEntry[]; settings?: UserSettings } }
  | { type: MessageType.WRITE_CLIPBOARD; payload: { text: string } }
  | { type: MessageType.CLIP_COUNT; payload: undefined };
