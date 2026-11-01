import type { CopiedRecord, ExtractedNumber } from '../types';

const DB_NAME = 'NumberExtractorPro_DB';
const STORE_NAME = 'copied_numbers_memory';
const LOCAL_STORAGE_KEY = 'NEP_COPIED_NUMBERS_FALLBACK';

// In-memory fast cache for instant O(1) checks during extraction and table filtering
const cachedCopiedSet = new Set<string>();
const cachedCopiedMap = new Map<string, CopiedRecord>();
let isInitialized = false;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    // Open with version 2 to support copied_numbers_memory store
    const request = indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'normalized' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Initialize cache from IndexedDB / localStorage on startup
 */
export async function initCopiedMemory(): Promise<void> {
  if (isInitialized) return;

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as CopiedRecord[];
        for (const r of records) {
          cachedCopiedSet.add(r.normalized);
          cachedCopiedMap.set(r.normalized, r);
        }
        isInitialized = true;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const list: CopiedRecord[] = JSON.parse(raw);
        for (const r of list) {
          cachedCopiedSet.add(r.normalized);
          cachedCopiedMap.set(r.normalized, r);
        }
      }
    } catch {
      // Ignored
    }
    isInitialized = true;
  }
}

/**
 * Fast synchronous check if a normalized number has ever been copied
 */
export function isNumberPreviouslyCopied(normalized: string): boolean {
  return cachedCopiedSet.has(normalized);
}

/**
 * Get copied record metadata (timestamp, country)
 */
export function getCopiedRecord(normalized: string): CopiedRecord | undefined {
  return cachedCopiedMap.get(normalized);
}

/**
 * Mark a batch of ExtractedNumbers as copied and persist to storage
 */
export async function persistCopiedNumbers(numbers: ExtractedNumber[]): Promise<void> {
  if (!numbers || numbers.length === 0) return;

  const timestamp = Date.now();
  const recordsToSave: CopiedRecord[] = [];

  for (const item of numbers) {
    const record: CopiedRecord = {
      normalized: item.normalized,
      countryName: item.countryName,
      dialCode: item.dialCode,
      copiedAt: timestamp,
      sourceFile: item.sourceFile,
    };
    cachedCopiedSet.add(item.normalized);
    cachedCopiedMap.set(item.normalized, record);
    recordsToSave.push(record);
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of recordsToSave) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Fallback save to localStorage (up to 5,000 recent)
    try {
      const allRecords = Array.from(cachedCopiedMap.values()).slice(-5000);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allRecords));
    } catch {
      // Storage full
    }
  }
}

/**
 * Get all lifetime copied records
 */
export async function getAllCopiedRecords(): Promise<CopiedRecord[]> {
  await initCopiedMemory();
  return Array.from(cachedCopiedMap.values()).sort((a, b) => b.copiedAt - a.copiedAt);
}

/**
 * Clear the entire copied numbers memory / history
 */
export async function clearAllCopiedMemory(): Promise<void> {
  cachedCopiedSet.clear();
  cachedCopiedMap.clear();
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignored
  }
}

/**
 * Remove specific numbers from copied memory (re-enabling them as fresh leads)
 */
export async function removeNumbersFromCopiedMemory(normalizedList: string[]): Promise<void> {
  for (const n of normalizedList) {
    cachedCopiedSet.delete(n);
    cachedCopiedMap.delete(n);
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const n of normalizedList) {
        store.delete(n);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignored
  }
}
