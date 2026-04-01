import type { ClipEntry } from '../lib/types';

export interface PopupState {
  query: string;
  activeTab: 'all' | 'favorites' | 'snippets';
  clips: ClipEntry[];
  selectedIndex: number;
  loading: boolean;
  editingId: string | null;
  totalCount: number;
}

export const initialState: PopupState = {
  query: '',
  activeTab: 'all',
  clips: [],
  selectedIndex: 0,
  loading: true,
  editingId: null,
  totalCount: 0,
};
