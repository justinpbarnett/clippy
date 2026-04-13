import { createStore, type Store } from '../lib/store';
import { sendMessage } from '../lib/messages';
import { writeToClipboard } from '../lib/clipboard-write';
import { searchClips, invalidateIndex } from '../lib/search';
import { MessageType, type ClipEntry, type UserSettings } from '../lib/types';
import { DEFAULT_SETTINGS, PAGE_SIZE, SETTINGS_SYNC_KEY } from '../lib/constants';
import { applyTextSize } from '../lib/text-size';
import { initialState, type PopupState } from './state';
import { renderTabBar } from './components/TabBar';
import { renderSearchBar } from './components/SearchBar';
import { renderClipList } from './components/ClipList';
import { renderSnippetEditor, type SnippetEditorElement } from './components/SnippetEditor';
import { renderHelpOverlay } from './components/HelpOverlay';
import { showToast } from './components/Toast';

export function initApp(root: HTMLElement): void {
  const store = createStore<PopupState>(initialState);
  let allClips: ClipEntry[] = [];

  root.className = 'relative flex flex-col';
  root.style.cssText = 'width:var(--j-popup-width);max-height:var(--j-popup-height);overflow:hidden;background:var(--j-surface)';

  const showHelp = renderHelpOverlay(root);
  renderTabBar(root, store, showHelp);
  renderSearchBar(root, store);
  const snippetEditorEl = renderSnippetEditor(root, store, () => fetchClips());
  renderClipList(root, store, {
    onSelect: handleSelect,
    onPin: handlePin,
  });
  renderSnippetButton(root, store, snippetEditorEl);
  renderStatusBar(root, store);

  let prevTab = store.getState().activeTab;
  let prevQuery = store.getState().query;

  store.subscribe((state) => {
    if (state.activeTab !== prevTab) {
      prevTab = state.activeTab;
      prevQuery = state.query;
      fetchClips(); // fetchClips calls invalidateIndex internally
    } else if (state.query !== prevQuery) {
      prevQuery = state.query;
      applySearch();
    }
  });

  applyTextSize(DEFAULT_SETTINGS.textSize);
  void loadPreferences();
  subscribeToSettingChanges();
  fetchClips();
  loadCount();

  document.addEventListener('keydown', (e) => handleKeydown(e, store));

  async function loadPreferences(): Promise<void> {
    try {
      const savedSettings = await sendMessage<Partial<UserSettings> | null>({
        type: MessageType.GET_SETTINGS,
        payload: undefined,
      });
      const settings = { ...DEFAULT_SETTINGS, ...(savedSettings ?? {}) };
      applyTextSize(settings.textSize);
    } catch {
      applyTextSize(DEFAULT_SETTINGS.textSize);
    }
  }

  function subscribeToSettingChanges(): void {
    chrome.storage.onChanged?.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      const settingsChange = changes[SETTINGS_SYNC_KEY];
      if (!settingsChange) return;
      const settings = {
        ...DEFAULT_SETTINGS,
        ...((settingsChange.newValue as Partial<UserSettings> | undefined) ?? {}),
      };
      applyTextSize(settings.textSize);
    });
  }

  async function fetchClips(): Promise<void> {
    store.setState({ loading: true });
    allClips = await sendMessage<ClipEntry[]>({
      type: MessageType.GET_CLIPS,
      payload: {
        tab: store.getState().activeTab,
        limit: PAGE_SIZE * 20,
        offset: 0,
      },
    }) || [];
    invalidateIndex();
    applySearch();
  }

  function applySearch(): void {
    const query = store.getState().query;
    const filtered = searchClips(query, allClips, PAGE_SIZE);
    store.setState({ clips: filtered, loading: false, selectedIndex: 0 });
  }

  async function loadCount(): Promise<void> {
    const result = await sendMessage<{ count: number }>({
      type: MessageType.CLIP_COUNT,
      payload: undefined,
    });
    store.setState({ totalCount: result?.count || 0 });
  }

  async function handleSelect(clip: ClipEntry): Promise<void> {
    await writeToClipboard(clip.content);
    showToast('Copied!');
    setTimeout(() => window.close(), 300);
  }

  async function handlePin(id: string): Promise<void> {
    if (store.getState().activeTab !== 'favorites') {
      // Optimistic update: flip the pin flag locally and re-render immediately.
      // No IDB round-trip needed since pin state doesn't affect clip visibility on this tab.
      const prevClips = allClips;
      allClips = allClips.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
      applySearch();
      sendMessage({ type: MessageType.TOGGLE_PIN, payload: { id } }).catch(() => {
        allClips = prevClips;
        applySearch();
      });
    } else {
      // On favorites the clip may disappear after unpin, so reload after confirming.
      await sendMessage({ type: MessageType.TOGGLE_PIN, payload: { id } });
      fetchClips();
    }
  }

  function handleKeydown(e: KeyboardEvent, store: Store<PopupState>): void {
    const state = store.getState();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        store.setState({
          selectedIndex: Math.min(state.selectedIndex + 1, state.clips.length - 1),
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        store.setState({
          selectedIndex: Math.max(state.selectedIndex - 1, 0),
        });
        break;

      case 'Enter': {
        e.preventDefault();
        if (state.selectedIndex < 0 || state.selectedIndex >= state.clips.length) break;
        const clip = state.clips[state.selectedIndex];
        if (clip) handleSelect(clip);
        break;
      }

      case 'Escape':
        window.close();
        break;

      case 'Tab': {
        // Let Tab work normally inside the snippet editor so fields are navigable
        const editorEl = document.querySelector('.jar-editor');
        if (editorEl && editorEl.contains(document.activeElement)) break;

        e.preventDefault();
        const tabs: PopupState['activeTab'][] = ['all', 'favorites', 'snippets'];
        const currentIdx = tabs.indexOf(state.activeTab);
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + tabs.length) % tabs.length
          : (currentIdx + 1) % tabs.length;
        store.setState({ activeTab: tabs[nextIdx], query: '', selectedIndex: 0 });
        break;
      }

      case 'Backspace': {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (state.selectedIndex < 0 || state.selectedIndex >= state.clips.length) break;
          const clipToDelete = state.clips[state.selectedIndex];
          if (clipToDelete) {
            sendMessage({ type: MessageType.DELETE_CLIP, payload: { id: clipToDelete.id } });
            const newClips = state.clips.filter((c: ClipEntry) => c.id !== clipToDelete.id);
            store.setState({
              clips: newClips,
              selectedIndex: Math.min(state.selectedIndex, newClips.length - 1),
            });
            showToast('Deleted');
          }
        }
        break;
      }

      case 's': {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (state.selectedIndex < 0 || state.selectedIndex >= state.clips.length) break;
          const clipToPin = state.clips[state.selectedIndex];
          if (clipToPin) handlePin(clipToPin.id);
        }
        break;
      }

      default: {
        // If a printable character is typed while focus is outside any input, redirect to search bar.
        // Focusing during keydown routes the subsequent keypress/input events to the new target,
        // so the first character is not lost.
        if (
          e.key.length === 1 &&
          !e.metaKey && !e.ctrlKey && !e.altKey
        ) {
          const active = document.activeElement;
          const tag = active?.tagName;
          if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            const searchInput = document.getElementById('search') as HTMLInputElement | null;
            searchInput?.focus();
          }
        }
        break;
      }
    }
  }
}

function renderStatusBar(container: HTMLElement, store: Store<PopupState>): void {
  const bar = document.createElement('div');
  bar.className = 'jar-status';

  const countSpan = document.createElement('span');
  const hintsSpan = document.createElement('span');
  hintsSpan.textContent = '\u21B5 copy \u00B7 \u2318\u232B delete \u00B7 Tab switch';

  bar.appendChild(countSpan);
  bar.appendChild(hintsSpan);

  store.subscribe((state) => {
    countSpan.textContent = `${state.totalCount} clips`;
  });
  countSpan.textContent = `${store.getState().totalCount} clips`;

  container.appendChild(bar);
}

function renderSnippetButton(
  container: HTMLElement,
  store: Store<PopupState>,
  editorEl: SnippetEditorElement,
): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'jar-snippet-btn-wrap hidden';

  const btn = document.createElement('button');
  btn.textContent = '+ New Snippet';
  btn.className = 'jar-snippet-add';
  btn.addEventListener('click', () => editorEl.show());

  wrapper.appendChild(btn);
  container.insertBefore(wrapper, container.lastElementChild);

  store.subscribe((state) => {
    wrapper.classList.toggle('hidden', state.activeTab !== 'snippets');
  });
}
