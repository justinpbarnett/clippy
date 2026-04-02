import type { ClipEntry } from './types';

export interface SnippetIndex {
  map: Map<string, ClipEntry>;
  maxLen: number;
}

export const EMPTY_INDEX: SnippetIndex = { map: new Map(), maxLen: 0 };

export function buildIndex(snippets: ClipEntry[]): SnippetIndex {
  const map = new Map<string, ClipEntry>();
  let maxLen = 0;
  for (const snippet of snippets) {
    if (snippet.shortcut) {
      map.set(snippet.shortcut, snippet);
      if (snippet.shortcut.length > maxLen) maxLen = snippet.shortcut.length;
    }
  }
  return { map, maxLen };
}

export function matchSnippet(index: SnippetIndex, buffer: string): ClipEntry | undefined {
  if (index.map.size === 0 || buffer.length === 0) return undefined;
  const tail = buffer.slice(-index.maxLen);
  for (let len = tail.length; len >= 1; len--) {
    const match = index.map.get(tail.slice(-len));
    if (match) return match;
  }
  return undefined;
}
