"use strict";
(() => {
  // src/lib/constants.ts
  var SNIPPET_BUFFER_SIZE = 50;

  // src/content/snippet-expander.ts
  var snippets = [];
  var snippetMap = /* @__PURE__ */ new Map();
  var maxShortcutLen = 0;
  var buffer = "";
  async function loadSnippets() {
    try {
      snippets = await chrome.runtime.sendMessage({
        type: "GET_SNIPPETS" /* GET_SNIPPETS */,
        payload: void 0
      }) || [];
      rebuildSnippetMap();
    } catch (err) {
      console.warn("[clipjar] failed to load snippets:", err);
      snippets = [];
      snippetMap = /* @__PURE__ */ new Map();
      maxShortcutLen = 0;
    }
  }
  function rebuildSnippetMap() {
    snippetMap = /* @__PURE__ */ new Map();
    maxShortcutLen = 0;
    for (const snippet of snippets) {
      if (snippet.shortcut) {
        snippetMap.set(snippet.shortcut, snippet);
        if (snippet.shortcut.length > maxShortcutLen) maxShortcutLen = snippet.shortcut.length;
      }
    }
  }
  function findMatchingSnippet() {
    if (snippetMap.size === 0 || buffer.length === 0) return void 0;
    const tail = buffer.slice(-maxShortcutLen);
    for (let len = tail.length; len >= 1; len--) {
      const match = snippetMap.get(tail.slice(-len));
      if (match) return match;
    }
    return void 0;
  }
  function replaceInInput(el, shortcut, expansion) {
    const start = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, start - shortcut.length);
    const after = el.value.slice(start);
    el.value = before + expansion + after;
    const newPos = before.length + expansion.length;
    el.setSelectionRange(newPos, newPos);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function replaceInContentEditable(shortcut, expansion) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return;
    const text = textNode.textContent || "";
    const offset = range.startOffset;
    const shortcutStart = offset - shortcut.length;
    if (shortcutStart < 0) return;
    if (text.slice(shortcutStart, offset) !== shortcut) return;
    textNode.textContent = text.slice(0, shortcutStart) + expansion + text.slice(offset);
    const newRange = document.createRange();
    newRange.setStart(textNode, shortcutStart + expansion.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
  function handleKeydown(e) {
    if (e.key.length === 1) {
      buffer += e.key;
      if (buffer.length > SNIPPET_BUFFER_SIZE) buffer = buffer.slice(-SNIPPET_BUFFER_SIZE);
    } else if (e.key === "Backspace") {
      buffer = buffer.slice(0, -1);
    } else if (e.key === "Enter" || e.key === "Tab" || e.key === "Escape") {
      buffer = "";
      return;
    } else {
      return;
    }
    const match = findMatchingSnippet();
    if (!match || !match.shortcut) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      replaceInInput(active, match.shortcut, match.content);
    } else if (active?.getAttribute("contenteditable") === "true") {
      replaceInContentEditable(match.shortcut, match.content);
    }
    buffer = "";
  }
  loadSnippets();
  var snippetIntervalId = setInterval(loadSnippets, 3e4);
  window.addEventListener("pagehide", () => clearInterval(snippetIntervalId));
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SNIPPETS_UPDATED" /* SNIPPETS_UPDATED */) loadSnippets();
  });
  document.addEventListener("keyup", handleKeydown, true);
})();
