import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import { DB_NAME, DB_VERSION, CLIPS_STORE } from './constants';
import type { ClipEntry } from './types';

type StoredClipEntry = Omit<ClipEntry, 'pinned' | 'isSnippet'> & {
  pinned: 0 | 1;
  isSnippet: 0 | 1;
};

interface ClipjarDB extends DBSchema {
  clips: {
    key: string;
    value: StoredClipEntry;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
      'by-pinned': 0 | 1;
      'by-snippet': 0 | 1;
      'by-hash': string;
      'by-shortcut': string;
    };
  };
}

// Minimal structural type for a cursor that yields StoredClipEntry rows.
// Used instead of the full IDBPCursorWithValue generic to avoid multi-any.
interface StoreCursor {
  readonly value: StoredClipEntry;
  continue(): Promise<StoreCursor | null>;
}

let dbPromise: Promise<IDBPDatabase<ClipjarDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ClipjarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ClipjarDB>(DB_NAME, DB_VERSION, {
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

function normalizeClip(clip: ClipEntry): StoredClipEntry {
  return { ...clip, pinned: clip.pinned ? 1 : 0, isSnippet: clip.isSnippet ? 1 : 0 };
}

function denormalizeClip(stored: StoredClipEntry): ClipEntry {
  return { ...stored, pinned: stored.pinned === 1, isSnippet: stored.isSnippet === 1 };
}

async function getStoredClip(id: string): Promise<{ db: IDBPDatabase<ClipjarDB>; clip: StoredClipEntry } | undefined> {
  const db = await getDb();
  const clip = await db.get(CLIPS_STORE, id);
  return clip ? { db, clip } : undefined;
}

function onDbLookupError(err: unknown): undefined {
  console.warn('[clipjar] db lookup failed:', err);
  return undefined;
}

async function paginateCursor(cursor: StoreCursor | null, limit: number, offset: number): Promise<ClipEntry[]> {
  let cur = cursor;
  const results: ClipEntry[] = [];
  let skipped = 0;

  while (cur) {
    if (skipped < offset) {
      skipped++;
      cur = await cur.continue();
      continue;
    }
    results.push(denormalizeClip(cur.value));
    if (results.length >= limit) break;
    cur = await cur.continue();
  }

  return results;
}

export async function addClip(clip: ClipEntry): Promise<void> {
  const db = await getDb();
  await db.put(CLIPS_STORE, normalizeClip(clip));
}

export async function getClipByHash(hash: string): Promise<ClipEntry | undefined> {
  const db = await getDb();
  const stored = await db.getFromIndex(CLIPS_STORE, 'by-hash', hash);
  return stored ? denormalizeClip(stored) : undefined;
}

export async function updateTimestamp(id: string, timestamp: number): Promise<void> {
  const result = await getStoredClip(id);
  if (result) {
    result.clip.timestamp = timestamp;
    await result.db.put(CLIPS_STORE, result.clip);
  }
}

export async function getRecentClips(limit: number, offset = 0): Promise<ClipEntry[]> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readonly');
  const index = tx.store.index('by-timestamp');
  const cursor = await index.openCursor(null, 'prev');
  return paginateCursor(cursor as StoreCursor | null, limit, offset);
}

export async function getPinnedClips(limit: number, offset = 0): Promise<ClipEntry[]> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readonly');
  const index = tx.store.index('by-pinned');
  const cursor = await index.openCursor(IDBKeyRange.only(1), 'prev');
  return paginateCursor(cursor as StoreCursor | null, limit, offset);
}

export async function getSnippets(): Promise<ClipEntry[]> {
  const db = await getDb();
  const tx = db.transaction(CLIPS_STORE, 'readonly');
  const index = tx.store.index('by-snippet');
  const cursor = await index.openCursor(IDBKeyRange.only(1));
  return paginateCursor(cursor as StoreCursor | null, Infinity, 0);
}

export async function togglePin(id: string): Promise<boolean> {
  const result = await getStoredClip(id);
  if (!result) return false;
  const newPinned = result.clip.pinned === 0;
  await result.db.put(CLIPS_STORE, { ...result.clip, pinned: newPinned ? 1 : 0 });
  return newPinned;
}

export async function deleteClip(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(CLIPS_STORE, id);
}

export async function updateClip(id: string, content: string): Promise<void> {
  const result = await getStoredClip(id);
  if (result) {
    result.clip.content = content;
    result.clip.charCount = content.length;
    await result.db.put(CLIPS_STORE, result.clip);
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
    const clip = cursor.value;
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
  const stored = await db.getAll(CLIPS_STORE);
  return stored.map(denormalizeClip);
}

export async function importClips(clips: ClipEntry[]): Promise<number> {
  const db = await getDb();
  let imported = 0;
  for (const clip of clips) {
    const existing = await db.getFromIndex(CLIPS_STORE, 'by-hash', clip.hash).catch(onDbLookupError);
    if (!existing) {
      await db.put(CLIPS_STORE, normalizeClip(clip));
      imported++;
    }
  }
  return imported;
}

export async function getSnippetByShortcut(shortcut: string): Promise<ClipEntry | undefined> {
  const db = await getDb();
  const stored = await db.getFromIndex(CLIPS_STORE, 'by-shortcut', shortcut).catch(onDbLookupError);
  return stored ? denormalizeClip(stored) : undefined;
}
