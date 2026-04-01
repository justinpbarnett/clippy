import type { Store } from '../../lib/store';
import type { PopupState } from '../state';

const TABS = ['all', 'favorites', 'snippets'] as const;
const LABELS: Record<string, string> = {
  all: 'All',
  favorites: 'Favorites',
  snippets: 'Snippets',
};

export function renderTabBar(container: HTMLElement, store: Store<PopupState>): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex border-b border-gray-200 dark:border-gray-700 px-2 pt-2';

  const buttons: HTMLButtonElement[] = [];

  for (const tab of TABS) {
    const btn = document.createElement('button');
    btn.textContent = LABELS[tab];
    btn.dataset.tab = tab;
    btn.className = getTabClass(tab === store.getState().activeTab);
    btn.addEventListener('click', () => {
      store.setState({ activeTab: tab, selectedIndex: 0, query: '' });
    });
    buttons.push(btn);
    wrapper.appendChild(btn);
  }

  store.subscribe((state) => {
    buttons.forEach((btn) => {
      const isActive = btn.dataset.tab === state.activeTab;
      btn.className = getTabClass(isActive);
    });
  });

  container.appendChild(wrapper);
}

function getTabClass(active: boolean): string {
  const base = 'px-3 py-1.5 text-xs font-medium rounded-t transition-colors ';
  if (active) {
    return base + 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400';
  }
  return base + 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300';
}
