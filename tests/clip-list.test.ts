// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderClipList } from '../src/popup/components/ClipList';
import { createStore } from '../src/lib/store';
import { initialState } from '../src/popup/state';
import { ClipType, type ClipEntry } from '../src/lib/types';

function makeClip(id: string, content = `clip ${id}`, pinned = false): ClipEntry {
  return {
    id,
    content,
    type: ClipType.PlainText,
    sourceUrl: '',
    sourceTitle: '',
    timestamp: Date.now(),
    pinned,
    isSnippet: false,
    hash: id,
    charCount: content.length,
  };
}

function setup(overrides: Partial<typeof initialState> = {}) {
  const container = document.createElement('div');
  const store = createStore({ ...initialState, ...overrides });
  const callbacks = { onSelect: vi.fn(), onPin: vi.fn() };
  renderClipList(container, store, callbacks);
  const listEl = container.querySelector('#clip-list') as HTMLElement;
  return { container, store, callbacks, listEl };
}

describe('renderClipList', () => {
  describe('initial render', () => {
    it('shows loading state', () => {
      const { listEl } = setup({ loading: true });
      expect(listEl.textContent).toContain('Loading');
    });

    it('shows empty message when no clips on all tab', () => {
      const { listEl } = setup({ loading: false, clips: [] });
      expect(listEl.textContent).toContain('No clips yet');
    });

    it('shows favorites empty message on favorites tab', () => {
      const { listEl } = setup({ loading: false, clips: [], activeTab: 'favorites' });
      expect(listEl.textContent).toContain('No favorites');
    });

    it('shows snippets empty message on snippets tab', () => {
      const { listEl } = setup({ loading: false, clips: [], activeTab: 'snippets' });
      expect(listEl.textContent).toContain('No snippets');
    });

    it('shows no-matches message when query returns no results', () => {
      const { listEl } = setup({ loading: false, clips: [], query: 'zzzz' });
      expect(listEl.textContent).toContain('No matches');
    });

    it('renders one element per clip', () => {
      const clips = [makeClip('a'), makeClip('b'), makeClip('c')];
      const { listEl } = setup({ loading: false, clips });
      expect(listEl.querySelectorAll('[data-id]')).toHaveLength(3);
    });

    it('sets selected class on the correct item', () => {
      const clips = [makeClip('a'), makeClip('b')];
      const { listEl } = setup({ loading: false, clips, selectedIndex: 1 });
      expect(listEl.children[0].classList.contains('selected')).toBe(false);
      expect(listEl.children[1].classList.contains('selected')).toBe(true);
    });
  });

  describe('differential render fast path', () => {
    it('swaps selection classes without rebuilding DOM when only selectedIndex changes', () => {
      const clips = [makeClip('a'), makeClip('b')];
      const { listEl, store } = setup({ loading: false, clips, selectedIndex: 0 });

      const el0 = listEl.children[0];
      const el1 = listEl.children[1];
      expect(el0.classList.contains('selected')).toBe(true);

      // Only selectedIndex changes — same clips array reference
      store.setState({ selectedIndex: 1 });

      // Fast path: same DOM nodes, just class swap
      expect(listEl.children[0]).toBe(el0);
      expect(listEl.children[1]).toBe(el1);
      expect(el0.classList.contains('selected')).toBe(false);
      expect(el1.classList.contains('selected')).toBe(true);
    });

    it('rebuilds DOM when clips array reference changes', () => {
      const clips = [makeClip('a'), makeClip('b')];
      const { listEl, store } = setup({ loading: false, clips });

      const oldEl0 = listEl.children[0];
      store.setState({ clips: [...clips, makeClip('c')] }); // new reference

      expect(listEl.children.length).toBe(3);
      expect(listEl.children[0]).not.toBe(oldEl0);
    });

    it('rebuilds DOM when loading state changes', () => {
      const clips = [makeClip('a')];
      const { listEl, store } = setup({ loading: false, clips });
      const oldEl0 = listEl.children[0];

      store.setState({ loading: true });

      expect(listEl.children[0]).not.toBe(oldEl0);
      expect(listEl.textContent).toContain('Loading');
    });

    it('handles selectedIndex out of bounds gracefully in fast path', () => {
      const clips = [makeClip('a'), makeClip('b')];
      const { listEl, store } = setup({ loading: false, clips, selectedIndex: 0 });
      const el0 = listEl.children[0];

      // selectedIndex beyond bounds — should not throw
      expect(() => store.setState({ selectedIndex: 99 })).not.toThrow();
      expect(listEl.children[0]).toBe(el0); // fast path taken
    });
  });

  describe('event delegation', () => {
    it('calls onPin with clip id when pin button clicked', () => {
      const clips = [makeClip('x', 'hello')];
      const { listEl, callbacks } = setup({ loading: false, clips });

      const pinBtn = listEl.querySelector('.jar-pin') as HTMLButtonElement;
      pinBtn.click();

      expect(callbacks.onPin).toHaveBeenCalledWith('x');
    });

    it('pin button click does not trigger onSelect', () => {
      const clips = [makeClip('x', 'hello')];
      const { listEl, callbacks } = setup({ loading: false, clips });

      const pinBtn = listEl.querySelector('.jar-pin') as HTMLButtonElement;
      pinBtn.click();

      expect(callbacks.onSelect).not.toHaveBeenCalled();
    });

    it('calls onSelect when clip body is clicked', () => {
      const clips = [makeClip('x', 'hello')];
      const { listEl, callbacks } = setup({ loading: false, clips });

      const clipEl = listEl.querySelector('.jar-clip') as HTMLElement;
      clipEl.click();

      expect(callbacks.onSelect).toHaveBeenCalledWith(clips[0]);
    });
  });

  describe('pin state rendering', () => {
    it('pinned clip shows filled star', () => {
      const clips = [makeClip('p', 'pinned', true)];
      const { listEl } = setup({ loading: false, clips });
      const pinBtn = listEl.querySelector('.jar-pin') as HTMLButtonElement;
      expect(pinBtn.classList.contains('pinned')).toBe(true);
    });

    it('unpinned clip shows empty star', () => {
      const clips = [makeClip('u', 'unpinned', false)];
      const { listEl } = setup({ loading: false, clips });
      const pinBtn = listEl.querySelector('.jar-pin') as HTMLButtonElement;
      expect(pinBtn.classList.contains('pinned')).toBe(false);
    });
  });
});
