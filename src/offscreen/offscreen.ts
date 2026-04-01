chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'WRITE_CLIPBOARD') {
    const textarea = document.getElementById('cb') as HTMLTextAreaElement;
    textarea.value = msg.payload.text;
    textarea.select();
    const success = document.execCommand('copy');
    sendResponse({ success });
  }
  return true;
});
