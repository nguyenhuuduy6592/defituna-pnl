import { openDB } from 'idb';
import { useState, useEffect, useCallback } from 'react';

// Constants for IndexedDB configuration
const DB_NAME = 'defituna-pnl';
const DB_VERSION = 1;
const STORE_NAME = 'positions';
const DEFAULT_RETENTION_DAYS = 30;

/**
 * Hook for managing historical position data using IndexedDB
 * Provides methods to save, retrieve, and manage historical trading position data
 * 
 * @returns {Object} Historical data management functions and state
 * @returns {boolean} returns.enabled - Whether historical data collection is enabled
 * @returns {Function} returns.toggleHistoryEnabled - Function to toggle historical data collection
 * @returns {Function} returns.savePositionSnapshot - Function to save a snapshot of positions
 * @returns {Function} returns.getPositionHistory - Function to retrieve position history
 */
export const useHistoricalData = () => {
  const [enabled, setEnabled] = useState(false);
  const [dbInstance, setDbInstance] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Initialize IndexedDB database for storing position history
   * Creates necessary object stores and indexes if they don't exist
   * 
   * @returns {Promise<IDBDatabase|null>} Database instance or null on failure
   */
  const initializeDB = useCallback(async () => {
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

      setDbInstance(db);
      setError(null);
      return db;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      setError('Failed to initialize position history database');
      return null;
    }
  }, []);

  /**
   * Save a snapshot of the current positions to the database
   * Each position is stored with the current timestamp
   * 
   * @param {Array} positions - Array of position objects to save
   * @param {number} timestamp - Optional timestamp (defaults to current time)
   * @returns {Promise<void>}
   */
  const savePositionSnapshot = useCallback(async (positions, timestamp = Date.now()) => {
    if (!enabled || !dbInstance || !Array.isArray(positions)) return;

    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
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
      setError(null);
    } catch (error) {
      console.error('Failed to save position snapshot:', error);
      setError('Failed to save position history data');
    }
  }, [enabled, dbInstance]);

  /**
   * Retrieve historical data for a specific position
   * 
   * @param {string} positionId - ID of the position to retrieve history for
   * @param {number} timeRange - Optional time range in milliseconds (from now)
   * @returns {Promise<Array>} Array of historical position records
   */
  const getPositionHistory = useCallback(async (positionId, timeRange) => {
    if (!dbInstance) return [];

    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      // Filter by timestamp if timeRange is provided
      const startTime = timeRange ? Date.now() - timeRange : 0;
      const range = IDBKeyRange.lowerBound(startTime);

      const history = await index.getAll(range);
      setError(null);
      return history.filter(item => item.id === positionId);
    } catch (error) {
      console.error('Failed to get position history:', error);
      setError('Failed to retrieve position history data');
      return [];
    }
  }, [dbInstance]);

  /**
   * Clean up historical data older than the specified retention period
   * 
   * @param {number} retentionDays - Number of days to retain data for
   * @returns {Promise<void>}
   */
  const cleanupOldData = useCallback(async (retentionDays = DEFAULT_RETENTION_DAYS) => {
    if (!dbInstance) return;

    try {
      const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
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
      setError(null);
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      setError('Failed to clean up old position history data');
    }
  }, [dbInstance]);

  /**
   * Toggle whether historical data collection is enabled
   * Initializes the database if enabling and not already initialized
   * 
   * @param {boolean} newEnabled - New enabled state
   * @returns {Promise<void>}
   */
  const toggleHistoryEnabled = useCallback(async (newEnabled) => {
    try {
      if (newEnabled && !dbInstance) {
        await initializeDB();
      }
      setEnabled(newEnabled);
      localStorage.setItem('historicalDataEnabled', String(newEnabled));
      setError(null);
    } catch (error) {
      console.error('Failed to toggle history enabled:', error);
      setError('Failed to toggle history collection feature');
    }
  }, [dbInstance, initializeDB]);

  // Initialize on mount - load settings from localStorage
  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem('historicalDataEnabled') === 'true';
      if (savedEnabled) {
        initializeDB().then(() => setEnabled(true));
      }
    } catch (error) {
      console.error('Error initializing historical data:', error);
      setError('Failed to initialize historical data features');
    }
  }, [initializeDB]);

  // Cleanup old data periodically when enabled
  useEffect(() => {
    if (enabled && dbInstance) {
      // Initial cleanup and then daily
      const cleanup = () => cleanupOldData(DEFAULT_RETENTION_DAYS);
      cleanup();
      
      const interval = setInterval(cleanup, 24 * 60 * 60 * 1000); // Daily cleanup
      return () => clearInterval(interval);
    }
  }, [enabled, dbInstance, cleanupOldData]);

  return {
    enabled,
    toggleHistoryEnabled,
    savePositionSnapshot,
    getPositionHistory,
    error
  };
};
