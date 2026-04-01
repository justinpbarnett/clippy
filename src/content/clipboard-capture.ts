import { MessageType } from '../lib/types';
import type { ClipCapturedPayload } from '../lib/types';

function isPasswordField(): boolean {
  const active = document.activeElement;
  if (!active) return false;

  if (active instanceof HTMLInputElement && active.type === 'password') return true;

  if (active.shadowRoot) {
    const inner = active.shadowRoot.activeElement;
    if (inner instanceof HTMLInputElement && inner.type === 'password') return true;
  }

  const ariaLabel = active.getAttribute('aria-label')?.toLowerCase() ?? '';
  if (ariaLabel.includes('password')) return true;

  return false;
}

function getRichContent(): string | undefined {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return undefined;

  try {
    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const div = document.createElement('div');
    div.appendChild(fragment);
    const html = div.innerHTML;
    if (html && html !== div.textContent) return html;
  } catch {
    // Shadow DOM or restricted context
  }

  return undefined;
}

document.addEventListener('copy', () => {
  if (isPasswordField()) return;

  const text = window.getSelection()?.toString();
  if (!text || text.trim().length === 0) return;

  const payload: ClipCapturedPayload = {
    content: text,
    richContent: getRichContent(),
    sourceUrl: location.href,
    sourceTitle: document.title,
  };

  chrome.runtime.sendMessage({
    type: MessageType.CLIP_CAPTURED,
    payload,
  });
});
