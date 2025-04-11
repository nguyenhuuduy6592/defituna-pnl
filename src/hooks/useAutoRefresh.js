import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

// Constants
const DEFAULT_INTERVAL = 30;
const AUTO_REFRESH_KEY = 'autoRefresh';
const REFRESH_INTERVAL_KEY = 'refreshInterval';

/**
 * Custom hook that provides auto-refresh functionality with countdown and visibility awareness
 * Manages auto-refresh state, refresh interval, and countdown timer
 * Only refreshes when the browser tab is visible
 * 
 * @param {Function} onRefresh - Callback function to execute when refresh is triggered
 * @param {number} [initialInterval=30] - Initial refresh interval in seconds
 * @returns {Object} Auto-refresh configuration and state
 * @returns {boolean} returns.autoRefresh - Whether auto-refresh is enabled
 * @returns {Function} returns.setAutoRefresh - Function to toggle auto-refresh
 * @returns {number} returns.refreshInterval - Current refresh interval in seconds
 * @returns {Function} returns.setRefreshInterval - Function to update refresh interval
 * @returns {number} returns.refreshCountdown - Countdown until next refresh in seconds
 */
export const useAutoRefresh = (onRefresh, initialInterval = DEFAULT_INTERVAL) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [refreshCountdown, setRefreshCountdown] = useState(initialInterval);
  const [error, setError] = useState(null);
  const isVisibleRef = useRef(true);
  const onRefreshRef = useRef(onRefresh); // Store callback in ref to avoid dependency changes

  // Update callback ref when onRefresh changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  /**
   * Load saved settings from IndexedDB on initial mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }

        // Load auto-refresh state
        const autoRefreshData = await getData(db, STORE_NAMES.SETTINGS, AUTO_REFRESH_KEY);
        setAutoRefresh(autoRefreshData?.value === true);

        // Load refresh interval
        const intervalData = await getData(db, STORE_NAMES.SETTINGS, REFRESH_INTERVAL_KEY);
        const savedInterval = Number(intervalData?.value);
        if (savedInterval && !isNaN(savedInterval) && savedInterval > 0) {
          setRefreshInterval(savedInterval);
          setRefreshCountdown(savedInterval);
        }

        setError(null);
      } catch (error) {
        console.error('Error loading auto-refresh settings:', error);
        setError('Failed to load auto-refresh settings');
      }
    };

    loadSettings();
  }, []);

  /**
   * Save settings to IndexedDB whenever they change
   */
  useEffect(() => {
    const saveSettings = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }

        await Promise.all([
          saveData(db, STORE_NAMES.SETTINGS, { key: AUTO_REFRESH_KEY, value: autoRefresh }),
          saveData(db, STORE_NAMES.SETTINGS, { key: REFRESH_INTERVAL_KEY, value: refreshInterval })
        ]);

        setError(null);
      } catch (error) {
        console.error('Error saving auto-refresh settings:', error);
        setError('Failed to save auto-refresh settings');
      }
    };

    saveSettings();
  }, [autoRefresh, refreshInterval]);

  /**
   * Update visibility state when tab visibility changes
   */
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = document.visibilityState === 'visible';
  }, []);

  // Set up visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  /**
   * Reset countdown when interval changes or auto-refresh is enabled
   */
  useEffect(() => {
    if (autoRefresh) {
      setRefreshCountdown(refreshInterval);
    }
  }, [refreshInterval, autoRefresh]);

  /**
   * Handle countdown timer and trigger refresh when needed
   */
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const countdownTick = () => {
      // Only countdown if the tab is visible
      if (!isVisibleRef.current) {
        return;
      }
      
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          try {
            // Check visibility again just before refresh, though redundant if countdown only happens when visible
            if (isVisibleRef.current && onRefreshRef.current) {
              onRefreshRef.current();
            }
          } catch (error) {
            console.error('Error in refresh callback:', error);
            setError('Error occurred during auto-refresh');
          }
          return refreshInterval;
        }
        return prev - 1;
      });
    };

    const timer = setInterval(countdownTick, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  /**
   * Update auto-refresh state with proper validation
   */
  const setValidatedAutoRefresh = useCallback((value) => {
    if (typeof value === 'boolean') {
      setAutoRefresh(value);
    } else {
      setAutoRefresh(Boolean(value));
    }
  }, []);

  /**
   * Update refresh interval with validation
   */
  const setValidatedRefreshInterval = useCallback((value) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 0) {
      setRefreshInterval(numValue);
    } else {
      console.warn('Invalid refresh interval, using default instead');
      setRefreshInterval(DEFAULT_INTERVAL);
    }
  }, []);

  return {
    autoRefresh,
    setAutoRefresh: setValidatedAutoRefresh,
    refreshInterval,
    setRefreshInterval: setValidatedRefreshInterval,
    refreshCountdown,
    error
  };
};