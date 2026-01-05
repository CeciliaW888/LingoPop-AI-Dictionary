import { openDB, DBSchema } from 'idb';
import { SavedEntry } from '../types';

interface LingoPopDB extends DBSchema {
  notebook: {
    key: string;
    value: SavedEntry;
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'lingopop-db';
// Increment version to trigger upgrade
const dbPromise = openDB<LingoPopDB>(DB_NAME, 2, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (!db.objectStoreNames.contains('notebook')) {
      db.createObjectStore('notebook', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings');
    }
  },
});

export const storageService = {
  async getAllEntries(): Promise<SavedEntry[]> {
    return (await dbPromise).getAll('notebook');
  },

  async addEntry(entry: SavedEntry): Promise<void> {
    await (await dbPromise).put('notebook', entry);
  },

  async removeEntry(id: string): Promise<void> {
    await (await dbPromise).delete('notebook', id);
  },
  
  async getEntry(id: string): Promise<SavedEntry | undefined> {
    return (await dbPromise).get('notebook', id);
  },

  async getGoals(): Promise<string[]> {
    const data = await (await dbPromise).get('settings', 'goals');
    // Strict safety check to ensure we always return an array
    return Array.isArray(data) ? data : [];
  },

  async saveGoals(goals: string[]): Promise<void> {
    await (await dbPromise).put('settings', goals, 'goals');
  }
};