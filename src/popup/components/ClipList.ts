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

  function render(state: PopupState) {
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

    for (let i = 0; i < state.clips.length; i++) {
      const clip = state.clips[i];
      const el = createClipItemElement(clip, i === state.selectedIndex, callbacks.onPin);
      el.addEventListener('click', () => callbacks.onSelect(clip));
      listEl.appendChild(el);
    }

    const selectedEl = listEl.children[state.selectedIndex] as HTMLElement | undefined;
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }

  store.subscribe(render);
  render(store.getState());

  container.appendChild(listEl);
}
