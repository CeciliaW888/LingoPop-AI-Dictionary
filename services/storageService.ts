import { openDB, DBSchema } from 'idb';
import { SavedEntry } from '../types';

interface LingoPopDB extends DBSchema {
  notebook: {
    key: string;
    value: SavedEntry;
  };
}

const DB_NAME = 'lingopop-db';
const STORE_NAME = 'notebook';

const dbPromise = openDB<LingoPopDB>(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  },
});

export const storageService = {
  async getAllEntries(): Promise<SavedEntry[]> {
    return (await dbPromise).getAll(STORE_NAME);
  },

  async addEntry(entry: SavedEntry): Promise<void> {
    await (await dbPromise).put(STORE_NAME, entry);
  },

  async removeEntry(id: string): Promise<void> {
    await (await dbPromise).delete(STORE_NAME, id);
  },
  
  async getEntry(id: string): Promise<SavedEntry | undefined> {
    return (await dbPromise).get(STORE_NAME, id);
  }
};