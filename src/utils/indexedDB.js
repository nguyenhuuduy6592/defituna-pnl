import { openDB } from 'idb';

// Constants for IndexedDB configuration
export const DB_NAME = 'defituna-pnl';
export const DB_VERSION = 2;
export const STORE_NAMES = {
  POSITIONS: 'positions',
  SETTINGS: 'settings',
  WALLETS: 'wallets'
};
export const DEFAULT_RETENTION_DAYS = 30;

/**
 * Initialize IndexedDB database for storing position history and app data
 * Creates necessary object stores and indexes if they don't exist
 * 
 * @returns {Promise<IDBDatabase|null>} Database instance or null on failure
 */
export const initializeDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Create positions store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.POSITIONS)) {
          const store = db.createObjectStore(STORE_NAMES.POSITIONS, {
            keyPath: ['id', 'timestamp']
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('pair', 'pair');
          store.createIndex('walletAddress', 'walletAddress');
        }

        // Create settings store if it doesn't exist (v2)
        if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
          db.createObjectStore(STORE_NAMES.SETTINGS, { keyPath: 'key' });
        }

        // Create wallets store if it doesn't exist (v2)
        if (!db.objectStoreNames.contains(STORE_NAMES.WALLETS)) {
          db.createObjectStore(STORE_NAMES.WALLETS, { keyPath: 'key' });
        }
      }
    });
    
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    return null;
  }
};

/**
 * Save a snapshot of the current positions to the database
 * Each position is stored with the current timestamp
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {Array} positions - Array of position objects to save
 * @param {number} timestamp - Optional timestamp (defaults to current time)
 * @returns {Promise<boolean>} Success status
 */
export const savePositionSnapshot = async (db, positions, timestamp = Date.now()) => {
  if (!db || !Array.isArray(positions)) return false;

  try {
    const tx = db.transaction(STORE_NAMES.POSITIONS, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.POSITIONS);

    await Promise.all(positions.map(position => {
      // Enhanced Validation: Check if position is an object and has necessary keys
      if (!position || typeof position !== 'object' || !position.pair || !position.positionAddress) {
        console.warn('[savePositionSnapshot] Skipping invalid position for saving:', position);
        return Promise.resolve(); 
      }
      
      const id = `${position.pair}-${position.positionAddress}`;
      // Use put instead of add to handle potential duplicate entries from rapid syncs gracefully (overwrite)
      return store.put({
        ...position,
        id,
        timestamp
      });
    }));

    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to save position snapshot:', error);
    // Log constraint errors specifically if needed, though put avoids most of these
    // if (error.name === 'ConstraintError') { ... }
    return false;
  }
};

/**
 * Retrieve historical data for a specific position
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {string} positionId - ID of the position to retrieve history for
 * @param {number} timeRange - Optional time range in milliseconds (from now)
 * @returns {Promise<Array>} Array of historical position records
 */
export const getPositionHistory = async (db, positionId, timeRange) => {
  if (!db) return [];

  try {
    const tx = db.transaction(STORE_NAMES.POSITIONS, 'readonly');
    const store = tx.objectStore(STORE_NAMES.POSITIONS);
    const index = store.index('timestamp');

    // Filter by timestamp if timeRange is provided
    const startTime = timeRange ? Date.now() - timeRange : 0;
    const range = IDBKeyRange.lowerBound(startTime);

    const history = await index.getAll(range);
    return history.filter(item => item.id === positionId);
  } catch (error) {
    console.error('Failed to get position history:', error);
    return [];
  }
};

/**
 * Clean up historical data older than the specified retention period
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {number} retentionDays - Number of days to retain data for (defaults to DEFAULT_RETENTION_DAYS)
 * @returns {Promise<boolean>} Success status
 */
export const cleanupData = async (db, retentionDays = DEFAULT_RETENTION_DAYS) => {
  if (!db) return false;

  try {
    const cutoffTimestamp = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const tx = db.transaction(STORE_NAMES.POSITIONS, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.POSITIONS);
    const index = store.index('timestamp');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTimestamp));
    let deleteCount = 0;

    while (cursor) {
      // console.log('[cleanupData] Deleting old record with timestamp:', cursor.value.timestamp);
      await cursor.delete();
      deleteCount++;
      cursor = await cursor.continue();
    }

    await tx.done;
    if (deleteCount > 0) {
        console.log(`[cleanupData] Successfully deleted ${deleteCount} old position records.`);
    }
    return true;
  } catch (error) {
    console.error('Failed to clean up old data:', error);
    return false;
  }
};

/**
 * Save data to a specific store
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {string} storeName - Name of the store to save to
 * @param {Object} data - Data to save, must include a 'key' property
 * @returns {Promise<boolean>} Success status
 */
export const saveData = async (db, storeName, data) => {
  if (!db || !data?.key) return false;

  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.put(data);
    await tx.done;
    return true;
  } catch (error) {
    console.error(`Failed to save data to ${storeName}:`, error);
    return false;
  }
};

/**
 * Get data from a specific store
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {string} storeName - Name of the store to get from
 * @param {string} key - Key of the data to retrieve
 * @returns {Promise<Object|null>} Retrieved data or null on failure
 */
export const getData = async (db, storeName, key) => {
  if (!db) return null;

  try {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const data = await store.get(key);
    return data || null;
  } catch (error) {
    console.error(`Failed to get data from ${storeName}:`, error);
    return null;
  }
};

/**
 * Delete data from a specific store
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {string} storeName - Name of the store to delete from
 * @param {string} key - Key of the data to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteData = async (db, storeName, key) => {
  if (!db) return false;

  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.delete(key);
    await tx.done;
    return true;
  } catch (error) {
    console.error(`Failed to delete data from ${storeName}:`, error);
    return false;
  }
};

