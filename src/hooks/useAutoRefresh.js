import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';
import { postMessageToSW } from '@/utils/serviceWorkerUtils'; // Import the utility

// Constants
const DEFAULT_INTERVAL = 30;
const AUTO_REFRESH_KEY = 'autoRefresh';
const REFRESH_INTERVAL_KEY = 'refreshInterval';

// --- Debounce Utility ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
// --- End Debounce Utility ---

// Helper to post messages to the service worker (more robust)
// const postMessageToSW = async (message) => { ... }; // REMOVED

/**
 * Custom hook that provides auto-refresh functionality controlled via a Service Worker
 * Manages auto-refresh state, refresh interval, and provides a visual countdown
 * 
 * @param {number} [initialInterval=30] - Initial refresh interval in seconds
 * @returns {Object} Auto-refresh configuration and state
 * @returns {boolean} returns.autoRefresh - Whether auto-refresh is enabled
 * @returns {Function} returns.setAutoRefresh - Function to toggle auto-refresh
 * @returns {number} returns.refreshInterval - Current refresh interval in seconds
 * @returns {Function} returns.setRefreshInterval - Function to update refresh interval
 * @returns {number} returns.refreshCountdown - Countdown until next *scheduled* refresh by SW (visual only)
 */
export const useAutoRefresh = (initialInterval = DEFAULT_INTERVAL) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [refreshCountdown, setRefreshCountdown] = useState(initialInterval);
  const [error, setError] = useState(null);
  const isVisibleRef = useRef(true);

  // Ref to track if initial load is complete
  const initialLoadComplete = useRef(false);

  /**
   * Load settings (no change)
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }
        const autoRefreshData = await getData(db, STORE_NAMES.SETTINGS, AUTO_REFRESH_KEY);
        const loadedAutoRefresh = autoRefreshData?.value === true;
        setAutoRefresh(loadedAutoRefresh);

        const intervalData = await getData(db, STORE_NAMES.SETTINGS, REFRESH_INTERVAL_KEY);
        const savedInterval = Number(intervalData?.value);
        if (savedInterval && !isNaN(savedInterval) && savedInterval > 0) {
          setRefreshInterval(savedInterval);
          setRefreshCountdown(savedInterval);
        } else {
          setRefreshCountdown(initialInterval); // Use initial if nothing valid loaded
        }
        
        // Tell SW the initial state after loading
        postMessageToSW({ type: 'SET_INTERVAL', interval: savedInterval || initialInterval });
        if (loadedAutoRefresh) {
          postMessageToSW({ type: 'START_SYNC' });
        } else {
          postMessageToSW({ type: 'STOP_SYNC' });
        }

        setError(null);
        initialLoadComplete.current = true; // Mark load as complete
      } catch (error) {
        console.error('Error loading auto-refresh settings:', error);
        setError('Failed to load auto-refresh settings');
        initialLoadComplete.current = true; // Mark complete even on error to avoid blocking saves
      }
    };

    loadSettings();
  }, [initialInterval]);

  /**
   * Save settings & Inform SW of interval changes
   * Added check for initial load and explicit type check
   */
  useEffect(() => {
    // Only run save after initial load and if interval is a valid number
    if (!initialLoadComplete.current || typeof refreshInterval !== 'number' || isNaN(refreshInterval)) {
      return; 
    }

    const saveSettings = async () => {
      let db = null; // Scope db outside try
      try {
        db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }
        
        // Value is already checked to be a valid number by the outer if
        const dataToSave = { key: REFRESH_INTERVAL_KEY, value: refreshInterval }; 
        
        await saveData(db, STORE_NAMES.SETTINGS, dataToSave);
        
        setError(null);
        
        // Inform SW about interval change
        postMessageToSW({ type: 'SET_INTERVAL', interval: refreshInterval });

      } catch (error) {
        console.error('Error saving refresh interval setting:', error);
        setError('Failed to save refresh interval setting');
      }
    };
    
    saveSettings();

  }, [refreshInterval]);

  /**
   * Save autoRefresh setting & Inform SW of state changes
   * Debounced to handle rapid changes (e.g., StrictMode double invocation)
   */
  const debouncedSaveAutoRefresh = useCallback(
    debounce(async (stateToSave) => {
      try {
        const db = await initializeDB();
        if (!db) throw new Error('Failed to initialize IndexedDB');
        
        await saveData(db, STORE_NAMES.SETTINGS, { key: AUTO_REFRESH_KEY, value: stateToSave });
        setError(null);

        // Tell SW to start/stop based on the debounced state
        if (stateToSave) {
          postMessageToSW({ type: 'START_SYNC' });
        } else {
          postMessageToSW({ type: 'STOP_SYNC' });
        }
      } catch (error) {
        console.error(`Error in Debounced Save/Sync (state was ${stateToSave}):`, error);
        setError('Failed to save auto refresh setting');
      }
    }, 100), // Debounce for 100ms
    [] // Dependencies for useCallback, typically empty for debounce wrapper
  );

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
   * Reset countdown when interval changes (no change in logic, just dependency)
   */
  useEffect(() => {
    // Reset countdown visually immediately when interval changes
    setRefreshCountdown(refreshInterval);
  }, [refreshInterval]);

  /**
   * Visual countdown timer useEffect (REMOVED onRefresh call)
   */
  useEffect(() => {
    // Timer only runs if autoRefresh is on AND tab is visible
    if (!autoRefresh || !isVisibleRef.current) {
      // If timer was running but should stop (either disabled or tab hidden),
      // ensure countdown resets visually to the full interval for next time.
      setRefreshCountdown(refreshInterval);
      return;
    }

    // Start a timer only if auto-refresh is on and tab is visible
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        // Reset to full interval if countdown reaches zero (or below)
        if (prev <= 1) {
          // No refresh trigger here - SW handles it
          return refreshInterval;
        }
        // Otherwise, decrement
        return prev - 1;
      });
    }, 1000);

    // Cleanup: clear interval when effect re-runs or component unmounts
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, isVisibleRef.current]);

  /**
   * Update auto-refresh state
   */
  const setValidatedAutoRefresh = useCallback((value) => {
    const booleanValue = Boolean(value);
    setAutoRefresh(booleanValue);
    // Directly call the debounced save/sync function with the intended value
    debouncedSaveAutoRefresh(booleanValue);
  }, [debouncedSaveAutoRefresh]);

  /**
   * Update refresh interval
   */
  const setValidatedRefreshInterval = useCallback((value) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 0) {
      setRefreshInterval(numValue);
    } else {
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