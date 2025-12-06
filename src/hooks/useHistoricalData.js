import { useState, useEffect, useCallback } from 'react';
import {
  initializeDB as initDB,
  savePositionSnapshot as saveSnapshot,
  getPositionHistory as getHistory,
  cleanupOldData as cleanupData,
  DEFAULT_RETENTION_DAYS,
} from '../utils/indexedDB';

/**
 * Hook for managing historical position data using IndexedDB
 * Provides methods to save, retrieve, and manage historical trading position data
 *
 * @returns {Object} Historical data management functions and state
 */
export const useHistoricalData = () => {
  const [enabled, setEnabled] = useState(() => {
    // Initialize enabled state from localStorage
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('historicalDataEnabled') === 'true';
      } catch (error) {
        console.error(
          'Error reading historicalDataEnabled from localStorage:',
          error
        );
        return false;
      }
    }
    return false;
  });
  const [dbInstance, setDbInstance] = useState(null);
  const [error, setError] = useState(null);

  const handleError = useCallback((error, message) => {
    console.error(message, error);
    setError(message);
  }, []);

  const initializeDB = useCallback(async () => {
    try {
      const db = await initDB();
      if (db) {
        setDbInstance(db);
        setError(null);
      }
      return db;
    } catch (error) {
      console.error('Failed to initialize position history database:', error);
      return null;
    }
  }, []);

  const savePositionSnapshot = useCallback(
    async (positions, timestamp = Date.now()) => {
      if (!enabled || !dbInstance || !Array.isArray(positions)) {
        return;
      }

      try {
        const success = await saveSnapshot(dbInstance, positions, timestamp);
        if (!success) {
          handleError(null, 'Failed to save position history data');
        }
      } catch (error) {
        handleError(error, 'Failed to save position history data');
      }
    },
    [enabled, dbInstance, handleError]
  );

  const getPositionHistory = useCallback(
    async (positionId, timeRange) => {
      if (!dbInstance) {
        return [];
      }

      try {
        const history = await getHistory(dbInstance, positionId, timeRange);
        return history;
      } catch (error) {
        handleError(error, 'Failed to retrieve position history data');
        return [];
      }
    },
    [dbInstance, handleError]
  );

  const toggleHistoryEnabled = useCallback(
    async (newEnabled) => {
      try {
        if (newEnabled && !dbInstance) {
          const db = await initializeDB();
          if (!db) {
            return;
          }
        }
        setEnabled(newEnabled);
        localStorage.setItem('historicalDataEnabled', String(newEnabled));
        setError(null);
      } catch (error) {
        handleError(error, 'Failed to toggle history collection feature');
      }
    },
    [dbInstance, initializeDB, handleError]
  );

  // Initialize database if enabled
  useEffect(() => {
    if (enabled && !dbInstance) {
      const init = async () => {
        try {
          const db = await initDB();
          if (db) {
            setDbInstance(db);
            setError(null);
          }
        } catch (error) {
          console.error(
            'Failed to initialize position history database:',
            error
          );
          setError('Failed to initialize position history database');
        }
      };
      init();
    }
  }, [enabled, dbInstance]);

  useEffect(() => {
    if (enabled && dbInstance) {
      const cleanup = async () => {
        try {
          const success = await cleanupData(dbInstance, DEFAULT_RETENTION_DAYS);
          if (!success) {
            handleError(null, 'Failed to clean up old position history data');
          }
        } catch (error) {
          handleError(error, 'Failed to clean up old position history data');
        }
      };

      cleanup();
      const interval = setInterval(cleanup, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [enabled, dbInstance, handleError]);

  return {
    enabled,
    toggleHistoryEnabled,
    savePositionSnapshot,
    getPositionHistory,
    error,
  };
};
