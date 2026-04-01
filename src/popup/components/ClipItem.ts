import type { ClipEntry } from '../../lib/types';
import { timeAgo } from '../../lib/time';

const TYPE_COLORS: Record<string, string> = {
  url: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  email: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  phone: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  code: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  json: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  text: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  image: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  richtext: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
};

const TYPE_LABELS: Record<string, string> = {
  url: 'URL',
  email: 'Email',
  phone: 'Phone',
  code: 'Code',
  json: 'JSON',
  text: 'Text',
  image: 'Image',
  richtext: 'Rich',
};

export function createClipItemElement(
  clip: ClipEntry,
  selected: boolean,
  onPin: (id: string) => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'clip-item flex items-center px-3 py-2 cursor-pointer border-l-2 ' +
    (selected
      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50');
  el.dataset.id = clip.id;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'flex-1 min-w-0';

  const textDiv = document.createElement('div');
  textDiv.className = 'text-sm truncate text-gray-900 dark:text-gray-100';

  if (clip.isSnippet && clip.shortcut) {
    const shortcutSpan = document.createElement('span');
    shortcutSpan.className = 'text-blue-500 font-mono mr-1.5';
    shortcutSpan.textContent = clip.shortcut;
    textDiv.appendChild(shortcutSpan);
  }

  const contentText = document.createTextNode(
    clip.content.replace(/\n/g, ' ').slice(0, 200),
  );
  textDiv.appendChild(contentText);
  contentDiv.appendChild(textDiv);

  const metaDiv = document.createElement('div');
  metaDiv.className = 'flex items-center gap-2 mt-0.5';

  const badge = document.createElement('span');
  badge.className = `text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[clip.type] || TYPE_COLORS.text}`;
  badge.textContent = TYPE_LABELS[clip.type] || 'Text';
  metaDiv.appendChild(badge);

  const time = document.createElement('span');
  time.className = 'text-[10px] text-gray-400';
  time.textContent = timeAgo(clip.timestamp);
  metaDiv.appendChild(time);

  if (clip.sourceUrl) {
    try {
      const hostname = new URL(clip.sourceUrl).hostname;
      if (hostname) {
        const source = document.createElement('span');
        source.className = 'text-[10px] text-gray-400 truncate max-w-[120px]';
        source.textContent = hostname;
        metaDiv.appendChild(source);
      }
    } catch {
      // invalid URL, skip
    }
  }

  contentDiv.appendChild(metaDiv);
  el.appendChild(contentDiv);

  const starBtn = document.createElement('button');
  starBtn.className = `star-btn p-1 flex-shrink-0 text-sm ${clip.pinned ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`;
  starBtn.textContent = clip.pinned ? '\u2605' : '\u2606';
  starBtn.title = clip.pinned ? 'Unpin' : 'Pin';
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onPin(clip.id);
  });
  el.appendChild(starBtn);

  return el;
}
