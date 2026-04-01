import { describe, it, expect } from 'vitest';
import { detectType } from '../src/lib/detect-type';
import { ClipType } from '../src/lib/types';

describe('detectType', () => {
  it('detects URLs', () => {
    expect(detectType('https://example.com')).toBe(ClipType.URL);
    expect(detectType('http://foo.bar/baz?q=1')).toBe(ClipType.URL);
  });

  it('detects emails', () => {
    expect(detectType('user@example.com')).toBe(ClipType.Email);
    expect(detectType('foo.bar+tag@domain.co.uk')).toBe(ClipType.Email);
  });

  it('detects phone numbers', () => {
    expect(detectType('+1 (555) 123-4567')).toBe(ClipType.Phone);
    expect(detectType('555-123-4567')).toBe(ClipType.Phone);
  });

  it('detects JSON', () => {
    expect(detectType('{"key": "value"}')).toBe(ClipType.JSON);
    expect(detectType('[1, 2, 3]')).toBe(ClipType.JSON);
  });

  it('does not detect invalid JSON', () => {
    expect(detectType('{not json}')).not.toBe(ClipType.JSON);
  });

  it('detects code', () => {
    const jsCode = `
const foo = 'bar';
if (foo) {
  console.log(foo);
}`;
    expect(detectType(jsCode)).toBe(ClipType.Code);
  });

  it('detects Python code', () => {
    const pyCode = `def hello():
    print("hello")
    return True`;
    expect(detectType(pyCode)).toBe(ClipType.Code);
  });

  it('returns PlainText for regular text', () => {
    expect(detectType('Hello world')).toBe(ClipType.PlainText);
    expect(detectType('Just some regular text here')).toBe(ClipType.PlainText);
  });

  it('handles whitespace', () => {
    expect(detectType('  https://example.com  ')).toBe(ClipType.URL);
    expect(detectType('  user@example.com  ')).toBe(ClipType.Email);
  });
});
