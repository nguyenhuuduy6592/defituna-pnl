import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';
import { postMessageToSW } from '@/utils/serviceWorkerUtils';
import { REFRESH_INTERVALS } from '@/utils/constants';

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

/**
 * Custom hook that provides auto-refresh functionality controlled via a Service Worker
 * Manages auto-refresh state, refresh interval, and provides a visual countdown
 * The Service Worker is the single source of truth for refresh operations
 * 
 * @param {number} [initialInterval=DEFAULT] - Initial refresh interval in seconds
 * @returns {Object} Auto-refresh configuration and state
 * @returns {boolean} returns.autoRefresh - Whether auto-refresh is enabled
 * @returns {Function} returns.setAutoRefresh - Function to toggle auto-refresh
 * @returns {number} returns.refreshInterval - Current refresh interval in seconds
 * @returns {Function} returns.setRefreshInterval - Function to update refresh interval
 * @returns {number} returns.refreshCountdown - Countdown until next *scheduled* refresh by SW (visual only)
 * @returns {boolean} returns.isRefreshing - Whether a refresh is currently in progress (visual only)
 */
export const useAutoRefresh = (initialInterval = REFRESH_INTERVALS.DEFAULT) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [refreshCountdown, setRefreshCountdown] = useState(initialInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Ref to track if initial load is complete
  const initialLoadComplete = useRef(false);

  /**
   * Load settings and initialize service worker state
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }
        
        // First, load saved settings
        const autoRefreshData = await getData(db, STORE_NAMES.SETTINGS, 'autoRefresh');
        console.log('[Auto-Refresh] Auto-Refresh Data:', autoRefreshData);
        const loadedAutoRefresh = autoRefreshData?.value === true;
        
        const intervalData = await getData(db, STORE_NAMES.SETTINGS, 'refreshInterval');
        console.log('[Auto-Refresh] Interval Data:', intervalData);
        const savedInterval = Number(intervalData?.value);
        let effectiveInterval = initialInterval;
        
        if (savedInterval && !isNaN(savedInterval) && savedInterval > 0) {
          effectiveInterval = savedInterval;
          setRefreshInterval(savedInterval);
          setRefreshCountdown(savedInterval);
        } else {
          setRefreshCountdown(initialInterval);
        }
        
        // Always inform service worker about interval first
        console.log(`[Auto-Refresh] Setting interval to ${effectiveInterval}s`);
        await postMessageToSW({ 
          type: 'SET_INTERVAL', 
          interval: effectiveInterval 
        });
        
        // Then set auto-refresh state and inform service worker if needed
        setAutoRefresh(loadedAutoRefresh);
        if (loadedAutoRefresh) {
          console.log('[Auto-Refresh] Enabling auto-refresh on load');
          await postMessageToSW({ type: 'START_SYNC' });
        } else {
          console.log('[Auto-Refresh] Auto-refresh disabled on load');
          await postMessageToSW({ type: 'STOP_SYNC' });
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
   * Save refresh interval setting
   */
  const debouncedSaveInterval = useCallback(
    debounce(async (intervalToSave) => {
      if (!initialLoadComplete.current) return; // Skip if initial load not complete
      
      try {
        const db = await initializeDB();
        if (!db) throw new Error('Failed to initialize IndexedDB');
        
        await saveData(db, STORE_NAMES.SETTINGS, {
          key: 'refreshInterval',
          value: intervalToSave
        });
        
        // Always update the service worker with the new interval
        postMessageToSW({ type: 'SET_INTERVAL', interval: intervalToSave });
        
        setError(null);
      } catch (error) {
        console.error('Error saving refresh interval setting:', error);
        setError('Failed to save refresh interval setting');
      }
    }, 100),
    []
  );

  /**
   * Save autoRefresh setting & Inform SW of state changes
   * Debounced to handle rapid changes (e.g., StrictMode double invocation)
   */
  const debouncedSaveAutoRefresh = useCallback(
    debounce(async (stateToSave) => {
      try {
        const db = await initializeDB();
        if (!db) throw new Error('Failed to initialize IndexedDB');
        
        await saveData(db, STORE_NAMES.SETTINGS, { key: 'autoRefresh', value: stateToSave });
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
   * Reset countdown when interval changes 
   */
  useEffect(() => {
    // Reset countdown visually immediately when interval changes
    setRefreshCountdown(refreshInterval);
  }, [refreshInterval]);

  /**
   * Handle service worker messages to reset countdown
   */
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      const message = event.data;
      
      if (message.type === 'NEW_POSITIONS_DATA') {
        console.log('[Timer Debug] 🔄 Received new data:', {
          timestamp: new Date().toISOString(),
          resettingTo: refreshInterval
        });
        // Reset countdown and refreshing state immediately
        setIsRefreshing(false);
        setRefreshCountdown(refreshInterval);
      }
    };

    // Only add listener if service worker is available
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }
    return () => {}; // Return empty cleanup function if no service worker
  }, [refreshInterval]);

  /**
   * Visual countdown timer useEffect - only for UI display
   * Note: The actual refresh is handled by the service worker, this is just for UI feedback
   */
  useEffect(() => {
    // Timer only runs if autoRefresh is on
    if (!autoRefresh) {
      console.log('[Timer Debug] ⏹️ Timer stopped:', {
        reason: 'auto-refresh disabled',
        resettingTo: refreshInterval
      });
      setRefreshCountdown(refreshInterval);
      setIsRefreshing(false);
      return;
    }

    console.log('[Timer Debug] ⏰ Starting countdown timer:', {
      interval: refreshInterval,
      timestamp: new Date().toISOString()
    });

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        // Ensure countdown doesn't go below 1 to prevent early triggers
        const next = prev <= 1 ? 1 : prev - 1;
        
        // Only set refreshing state when countdown reaches 1
        if (prev <= 1) {
          setIsRefreshing(true);
          // Trigger a sync when we reach the end
          postMessageToSW({ type: 'FORCE_SYNC' });
        }
        else {
          console.log('[Timer Debug] 📉 Countdown tick:', {
            from: prev,
            to: next,
            isRefreshing: prev <= 1
          });

        }
        
        return next;
      });
    }, REFRESH_INTERVALS.SECONDS);

    return () => {
      console.log('[Timer Debug] 🧹 Cleaning up timer');
      clearInterval(timer);
    };
  }, [autoRefresh, refreshInterval]);

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
      debouncedSaveInterval(numValue);
    } else {
      setRefreshInterval(REFRESH_INTERVALS.DEFAULT);
      debouncedSaveInterval(REFRESH_INTERVALS.DEFAULT);
    }
  }, [debouncedSaveInterval]);

  return {
    autoRefresh,
    setAutoRefresh: setValidatedAutoRefresh,
    refreshInterval,
    setRefreshInterval: setValidatedRefreshInterval,
    refreshCountdown,
    isRefreshing,
    error
  };
};