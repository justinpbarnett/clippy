import { MessageType } from './types';

type ClipboardWriteType = MessageType.WRITE_CLIPBOARD | MessageType.WRITE_CLIPBOARD_IMAGE;

export function buildClipboardMessage(
  messageType: ClipboardWriteType,
  content: string,
): { type: ClipboardWriteType; payload: { url: string } | { text: string } } {
  if (messageType === MessageType.WRITE_CLIPBOARD_IMAGE) {
    return { type: messageType, payload: { url: content } };
  }
  return { type: messageType, payload: { text: content } };
}
