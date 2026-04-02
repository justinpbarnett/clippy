import { MessageType, type ClipEntry } from '../lib/types';
import { SNIPPET_BUFFER_SIZE } from '../lib/constants';

let snippets: ClipEntry[] = [];
let buffer = '';

async function loadSnippets(): Promise<void> {
  try {
    snippets = await chrome.runtime.sendMessage({
      type: MessageType.GET_SNIPPETS,
      payload: undefined,
    }) || [];
  } catch (err) {
    console.warn('[clippy] failed to load snippets:', err);
    snippets = [];
  }
}

function findMatchingSnippet(): ClipEntry | undefined {
  for (const snippet of snippets) {
    if (snippet.shortcut && buffer.endsWith(snippet.shortcut)) {
      return snippet;
    }
  }
  return undefined;
}

function replaceInInput(el: HTMLInputElement | HTMLTextAreaElement, shortcut: string, expansion: string): void {
  const start = el.selectionStart ?? el.value.length;
  const before = el.value.slice(0, start - shortcut.length);
  const after = el.value.slice(start);
  el.value = before + expansion + after;
  const newPos = before.length + expansion.length;
  el.setSelectionRange(newPos, newPos);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function replaceInContentEditable(shortcut: string, expansion: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) return;

  const text = textNode.textContent || '';
  const offset = range.startOffset;
  const shortcutStart = offset - shortcut.length;

  if (shortcutStart < 0) return;
  if (text.slice(shortcutStart, offset) !== shortcut) return;

  textNode.textContent = text.slice(0, shortcutStart) + expansion + text.slice(offset);
  const newRange = document.createRange();
  newRange.setStart(textNode, shortcutStart + expansion.length);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key.length === 1) {
    buffer += e.key;
    if (buffer.length > SNIPPET_BUFFER_SIZE) buffer = buffer.slice(-SNIPPET_BUFFER_SIZE);
  } else if (e.key === 'Backspace') {
    buffer = buffer.slice(0, -1);
  } else if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
    buffer = '';
    return;
  } else {
    return;
  }

  const match = findMatchingSnippet();
  if (!match || !match.shortcut) return;

  e.preventDefault();

  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    replaceInInput(active, match.shortcut, match.content);
  } else if (active?.getAttribute('contenteditable') === 'true') {
    replaceInContentEditable(match.shortcut, match.content);
  }

  buffer = '';
}

// Initialize
loadSnippets();

// Reload snippets periodically (every 30s) in case user adds new ones
const snippetIntervalId = setInterval(loadSnippets, 30_000);
window.addEventListener('pagehide', () => clearInterval(snippetIntervalId));

// Reload immediately when a new snippet is saved
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MessageType.SNIPPETS_UPDATED) loadSnippets();
});

document.addEventListener('keydown', handleKeydown, true);
