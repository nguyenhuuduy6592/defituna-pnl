import { openDB } from 'idb';

const DB_NAME = 'defituna-pnl';
const DB_VERSION = 2;
const TX_STORE_NAME = 'transactions';

let dbPromise = null;

/**
 * Opens the IndexedDB database if it hasn't been opened yet.
 * Ensures this only runs client-side.
 * @returns {Promise<IDBPDatabase>} Promise resolving to the DB instance.
 */
function getDb() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB cannot be accessed server-side.'));
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(TX_STORE_NAME)) {
          db.createObjectStore(TX_STORE_NAME, { keyPath: 'signature' });
        }
      },
      blocked() {
      },
      blocking() {
      },
      terminated() {
        dbPromise = null; 
      },
    }).catch(err => {
      dbPromise = null;
      throw err;
    })
    .then(resolvedDb => { 
      return resolvedDb;
    });
  }
  
  return dbPromise;
}

/**
 * Get transaction details from IndexedDB.
 * @param {string} signature - The transaction signature.
 * @returns {Promise<object|undefined>} The cached transaction details or undefined.
 */
export async function getTxFromCache(signature) {
  try {
    const db = await getDb();
    return await db.get(TX_STORE_NAME, signature);
  } catch (error) {
    return undefined;
  }
}

/**
 * Save transaction details to IndexedDB.
 * @param {string} signature - The transaction signature.
 * @param {object} dataToStore - The transaction details object to save.
 */
export async function saveTxToCache(signature, dataToStore) {
  try {
    const db = await getDb();
    const tx = db.transaction(TX_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TX_STORE_NAME);
    const recordToStore = {
        signature: signature,
        data: dataToStore
    };
    await store.put(recordToStore);
    await tx.done;
  } catch (error) {
  }
}

/**
 * Retrieve multiple transaction details from IndexedDB by their signatures.
 * @param {Array<string>} signatures - An array of transaction signatures.
 * @returns {Promise<Map<string, object>>} A promise that resolves to a Map where keys are signatures and values are the stored transaction detail objects.
 */
export async function getMultipleTxsFromCache(signatures) {
  if (!signatures || signatures.length === 0) {
    return new Map();
  }
  let db;
  try {
    db = await getDb();
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');

    const promises = signatures.map(sig => store.get(sig));
    const results = await Promise.all(promises);
    
    const resultMap = new Map();
    results.forEach((record, index) => {
      if (record && record.data) {
        resultMap.set(signatures[index], record.data); 
      }
    });

    await tx.done;
    return resultMap;
  } catch (error) {
    return new Map(); 
  }
} 