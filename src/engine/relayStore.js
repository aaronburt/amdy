import { readFile, writeFile } from 'fs/promises';
import { EventEmitter } from 'events';

const CACHE_FILE = './relay-cache.json';
let store = new Map();
const emitter = new EventEmitter();

async function loadCache() {
  try {
    const data = await readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    store = new Map(Object.entries(parsed));
  } catch (err) {
    store = new Map();
  }
}

async function saveCache() {
  try {
    const obj = Object.fromEntries(store.entries());
    await writeFile(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[RELAY STORE PERSISTENCE ERROR]', err);
  }
}

export const relayStore = {
  init: async () => {
    await loadCache();
  },
  get: (key) => store.get(key),
  set: async (key, value) => {
    const existing = store.get(key);
    let newValue = value;
    if (existing && typeof existing === 'object' && value && typeof value === 'object' && !Array.isArray(existing) && !Array.isArray(value)) {
      newValue = { ...existing, ...value };
    }
    store.set(key, newValue);
    await saveCache();
    emitter.emit(key, newValue);
    return newValue;
  },
  has: (key) => store.has(key),
  delete: async (key) => {
    const res = store.delete(key);
    await saveCache();
    return res;
  },
  clear: async () => {
    store.clear();
    await saveCache();
  },
  on: (key, listener) => emitter.on(key, listener),
  off: (key, listener) => emitter.off(key, listener)
};
