import type { Store } from '../../lib/store';
import type { PopupState } from '../state';

export function renderSearchBar(container: HTMLElement, store: Store<PopupState>): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'px-3 py-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'search';
  input.placeholder = 'Search clips...';
  input.className =
    'w-full px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm ' +
    'border border-transparent focus:border-blue-500 outline-none ' +
    'text-gray-900 dark:text-gray-100 placeholder-gray-400';

  let debounceTimer: ReturnType<typeof setTimeout>;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      store.setState({ query: input.value, selectedIndex: 0 });
    }, 50);
  });

  store.subscribe((state) => {
    if (input.value !== state.query) {
      input.value = state.query;
    }
  });

  wrapper.appendChild(input);
  container.appendChild(wrapper);

  requestAnimationFrame(() => input.focus());
}
