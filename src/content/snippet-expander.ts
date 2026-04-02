import { MessageType, type ClipEntry } from '../lib/types';
import { SNIPPET_BUFFER_SIZE } from '../lib/constants';

let snippets: ClipEntry[] = [];
let snippetMap = new Map<string, ClipEntry>();
let maxShortcutLen = 0;
let buffer = '';

async function loadSnippets(): Promise<void> {
  try {
    snippets = await chrome.runtime.sendMessage({
      type: MessageType.GET_SNIPPETS,
      payload: undefined,
    }) || [];
    rebuildSnippetMap();
  } catch (err) {
    console.warn('[clipjar] failed to load snippets:', err);
    snippets = [];
    snippetMap = new Map();
    maxShortcutLen = 0;
  }
}

function rebuildSnippetMap(): void {
  snippetMap = new Map();
  maxShortcutLen = 0;
  for (const snippet of snippets) {
    if (snippet.shortcut) {
      snippetMap.set(snippet.shortcut, snippet);
      if (snippet.shortcut.length > maxShortcutLen) maxShortcutLen = snippet.shortcut.length;
    }
  }
}

function findMatchingSnippet(): ClipEntry | undefined {
  if (snippetMap.size === 0 || buffer.length === 0) return undefined;
  const tail = buffer.slice(-maxShortcutLen);
  for (let len = tail.length; len >= 1; len--) {
    const match = snippetMap.get(tail.slice(-len));
    if (match) return match;
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

document.addEventListener('keyup', handleKeydown, true);
