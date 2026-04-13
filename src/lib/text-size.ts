import type { UserSettings } from './types';

export const TEXT_SIZE_ATTRIBUTE = 'data-clipjar-text-size';

const VALID_TEXT_SIZES = ['normal', 'large', 'x-large'] as const;
const TEXT_SIZE_SET = new Set<string>(VALID_TEXT_SIZES);

export function normalizeTextSize(value: unknown): UserSettings['textSize'] {
  return typeof value === 'string' && TEXT_SIZE_SET.has(value)
    ? value as UserSettings['textSize']
    : 'normal';
}

export function applyTextSize(value: unknown, doc: Document = document): UserSettings['textSize'] {
  const textSize = normalizeTextSize(value);
  doc.documentElement.setAttribute(TEXT_SIZE_ATTRIBUTE, textSize);
  return textSize;
}
