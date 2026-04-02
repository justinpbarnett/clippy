import { describe, it, expect } from 'vitest';
import { buildIndex, matchSnippet, EMPTY_INDEX } from '../src/lib/snippet-lookup';
import { ClipType, type ClipEntry } from '../src/lib/types';

function makeSnippet(shortcut: string, content: string): ClipEntry {
  return {
    id: crypto.randomUUID(),
    content,
    type: ClipType.PlainText,
    sourceUrl: '',
    sourceTitle: '',
    timestamp: Date.now(),
    pinned: false,
    isSnippet: true,
    shortcut,
    hash: '',
    charCount: content.length,
  };
}

describe('buildIndex', () => {
  it('builds a map from shortcuts to snippets', () => {
    const s = makeSnippet('hi', 'Hello there');
    const index = buildIndex([s]);
    expect(index.map.get('hi')).toBe(s);
    expect(index.maxLen).toBe(2);
  });

  it('tracks the longest shortcut length', () => {
    const index = buildIndex([
      makeSnippet('a', 'short'),
      makeSnippet('hello', 'longer'),
      makeSnippet('hi', 'medium'),
    ]);
    expect(index.maxLen).toBe(5);
  });

  it('skips snippets without a shortcut', () => {
    const noShortcut: ClipEntry = { ...makeSnippet('', 'x'), shortcut: undefined };
    const index = buildIndex([noShortcut]);
    expect(index.map.size).toBe(0);
    expect(index.maxLen).toBe(0);
  });

  it('returns empty index for empty input', () => {
    const index = buildIndex([]);
    expect(index.map.size).toBe(0);
    expect(index.maxLen).toBe(0);
  });
});

describe('matchSnippet', () => {
  it('matches when buffer ends with a shortcut', () => {
    const s = makeSnippet('ty', 'Thank you');
    const index = buildIndex([s]);
    expect(matchSnippet(index, 'please ty')).toBe(s);
  });

  it('matches exact buffer equal to shortcut', () => {
    const s = makeSnippet('brb', 'be right back');
    const index = buildIndex([s]);
    expect(matchSnippet(index, 'brb')).toBe(s);
  });

  it('returns undefined when no match', () => {
    const index = buildIndex([makeSnippet('hi', 'hello')]);
    expect(matchSnippet(index, 'bye')).toBeUndefined();
  });

  it('returns undefined for empty buffer', () => {
    const index = buildIndex([makeSnippet('hi', 'hello')]);
    expect(matchSnippet(index, '')).toBeUndefined();
  });

  it('returns undefined for empty index', () => {
    expect(matchSnippet(EMPTY_INDEX, 'hi')).toBeUndefined();
  });

  it('prefers longer matches when shortcuts overlap', () => {
    const short = makeSnippet('t', 'short');
    const long = makeSnippet('ty', 'Thank you');
    const index = buildIndex([short, long]);
    // buffer ends with 'ty' — should match the longer shortcut
    expect(matchSnippet(index, 'please ty')).toBe(long);
  });

  it('only considers the tail of the buffer up to maxLen', () => {
    const s = makeSnippet('hi', 'Hello');
    const index = buildIndex([s]);
    // 'hi' is buried deeper than maxLen from the end — should not match
    expect(matchSnippet(index, 'hi' + 'x'.repeat(10))).toBeUndefined();
  });
});
