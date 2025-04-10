import { openDB } from 'idb';

// Constants for IndexedDB configuration
export const DB_NAME = 'defituna-pnl';
export const DB_VERSION = 1;
export const STORE_NAME = 'positions';
export const DEFAULT_RETENTION_DAYS = 30;

/**
 * Initialize IndexedDB database for storing position history
 * Creates necessary object stores and indexes if they don't exist
 * 
 * @returns {Promise<IDBDatabase|null>} Database instance or null on failure
 */
export const initializeDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: ['id', 'timestamp']
          });
          // Create indexes for efficient queries
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('pair', 'pair');
          store.createIndex('walletAddress', 'walletAddress');
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
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Save each position in the transaction
    await Promise.all(positions.map(position => {
      if (!position || !position.pair || !position.positionAddress) {
        return Promise.resolve(); // Skip invalid positions
      }
      
      const id = `${position.pair}-${position.positionAddress}`;
      return store.add({
        ...position,
        id,
        timestamp
      });
    }));

    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to save position snapshot:', error);
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
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
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
 * @param {number} retentionDays - Number of days to retain data for
 * @returns {Promise<boolean>} Success status
 */
export const cleanupOldData = async (db, retentionDays = DEFAULT_RETENTION_DAYS) => {
  if (!db) return false;

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    // Calculate cutoff time based on retention period
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const range = IDBKeyRange.upperBound(cutoffTime);

    // Delete all records older than the cutoff time
    let cursor = await index.openCursor(range);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
    return false;
  }
}; 