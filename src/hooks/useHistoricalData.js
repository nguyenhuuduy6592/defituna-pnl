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
  const [enabled, setEnabled] = useState(false);
  const [dbInstance, setDbInstance] = useState(null);
  const [error, setError] = useState(null);

  const handleError = (error, message) => {
    console.error(message, error);
    setError(message);
  };

  const initializeDB = useCallback(async () => {
    try {
      const db = await initDB();
      if (db) {
        setDbInstance(db);
        setError(null);
      }
      return db;
    } catch (error) {
      handleError(error, 'Failed to initialize position history database');
      return null;
    }
  }, []);

  const savePositionSnapshot = useCallback(async (positions, timestamp = Date.now()) => {
    if (!enabled || !dbInstance || !Array.isArray(positions)) {return;}

    try {
      const success = await saveSnapshot(dbInstance, positions, timestamp);
      success ? setError(null) : handleError(null, 'Failed to save position history data');
    } catch (error) {
      handleError(error, 'Failed to save position history data');
    }
  }, [enabled, dbInstance]);

  const getPositionHistory = useCallback(async (positionId, timeRange) => {
    if (!dbInstance) {return [];}

    try {
      const history = await getHistory(dbInstance, positionId, timeRange);
      setError(null);
      return history;
    } catch (error) {
      handleError(error, 'Failed to retrieve position history data');
      return [];
    }
  }, [dbInstance]);

  const toggleHistoryEnabled = useCallback(async (newEnabled) => {
    try {
      if (newEnabled && !dbInstance) {
        const db = await initializeDB();
        if (!db) {return;}
      }
      setEnabled(newEnabled);
      localStorage.setItem('historicalDataEnabled', String(newEnabled));
      setError(null);
    } catch (error) {
      handleError(error, 'Failed to toggle history collection feature');
    }
  }, [dbInstance, initializeDB]);

  useEffect(() => {
    const savedEnabled = localStorage.getItem('historicalDataEnabled') === 'true';
    if (savedEnabled) {
      initializeDB()
        .then(db => {
          if (db) {setEnabled(true);}
        })
        .catch(error => handleError(error, 'Failed to initialize historical data features'));
    }
  }, [initializeDB]);

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
  }, [enabled, dbInstance]);

  return {
    enabled,
    toggleHistoryEnabled,
    savePositionSnapshot,
    getPositionHistory,
    error,
  };
};
