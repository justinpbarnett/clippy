import { describe, it, expect } from 'vitest';
import { searchClips, invalidateIndex } from '../src/lib/search';
import { ClipType, type ClipEntry } from '../src/lib/types';

function makeClip(content: string, id?: string): ClipEntry {
  return {
    id: id || crypto.randomUUID(),
    content,
    type: ClipType.PlainText,
    sourceUrl: 'https://example.com',
    sourceTitle: 'Test',
    timestamp: Date.now(),
    pinned: false,
    isSnippet: false,
    hash: '',
    charCount: content.length,
  };
}

describe('searchClips', () => {
  beforeEach(() => invalidateIndex());

  it('returns all clips when query is empty', () => {
    const clips = [makeClip('hello'), makeClip('world')];
    const results = searchClips('', clips);
    expect(results).toHaveLength(2);
  });

  it('filters clips by fuzzy query', () => {
    const clips = [
      makeClip('the quick brown fox'),
      makeClip('lazy dog sleeping'),
      makeClip('fox jumped high'),
    ];
    const results = searchClips('fox', clips);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every((r) => r.content.includes('fox'))).toBe(true);
  });

  it('respects limit', () => {
    const clips = Array.from({ length: 100 }, (_, i) => makeClip(`clip ${i}`));
    const results = searchClips('', clips, 10);
    expect(results).toHaveLength(10);
  });

  it('returns empty for no matches', () => {
    const clips = [makeClip('hello world')];
    const results = searchClips('zzzzzzzzz', clips);
    expect(results).toHaveLength(0);
  });

  it('handles fuzzy matching', () => {
    const clips = [makeClip('clipboard manager extension')];
    const results = searchClips('clpmgr', clips);
    expect(results).toHaveLength(1);
  });
});
