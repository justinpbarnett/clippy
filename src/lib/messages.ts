import type { MessagePayload } from './types';

export function sendMessage<T = unknown>(message: MessagePayload): Promise<T> {
  return chrome.runtime.sendMessage(message);
}
