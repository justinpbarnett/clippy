import { createStore, type Store } from '../lib/store';
import { sendMessage } from '../lib/messages';
import { writeToClipboard } from '../lib/clipboard-write';
import { searchClips, invalidateIndex } from '../lib/search';
import { MessageType, type ClipEntry } from '../lib/types';
import { PAGE_SIZE } from '../lib/constants';
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

  // Layout
  root.className = 'relative w-[380px] max-h-[500px] flex flex-col bg-white dark:bg-gray-900';

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

  // Load clips on tab change; filter on query change
  let prevTab = store.getState().activeTab;
  let prevQuery = store.getState().query;

  store.subscribe((state) => {
    if (state.activeTab !== prevTab) {
      prevTab = state.activeTab;
      prevQuery = state.query;
      invalidateIndex();
      fetchClips();
    } else if (state.query !== prevQuery) {
      prevQuery = state.query;
      applySearch();
    }
  });

  // Initial load
  fetchClips();
  loadCount();

  // Keyboard navigation
  document.addEventListener('keydown', (e) => handleKeydown(e, store));

  async function fetchClips(): Promise<void> {
    store.setState({ loading: true });
    allClips = await sendMessage<ClipEntry[]>({
      type: MessageType.GET_CLIPS,
      payload: {
        tab: store.getState().activeTab,
        limit: PAGE_SIZE * 20, // fetch more for client-side search
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
    await sendMessage({ type: MessageType.TOGGLE_PIN, payload: { id } });
    fetchClips();
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
        const clip = state.clips[state.selectedIndex];
        if (clip) handleSelect(clip);
        break;
      }

      case 'Escape':
        window.close();
        break;

      case 'Tab': {
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
          const clipToPin = state.clips[state.selectedIndex];
          if (clipToPin) handlePin(clipToPin.id);
        }
        break;
      }
    }
  }
}

function renderStatusBar(container: HTMLElement, store: Store<PopupState>): void {
  const bar = document.createElement('div');
  bar.className =
    'px-3 py-1 text-[10px] text-gray-400 border-t border-gray-200 dark:border-gray-700 ' +
    'flex justify-between items-center flex-shrink-0';

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
  wrapper.className = 'hidden px-3 py-1 border-t border-gray-200 dark:border-gray-700 flex-shrink-0';

  const btn = document.createElement('button');
  btn.textContent = '+ New Snippet';
  btn.className =
    'w-full py-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 ' +
    'dark:hover:text-blue-300 font-medium';
  btn.addEventListener('click', () => {
    editorEl.show();
  });

  wrapper.appendChild(btn);
  container.insertBefore(wrapper, container.lastElementChild);

  store.subscribe((state) => {
    if (state.activeTab === 'snippets') {
      wrapper.classList.remove('hidden');
    } else {
      wrapper.classList.add('hidden');
    }
  });
}
