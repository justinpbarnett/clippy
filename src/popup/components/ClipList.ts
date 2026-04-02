import type { Store } from '../../lib/store';
import type { PopupState } from '../state';
import type { ClipEntry } from '../../lib/types';
import { createClipItemElement } from './ClipItem';

export function renderClipList(
  container: HTMLElement,
  store: Store<PopupState>,
  callbacks: {
    onSelect: (clip: ClipEntry) => void;
    onPin: (id: string) => void;
  },
): void {
  const listEl = document.createElement('div');
  listEl.id = 'clip-list';
  listEl.className = 'jar-list';

  const emptyEl = document.createElement('div');
  emptyEl.className = 'jar-empty';

  let prevClips: ClipEntry[] | null = null;
  let prevSelectedIndex = -1;
  let prevLoading = false;

  // Single delegated listener instead of one per item.
  // Pin button uses stopPropagation so it won't reach here.
  listEl.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.jar-clip') as HTMLElement | null;
    if (!target) return;
    const clip = store.getState().clips.find((c) => c.id === target.dataset.id);
    if (clip) callbacks.onSelect(clip);
  });

  function render(state: PopupState): void {
    // Fast path: only selection changed — swap classes, no DOM rebuild.
    if (
      state.clips === prevClips &&
      state.loading === prevLoading &&
      state.selectedIndex !== prevSelectedIndex
    ) {
      const oldEl = listEl.children[prevSelectedIndex] as HTMLElement | undefined;
      const newEl = listEl.children[state.selectedIndex] as HTMLElement | undefined;
      oldEl?.classList.remove('selected');
      newEl?.classList.add('selected');
      newEl?.scrollIntoView({ block: 'nearest' });
      prevSelectedIndex = state.selectedIndex;
      return;
    }

    prevClips = state.clips;
    prevLoading = state.loading;
    prevSelectedIndex = state.selectedIndex;

    listEl.replaceChildren();

    if (state.loading) {
      emptyEl.textContent = 'Loading...';
      listEl.appendChild(emptyEl);
      return;
    }

    if (state.clips.length === 0) {
      if (state.query) {
        emptyEl.textContent = 'No matches found.';
      } else if (state.activeTab === 'favorites') {
        emptyEl.textContent = 'No favorites yet. Star a clip to pin it here.';
      } else if (state.activeTab === 'snippets') {
        emptyEl.textContent = 'No snippets yet. Create one to get started.';
      } else {
        emptyEl.textContent = 'No clips yet. Copy something to get started.';
      }
      listEl.appendChild(emptyEl);
      return;
    }

    const frag = document.createDocumentFragment();
    for (let i = 0; i < state.clips.length; i++) {
      frag.appendChild(
        createClipItemElement(state.clips[i], i === state.selectedIndex, callbacks.onPin),
      );
    }
    listEl.appendChild(frag);

    const selectedEl = listEl.children[state.selectedIndex] as HTMLElement | undefined;
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }

  store.subscribe(render);
  render(store.getState());

  container.appendChild(listEl);
}
