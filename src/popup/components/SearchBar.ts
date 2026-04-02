import type { Store } from '../../lib/store';
import type { PopupState } from '../state';

export function renderSearchBar(container: HTMLElement, store: Store<PopupState>): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'jar-search-wrap';

  const icon = document.createElement('span');
  icon.className = 'jar-search-icon';
  icon.textContent = '⌕';
  wrapper.appendChild(icon);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'search';
  input.placeholder = 'search clips...';
  input.className = 'jar-search';

  let debounceTimer: ReturnType<typeof setTimeout>;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      store.setState({ query: input.value, selectedIndex: 0 });
    }, 50);
  });

  store.subscribe((state) => {
    if (input.value !== state.query) input.value = state.query;
  });

  wrapper.appendChild(input);
  container.appendChild(wrapper);

  requestAnimationFrame(() => input.focus());
}
