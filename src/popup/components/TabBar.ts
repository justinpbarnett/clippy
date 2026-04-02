import type { Store } from '../../lib/store';
import type { PopupState } from '../state';

// Mason jar silhouette SVG
const JAR_SVG = `<svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="0.5" width="9" height="2.5" rx="0.8" fill="currentColor" opacity="0.85"/>
  <rect x="3.5" y="3" width="6" height="1.5" fill="currentColor" opacity="0.55"/>
  <path d="M1.5 4.5L1 14Q1 15.5 2.5 15.5H10.5Q12 15.5 12 14L11.5 4.5Z" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.65" stroke-width="0.9"/>
  <line x1="3.5" y1="6" x2="3" y2="13.5" stroke="currentColor" stroke-width="0.9" opacity="0.25" stroke-linecap="round"/>
</svg>`;

const TABS = ['all', 'favorites', 'snippets'] as const;
const LABELS: Record<string, string> = {
  all: 'All',
  favorites: 'Faves',
  snippets: 'Snippets',
};

export function renderTabBar(
  container: HTMLElement,
  store: Store<PopupState>,
  onHelp: () => void,
): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'jar-header';

  // Logo
  const logo = document.createElement('div');
  logo.className = 'jar-logo';
  logo.innerHTML = JAR_SVG;
  logo.querySelector('svg')!.style.cssText = 'color:var(--j-amber);display:block;flex-shrink:0';

  const logotype = document.createElement('span');
  logotype.className = 'jar-logotype';
  logotype.textContent = 'Clipjar';
  logo.appendChild(logotype);
  wrapper.appendChild(logo);

  // Tabs
  const tabsEl = document.createElement('div');
  tabsEl.className = 'jar-tabs';

  const buttons: HTMLButtonElement[] = [];

  for (const tab of TABS) {
    const btn = document.createElement('button');
    btn.textContent = LABELS[tab];
    btn.dataset.tab = tab;
    btn.className = 'jar-tab' + (tab === store.getState().activeTab ? ' active' : '');
    btn.addEventListener('click', () => {
      store.setState({ activeTab: tab, selectedIndex: 0, query: '' });
    });
    buttons.push(btn);
    tabsEl.appendChild(btn);
  }

  store.subscribe((state) => {
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
  });

  wrapper.appendChild(tabsEl);

  // Help button
  const helpBtn = document.createElement('button');
  helpBtn.textContent = '?';
  helpBtn.title = 'Help';
  helpBtn.className = 'jar-help';
  helpBtn.addEventListener('click', onHelp);
  wrapper.appendChild(helpBtn);

  container.appendChild(wrapper);
}
