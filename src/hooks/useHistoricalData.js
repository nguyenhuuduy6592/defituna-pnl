import { openDB } from 'idb';
import { useState, useEffect, useCallback } from 'react';
import { showNotification } from '../utils/notifications';

const DB_NAME = 'defituna-pnl';
const DB_VERSION = 1;
const STORES = {
  positions: 'positions',
  settings: 'settings'
};

export const useHistoricalData = () => {
  const [enabled, setEnabled] = useState(false);
  const [dbInstance, setDbInstance] = useState(null);
  const [storageStats, setStorageStats] = useState(null);

  // Initialize database
  const initializeDB = useCallback(async () => {
    try {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create positions store with compound key
          if (!db.objectStoreNames.contains(STORES.positions)) {
            const positionsStore = db.createObjectStore(STORES.positions, {
              keyPath: ['id', 'timestamp']
            });
            // Create indexes for querying
            positionsStore.createIndex('timestamp', 'timestamp');
            positionsStore.createIndex('pair', 'pair');
            positionsStore.createIndex('walletAddress', 'walletAddress');
          }

          // Create settings store
          if (!db.objectStoreNames.contains(STORES.settings)) {
            db.createObjectStore(STORES.settings, { keyPath: 'id' });
          }
        }
      });

      setDbInstance(db);
      return db;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      showNotification('Failed to initialize local storage', 'error');
      return null;
    }
  }, []);

  // Save position snapshot
  const savePositionSnapshot = useCallback(async (positions, timestamp = Date.now()) => {
    if (!enabled || !dbInstance) return;

    try {
      const tx = dbInstance.transaction(STORES.positions, 'readwrite');
      const store = tx.objectStore(STORES.positions);

      // Save each position with a unique ID
      await Promise.all(positions.map(position => {
        const id = `${position.pair}-${position.walletAddress || 'default'}`;
        return store.add({
          ...position,
          id,
          timestamp
        });
      }));

      await tx.done;
      await updateStorageStats();
    } catch (error) {
      console.error('Failed to save position snapshot:', error);
    }
  }, [enabled, dbInstance]);

  // Get position history
  const getPositionHistory = useCallback(async (positionId, timeRange) => {
    if (!dbInstance) return [];

    try {
      const tx = dbInstance.transaction(STORES.positions, 'readonly');
      const store = tx.objectStore(STORES.positions);
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
      const tx = dbInstance.transaction(STORES.positions, 'readwrite');
      const store = tx.objectStore(STORES.positions);
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(cutoffTime);

      let cursor = await index.openCursor(range);
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }

      await tx.done;
      await updateStorageStats();
      if (cursor) {
        showNotification(`Old data older than the retention period of ${retentionDays} days has been cleaned up successfully`);
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }, [dbInstance]);

  // Get storage statistics
  const updateStorageStats = useCallback(async () => {
    if (!dbInstance) return;

    try {
      const tx = dbInstance.transaction(STORES.positions, 'readonly');
      const store = tx.objectStore(STORES.positions);
      const index = store.index('timestamp');

      const count = await store.count();
      const oldestCursor = await index.openCursor(null, 'next');
      const newestCursor = await index.openCursor(null, 'prev');

      const stats = {
        count,
        oldestTimestamp: oldestCursor?.value?.timestamp,
        newestTimestamp: newestCursor?.value?.timestamp
      };

      setStorageStats(stats);
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
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
    getPositionHistory,
    cleanupOldData,
    storageStats,
    updateStorageStats
  };
};
