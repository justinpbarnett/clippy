export function renderHelpOverlay(container: HTMLElement): () => void {
  const overlay = document.createElement('div');
  overlay.className =
    'absolute inset-0 z-50 bg-white dark:bg-gray-900 flex-col overflow-y-auto hidden';

  const header = document.createElement('div');
  header.className =
    'flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0';

  const title = document.createElement('span');
  title.className = 'text-sm font-semibold text-gray-900 dark:text-gray-100';
  title.textContent = 'How to use Clipjar';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.className =
    'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm leading-none';
  closeBtn.addEventListener('click', hide);

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'px-3 py-2 flex flex-col gap-3 text-xs text-gray-700 dark:text-gray-300 overflow-y-auto';

  const sections: { heading: string; items: string[] }[] = [
    {
      heading: 'Copying',
      items: ['Click any clip to copy it instantly.', 'Or navigate with ↑↓ and press Enter.'],
    },
    {
      heading: 'Keyboard shortcuts',
      items: [
        '↑ ↓  — navigate the list',
        'Enter  — copy selected clip',
        'Tab / Shift+Tab  — switch tabs',
        '⌘⌫ or Ctrl+⌫  — delete selected clip',
        '⌘S or Ctrl+S  — pin/unpin selected clip',
        'Esc  — close',
      ],
    },
    {
      heading: 'Favorites',
      items: [
        'Click the ★ on any clip to pin it.',
        'Pinned clips appear in the Favorites tab.',
      ],
    },
    {
      heading: 'Snippets',
      items: [
        'Go to the Snippets tab and click + New Snippet.',
        'Enter a :shortcut and expansion text, then save.',
        'Type the shortcut in any text field on any page. It expands the moment you finish typing it.',
      ],
    },
    {
      heading: 'Search',
      items: ['Type in the search box. Fuzzy search across all clips.'],
    },
  ];

  for (const section of sections) {
    const group = document.createElement('div');
    group.className = 'flex flex-col gap-1';

    const heading = document.createElement('div');
    heading.className = 'font-semibold text-gray-900 dark:text-gray-100';
    heading.textContent = section.heading;
    group.appendChild(heading);

    for (const item of section.items) {
      const p = document.createElement('p');
      p.className = 'text-gray-600 dark:text-gray-400 leading-relaxed';
      p.textContent = item;
      group.appendChild(p);
    }

    body.appendChild(group);
  }

  overlay.appendChild(header);
  overlay.appendChild(body);
  container.appendChild(overlay);

  function show(): void {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }

  function hide(): void {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }

  return show;
}
