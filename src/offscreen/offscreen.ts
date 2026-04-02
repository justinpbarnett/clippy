import { MessageType } from '../lib/types';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === MessageType.WRITE_CLIPBOARD) {
    const textarea = document.getElementById('cb');
    if (!(textarea instanceof HTMLTextAreaElement)) {
      sendResponse({ success: false });
      return true;
    }
    textarea.value = msg.payload.text;
    textarea.select();
    const success = document.execCommand('copy');
    sendResponse({ success });
  }
  return true;
});
