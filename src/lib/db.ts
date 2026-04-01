import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, CLIPS_STORE } from './constants';
import type { ClipEntry } from './types';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CLIPS_STORE)) {
          const store = db.createObjectStore(CLIPS_STORE, { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
          store.createIndex('by-type', 'type');
          store.createIndex('by-pinned', 'pinned');
          store.createIndex('by-snippet', 'isSnippet');
          store.createIndex('by-hash', 'hash', { unique: true });
          store.createIndex('by-shortcut', 'shortcut', { unique: true });
        }
      },
    });
  }
  return dbPromise;
}

function normalizeClip(clip: ClipEntry): ClipEntry {
  return { ...clip, pinned: (clip.pinned ? 1 : 0) as unknown as boolean, isSnippet: (clip.isSnippet ? 1 : 0) as unknown as boolean };
}

export async function addClip(clip: ClipEntry): Promise<void> {
  const db = await getDb();
  await db.put(CLIPS_STORE, normalizeClip(clip));
}

export async function getClipByHash(hash: string): Promise<ClipEntry | undefined> {
  const db = await getDb();
  return db.getFromIndex(CLIPS_STORE, 'by-hash', hash);
}

export async function updateTimestamp(id: string, timestamp: number): Promise<void> {
  const db = await getDb();
  const clip = await db.get(CLIPS_STORE, id);
  if (clip) {
    clip.timestamp = timestamp;
    await db.put(CLIPS_STORE, clip);
  }
}

export async function getRecentClips(limit: number, offset = 0): Promise<ClipEntry[]> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readonly');
  const index = tx.store.index('by-timestamp');
  let cursor = await index.openCursor(null, 'prev');
  const results: ClipEntry[] = [];
  let skipped = 0;

  while (cursor) {
    if (skipped < offset) {
      skipped++;
      cursor = await cursor.continue();
      continue;
    }
    results.push(cursor.value as ClipEntry);
    if (results.length >= limit) break;
    cursor = await cursor.continue();
  }

  return results;
}

export async function getPinnedClips(limit: number, offset = 0): Promise<ClipEntry[]> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readonly');
  const index = tx.store.index('by-pinned');
  let cursor = await index.openCursor(IDBKeyRange.only(1), 'prev');
  const results: ClipEntry[] = [];
  let skipped = 0;

  while (cursor) {
    if (skipped < offset) {
      skipped++;
      cursor = await cursor.continue();
      continue;
    }
    results.push(cursor.value as ClipEntry);
    if (results.length >= limit) break;
    cursor = await cursor.continue();
  }

  return results;
}

export async function getSnippets(): Promise<ClipEntry[]> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readonly');
  const index = tx.store.index('by-snippet');
  let cursor = await index.openCursor(IDBKeyRange.only(1));
  const results: ClipEntry[] = [];

  while (cursor) {
    results.push(cursor.value as ClipEntry);
    cursor = await cursor.continue();
  }

  return results;
}

export async function togglePin(id: string): Promise<boolean> {
  const db = await getDb();
  const clip = await db.get(CLIPS_STORE, id);
  if (!clip) return false;
  const newPinned = !clip.pinned;
  await db.put(CLIPS_STORE, normalizeClip({ ...clip, pinned: newPinned }));
  return newPinned;
}

export async function deleteClip(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(CLIPS_STORE, id);
}

export async function updateClip(id: string, content: string): Promise<void> {
  const db = await getDb();
  const clip = await db.get(CLIPS_STORE, id);
  if (clip) {
    clip.content = content;
    clip.charCount = content.length;
    await db.put(CLIPS_STORE, clip);
  }
}

export async function getClipCount(): Promise<number> {
  const db = await getDb();
  return db.count(CLIPS_STORE);
}

export async function pruneOldClips(maxHistory: number): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readwrite');
  const index = tx.store.index('by-timestamp');

  // Count non-pinned, non-snippet clips
  let cursor = await index.openCursor();
  const deletable: string[] = [];

  while (cursor) {
    const clip = cursor.value as ClipEntry;
    if (!clip.pinned && !clip.isSnippet) {
      deletable.push(clip.id);
    }
    cursor = await cursor.continue();
  }

  if (deletable.length <= maxHistory) return;

  // deletable is in ascending timestamp order (oldest first)
  const toDelete = deletable.slice(0, deletable.length - maxHistory);
  for (const id of toDelete) {
    await tx.store.delete(id);
  }

  await tx.done;
}

export async function getAllClips(): Promise<ClipEntry[]> {
  const db = await getDb();
  return db.getAll(CLIPS_STORE);
}

export async function importClips(clips: ClipEntry[]): Promise<number> {
  const db = await getDb();
  let imported = 0;
  for (const clip of clips) {
    const existing = await db.getFromIndex(CLIPS_STORE, 'by-hash', clip.hash).catch(() => undefined);
    if (!existing) {
      await db.put(CLIPS_STORE, normalizeClip(clip));
      imported++;
    }
  }
  return imported;
}

export async function getSnippetByShortcut(shortcut: string): Promise<ClipEntry | undefined> {
  const db = await getDb();
  return db.getFromIndex(CLIPS_STORE, 'by-shortcut', shortcut).catch(() => undefined);
}
