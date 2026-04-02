import { describe, it, expect } from 'vitest';
import { buildClipboardMessage } from '../src/lib/clipboard-message';
import { MessageType } from '../src/lib/types';

describe('buildClipboardMessage', () => {
  it('builds image message with url payload', () => {
    const msg = buildClipboardMessage(MessageType.WRITE_CLIPBOARD_IMAGE, 'https://example.com/img.png');
    expect(msg.type).toBe(MessageType.WRITE_CLIPBOARD_IMAGE);
    expect(msg.payload).toEqual({ url: 'https://example.com/img.png' });
  });

  it('builds text message with text payload', () => {
    const msg = buildClipboardMessage(MessageType.WRITE_CLIPBOARD, 'hello world');
    expect(msg.type).toBe(MessageType.WRITE_CLIPBOARD);
    expect(msg.payload).toEqual({ text: 'hello world' });
  });

  it('text message does not have a url field', () => {
    const msg = buildClipboardMessage(MessageType.WRITE_CLIPBOARD, 'data');
    expect(msg.payload).not.toHaveProperty('url');
  });

  it('image message does not have a text field', () => {
    const msg = buildClipboardMessage(MessageType.WRITE_CLIPBOARD_IMAGE, 'data:image/png;base64,abc');
    expect(msg.payload).not.toHaveProperty('text');
  });

  it('passes content unchanged including special characters', () => {
    const content = 'special: <>&"\n\t\u2603';
    const msg = buildClipboardMessage(MessageType.WRITE_CLIPBOARD, content);
    expect((msg.payload as { text: string }).text).toBe(content);
  });

  it('handles empty content', () => {
    const msg = buildClipboardMessage(MessageType.WRITE_CLIPBOARD, '');
    expect((msg.payload as { text: string }).text).toBe('');
  });
});
