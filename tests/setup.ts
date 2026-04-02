import { vi } from 'vitest';

// Stub scrollIntoView — not implemented in jsdom
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}

// Stub navigator.clipboard — not available in jsdom by default
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
}

// Global chrome stub — individual tests override sendMessage behavior
(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: {
    id: 'test-clipjar-id',
    sendMessage: vi.fn().mockResolvedValue(null),
    onMessage: { addListener: vi.fn() },
  },
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue(undefined),
  },
};
