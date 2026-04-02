import type { ClipEntry } from '../../lib/types';
import { timeAgo } from '../../lib/time';

const BADGE_CLASS: Record<string, string> = {
  url:      'jar-badge jar-badge-url',
  email:    'jar-badge jar-badge-email',
  phone:    'jar-badge jar-badge-phone',
  code:     'jar-badge jar-badge-code',
  json:     'jar-badge jar-badge-json',
  text:     'jar-badge jar-badge-text',
  image:    'jar-badge jar-badge-image',
  richtext: 'jar-badge jar-badge-richtext',
};

const TYPE_LABELS: Record<string, string> = {
  url:      'URL',
  email:    'Email',
  phone:    'Phone',
  code:     'Code',
  json:     'JSON',
  text:     'Text',
  image:    'Img',
  richtext: 'Rich',
};

export function createClipItemElement(
  clip: ClipEntry,
  selected: boolean,
  onPin: (id: string) => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'jar-clip' + (selected ? ' selected' : '');
  el.dataset.id = clip.id;

  const body = document.createElement('div');
  body.className = 'jar-clip-body';

  // Content text
  const textDiv = document.createElement('div');
  textDiv.className = 'jar-clip-text';

  if (clip.isSnippet && clip.shortcut) {
    const shortcutSpan = document.createElement('span');
    shortcutSpan.className = 'jar-clip-shortcut';
    shortcutSpan.textContent = clip.shortcut;
    textDiv.appendChild(shortcutSpan);
  }

  textDiv.appendChild(
    document.createTextNode(clip.content.replace(/\n/g, ' ').slice(0, 200)),
  );
  body.appendChild(textDiv);

  // Meta row
  const meta = document.createElement('div');
  meta.className = 'jar-clip-meta';

  const badge = document.createElement('span');
  badge.className = BADGE_CLASS[clip.type] || BADGE_CLASS.text;
  badge.textContent = TYPE_LABELS[clip.type] || 'Text';
  meta.appendChild(badge);

  const time = document.createElement('span');
  time.className = 'jar-clip-time';
  time.textContent = timeAgo(clip.timestamp);
  meta.appendChild(time);

  if (clip.sourceUrl) {
    try {
      const hostname = new URL(clip.sourceUrl).hostname;
      if (hostname) {
        const src = document.createElement('span');
        src.className = 'jar-clip-source';
        src.textContent = hostname;
        meta.appendChild(src);
      }
    } catch {
      // invalid URL
    }
  }

  body.appendChild(meta);
  el.appendChild(body);

  // Pin button
  const pin = document.createElement('button');
  pin.className = 'jar-pin' + (clip.pinned ? ' pinned' : '');
  pin.textContent = clip.pinned ? '\u2605' : '\u2606';
  pin.title = clip.pinned ? 'Unpin' : 'Pin';
  pin.addEventListener('click', (e) => {
    e.stopPropagation();
    onPin(clip.id);
  });
  el.appendChild(pin);

  return el;
}
