import {
  addClip,
  getClipByHash,
  updateTimestamp,
  getRecentClips,
  getPinnedClips,
  getSnippets,
  togglePin,
  deleteClip,
  updateClip,
  getClipCount,
  pruneOldClips,
  getAllClips,
  importClips,
} from '../lib/db';
import { detectType } from '../lib/detect-type';
import { getSettings, updateSettings } from '../lib/settings';
import { MAX_CONTENT_LENGTH } from '../lib/constants';
import { MessageType, type ClipEntry, type ClipCapturedPayload, type GetClipsPayload, type SaveSnippetPayload, type UserSettings } from '../lib/types';
import { buildClipboardMessage } from '../lib/clipboard-message';

async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function handleClipCaptured(payload: ClipCapturedPayload): Promise<void> {
  let content = payload.content;
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.slice(0, MAX_CONTENT_LENGTH) + '\n[truncated]';
  }

  const hash = await computeHash(content);
  const existing = await getClipByHash(hash);

  if (existing) {
    await updateTimestamp(existing.id, Date.now());
    return;
  }

  const clip: ClipEntry = {
    id: crypto.randomUUID(),
    content,
    richContent: payload.richContent,
    type: detectType(content),
    sourceUrl: payload.sourceUrl,
    sourceTitle: payload.sourceTitle,
    timestamp: Date.now(),
    pinned: false,
    isSnippet: false,
    hash,
    charCount: content.length,
  };

  await addClip(clip);

  const settings = await getSettings();
  await pruneOldClips(settings.maxHistory);
}

async function handleGetClips(payload: GetClipsPayload): Promise<ClipEntry[]> {
  if (payload.tab === 'favorites') {
    return getPinnedClips(payload.limit, payload.offset);
  }
  if (payload.tab === 'snippets') {
    return getSnippets();
  }
  return getRecentClips(payload.limit, payload.offset);
}

async function handleSaveSnippet(payload: SaveSnippetPayload): Promise<ClipEntry> {
  const hash = await computeHash(payload.content + payload.shortcut);
  const clip: ClipEntry = {
    id: payload.id || crypto.randomUUID(),
    content: payload.content,
    type: detectType(payload.content),
    sourceUrl: '',
    sourceTitle: '',
    timestamp: Date.now(),
    pinned: false,
    isSnippet: true,
    shortcut: payload.shortcut,
    hash,
    charCount: payload.content.length,
  };

  await addClip(clip);
  chrome.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id != null) {
        // Tabs without an injected content script will reject this message; that is expected.
        chrome.tabs.sendMessage(tab.id, { type: MessageType.SNIPPETS_UPDATED }).catch(() => {});
      }
    }
  }).catch((err) => console.error('[clipjar] tabs.query failed:', err));
  return clip;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ error: 'Unauthorized sender' });
    return false;
  }
  const { type, payload } = message;

  const handle = async () => {
    switch (type) {
      case MessageType.CLIP_CAPTURED:
        await handleClipCaptured(payload as ClipCapturedPayload);
        return { success: true };

      case MessageType.GET_CLIPS:
        return await handleGetClips(payload as GetClipsPayload);

      case MessageType.TOGGLE_PIN:
        return { pinned: await togglePin(payload.id) };

      case MessageType.DELETE_CLIP:
        await deleteClip(payload.id);
        return { success: true };

      case MessageType.UPDATE_CLIP:
        await updateClip(payload.id, payload.content);
        return { success: true };

      case MessageType.SAVE_SNIPPET:
        return await handleSaveSnippet(payload as SaveSnippetPayload);

      case MessageType.GET_SNIPPETS:
        return await getSnippets();

      case MessageType.GET_SETTINGS:
        return await getSettings();

      case MessageType.UPDATE_SETTINGS:
        return await updateSettings(payload as Partial<UserSettings>);

      case MessageType.EXPORT_DATA: {
        const clips = await getAllClips();
        const settings = await getSettings();
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          settings,
          clips,
          clipCount: clips.length,
        };
      }

      case MessageType.IMPORT_DATA: {
        const imported = await importClips(payload.clips);
        if (payload.settings) await updateSettings(payload.settings);
        return { imported };
      }

      case MessageType.CLIP_COUNT:
        return { count: await getClipCount() };

      default:
        return { error: 'Unknown message type' };
    }
  };

  handle().then(sendResponse).catch((err) => {
    console.error('[clipjar] message handler error:', err);
    sendResponse({ error: err instanceof Error ? err.message : String(err) });
  });
  return true; // async response
});

// Context menu: capture addresses from right-click actions that bypass the copy event
const CONTEXT_MENU_IDS = ['clipjar-copy-text', 'clipjar-copy-link', 'clipjar-copy-image', 'clipjar-copy-image-data', 'clipjar-copy-media'] as const;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'clipjar-copy-text',       title: 'Copy',               contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'clipjar-copy-link',       title: 'Copy link address',  contexts: ['link'] });
    chrome.contextMenus.create({ id: 'clipjar-copy-image',      title: 'Copy image address', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'clipjar-copy-image-data', title: 'Copy image',         contexts: ['image'] });
    chrome.contextMenus.create({ id: 'clipjar-copy-media',      title: 'Copy media address', contexts: ['video', 'audio'] });
  });
});

async function dispatchClipboardWrite(tab: chrome.tabs.Tab | undefined, message: object): Promise<void> {
  if (typeof chrome.offscreen === 'undefined') {
    if (tab?.id != null) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  } else {
    await ensureOffscreen();
    chrome.runtime.sendMessage(message);
  }
}

async function captureAndWrite(
  tab: chrome.tabs.Tab | undefined,
  content: string,
  sourceUrl: string,
  sourceTitle: string,
  messageType: MessageType.WRITE_CLIPBOARD | MessageType.WRITE_CLIPBOARD_IMAGE,
): Promise<void> {
  await dispatchClipboardWrite(tab, buildClipboardMessage(messageType, content));
  await handleClipCaptured({ content, sourceUrl, sourceTitle });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const id = info.menuItemId;
  if (!CONTEXT_MENU_IDS.includes(id as typeof CONTEXT_MENU_IDS[number])) return;

  const srcUrl = info.srcUrl;
  const sourceUrl = tab?.url ?? info.pageUrl ?? '';
  const sourceTitle = tab?.title ?? '';

  // "Copy image" — write the actual image data to clipboard, save URL to history
  if (id === 'clipjar-copy-image-data') {
    if (!srcUrl) return;
    await captureAndWrite(tab, srcUrl, sourceUrl, sourceTitle, MessageType.WRITE_CLIPBOARD_IMAGE);
    return;
  }

  // All other items — write the address as text
  const content =
    id === 'clipjar-copy-text'  ? info.selectionText :
    id === 'clipjar-copy-link'  ? info.linkUrl :
    srcUrl;

  if (!content) return;

  await captureAndWrite(tab, content, sourceUrl, sourceTitle, MessageType.WRITE_CLIPBOARD);
});

// Keyboard shortcut: copy most recent clip without opening popup
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-first') {
    const clips = await getRecentClips(1);
    if (clips.length === 0) return;

    const text = clips[0].content;
    if (typeof chrome.offscreen === 'undefined') {
      // Firefox: relay to the content script already running on the active tab.
      // Content scripts run in an isolated JS world so page overrides of
      // navigator.clipboard cannot intercept the write.
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id != null && tab.url?.startsWith('http')) {
        chrome.tabs.sendMessage(tab.id, { type: MessageType.WRITE_CLIPBOARD, payload: { text } });
      }
    } else {
      await ensureOffscreen();
      chrome.runtime.sendMessage({ type: MessageType.WRITE_CLIPBOARD, payload: { text } });
    }
  }
});

async function ensureOffscreen(): Promise<void> {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Write to clipboard from keyboard shortcut',
    });
  }
}
