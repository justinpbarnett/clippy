import fuzzysort from 'fuzzysort';
import type { ClipEntry } from './types';

interface SearchableClip {
  id: string;
  prepared: Fuzzysort.Prepared | null;
  entry: ClipEntry;
}

let searchIndex: SearchableClip[] | null = null;

export function buildIndex(clips: ClipEntry[]): void {
  searchIndex = clips.map((c) => ({
    id: c.id,
    prepared: fuzzysort.prepare(c.content.slice(0, 500)),
    entry: c,
  }));
}

export function invalidateIndex(): void {
  searchIndex = null;
}

export function searchClips(
  query: string,
  clips: ClipEntry[],
  limit = 50,
): ClipEntry[] {
  if (!query.trim()) return clips.slice(0, limit);

  if (!searchIndex || searchIndex.length !== clips.length) {
    buildIndex(clips);
  }

  const results = fuzzysort.go(query, searchIndex!, {
    key: 'prepared',
    limit,
    threshold: -1000,
  });

  return results.map((r) => r.obj.entry);
}

// fuzzysort.highlight() HTML-escapes user input before inserting <mark> tags,
// so the returned string is safe to set via innerHTML.
function highlightMatch(text: string, query: string): string {
  if (!query) return escapeHtml(text);

  const result = fuzzysort.single(query, text.slice(0, 500));
  if (!result) return escapeHtml(text);

  return result.highlight('<mark>', '</mark>') || escapeHtml(text);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
