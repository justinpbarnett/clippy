"use strict";
(() => {
  // src/content/clipboard-capture.ts
  function isPasswordField() {
    const active = document.activeElement;
    if (!active) return false;
    if (active instanceof HTMLInputElement && active.type === "password") return true;
    if (active.shadowRoot) {
      const inner = active.shadowRoot.activeElement;
      if (inner instanceof HTMLInputElement && inner.type === "password") return true;
    }
    const ariaLabel = active.getAttribute("aria-label")?.toLowerCase() ?? "";
    if (ariaLabel.includes("password")) return true;
    return false;
  }
  function getRichContent() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return void 0;
    try {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const div = document.createElement("div");
      div.appendChild(fragment);
      const html = div.innerHTML;
      if (html && html !== div.textContent) return html;
    } catch {
    }
    return void 0;
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return false;
    if (message.type === "WRITE_CLIPBOARD" /* WRITE_CLIPBOARD */) {
      navigator.clipboard.writeText(message.payload.text).then(() => sendResponse({ success: true })).catch(() => sendResponse({ success: false }));
      return true;
    }
    if (message.type === "WRITE_CLIPBOARD_IMAGE" /* WRITE_CLIPBOARD_IMAGE */) {
      fetch(message.payload.url).then((r) => r.blob()).then((blob) => {
        const mimeType = blob.type || "image/png";
        return navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
      }).then(() => sendResponse({ success: true })).catch(() => sendResponse({ success: false }));
      return true;
    }
  });
  document.addEventListener("copy", () => {
    if (isPasswordField()) return;
    const text = window.getSelection()?.toString();
    if (!text || text.trim().length === 0) return;
    const payload = {
      content: text,
      richContent: getRichContent(),
      sourceUrl: location.href,
      sourceTitle: document.title
    };
    chrome.runtime.sendMessage({
      type: "CLIP_CAPTURED" /* CLIP_CAPTURED */,
      payload
    });
  });
})();
