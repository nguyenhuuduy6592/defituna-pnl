import { openDB } from 'idb';
import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'defituna-pnl';
const DB_VERSION = 1;
const STORE_NAME = 'positions';

export const useHistoricalData = () => {
  const [enabled, setEnabled] = useState(false);
  const [dbInstance, setDbInstance] = useState(null);

  // Initialize database
  const initializeDB = useCallback(async () => {
    try {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: ['id', 'timestamp']
            });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('pair', 'pair');
            store.createIndex('walletAddress', 'walletAddress');
          }
        }
      });

      setDbInstance(db);
      return db;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      return null;
    }
  }, []);

  // Save position snapshot
  const savePositionSnapshot = useCallback(async (positions, timestamp = Date.now()) => {
    if (!enabled || !dbInstance) return;

    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await Promise.all(positions.map(position => {
        const id = `${position.pair}-${position.walletAddress || 'default'}`;
        return store.add({
          ...position,
          id,
          timestamp
        });
      }));

      await tx.done;
    } catch (error) {
      console.error('Failed to save position snapshot:', error);
    }
  }, [enabled, dbInstance]);

  // Get position history
  const getPositionHistory = useCallback(async (positionId, timeRange) => {
    if (!dbInstance) return [];

    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const startTime = timeRange ? Date.now() - timeRange : 0;
      const range = IDBKeyRange.lowerBound(startTime);

      const history = await index.getAll(range);
      return history.filter(item => item.id === positionId);
    } catch (error) {
      console.error('Failed to get position history:', error);
      return [];
    }
  }, [dbInstance]);

  // Clean up old data
  const cleanupOldData = useCallback(async (retentionDays = 30) => {
    if (!dbInstance) return;

    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(cutoffTime);

      let cursor = await index.openCursor(range);
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }

      await tx.done;
      if (cursor) {
        console.log(`Old data older than ${retentionDays} days has been cleaned up`);
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }, [dbInstance]);

  // Toggle history feature
  const toggleHistoryEnabled = useCallback(async (newEnabled) => {
    if (newEnabled && !dbInstance) {
      await initializeDB();
    }
    setEnabled(newEnabled);
    localStorage.setItem('historicalDataEnabled', newEnabled);
  }, [dbInstance, initializeDB]);

  // Initialize on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('historicalDataEnabled') === 'true';
    if (savedEnabled) {
      initializeDB().then(() => setEnabled(true));
    }
  }, [initializeDB]);

  // Cleanup old data periodically
  useEffect(() => {
    if (enabled && dbInstance) {
      const cleanup = () => cleanupOldData(30);
      cleanup(); // Initial cleanup
      const interval = setInterval(cleanup, 24 * 60 * 60 * 1000); // Daily cleanup
      return () => clearInterval(interval);
    }
  }, [enabled, dbInstance, cleanupOldData]);

  return {
    enabled,
    toggleHistoryEnabled,
    savePositionSnapshot,
    getPositionHistory
  };
};
