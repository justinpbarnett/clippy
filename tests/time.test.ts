import { describe, it, expect } from 'vitest';
import { timeAgo } from '../src/lib/time';

describe('timeAgo', () => {
  it('shows "just now" for recent timestamps', () => {
    expect(timeAgo(Date.now() - 5_000)).toBe('just now');
  });

  it('shows minutes', () => {
    expect(timeAgo(Date.now() - 3 * 60_000)).toBe('3m ago');
  });

  it('shows hours', () => {
    expect(timeAgo(Date.now() - 2 * 3_600_000)).toBe('2h ago');
  });

  it('shows days', () => {
    expect(timeAgo(Date.now() - 3 * 86_400_000)).toBe('3d ago');
  });

  it('shows date for old timestamps', () => {
    const ts = Date.now() - 30 * 86_400_000;
    expect(timeAgo(ts)).toBe(new Date(ts).toLocaleDateString());
  });
});
