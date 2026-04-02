import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../src/lib/store';

describe('createStore', () => {
  it('returns initial state', () => {
    const store = createStore({ count: 0, name: 'test' });
    expect(store.getState()).toEqual({ count: 0, name: 'test' });
  });

  it('merges partial updates without touching other keys', () => {
    const store = createStore({ a: 1, b: 2 });
    store.setState({ a: 99 });
    expect(store.getState()).toEqual({ a: 99, b: 2 });
  });

  it('applies multiple updates', () => {
    const store = createStore({ val: 'a' });
    store.setState({ val: 'b' });
    store.setState({ val: 'c' });
    expect(store.getState().val).toBe('c');
  });

  it('notifies all subscribers on update', () => {
    const store = createStore({ x: 0 });
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    store.subscribe(fn1);
    store.subscribe(fn2);
    store.setState({ x: 5 });
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn1).toHaveBeenCalledWith({ x: 5 });
    expect(fn2).toHaveBeenCalledWith({ x: 5 });
  });

  it('passes full merged state to subscribers', () => {
    const store = createStore({ a: 1, b: 2 });
    const fn = vi.fn();
    store.subscribe(fn);
    store.setState({ a: 10 });
    expect(fn).toHaveBeenCalledWith({ a: 10, b: 2 });
  });

  it('unsubscribe stops notifications', () => {
    const store = createStore({ x: 0 });
    const fn = vi.fn();
    const unsub = store.subscribe(fn);
    unsub();
    store.setState({ x: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('unsubscribing one listener does not affect others', () => {
    const store = createStore({ x: 0 });
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const unsub1 = store.subscribe(fn1);
    store.subscribe(fn2);
    unsub1();
    store.setState({ x: 1 });
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });
});
