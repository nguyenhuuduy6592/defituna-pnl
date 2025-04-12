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
  const [isLoading, setIsLoading] = useState(false);

  // Ref to track if initial load is complete
  const initialLoadComplete = useRef(false);
  const dbRef = useRef(null);

  /**
   * Load settings and initialize service worker state
   */
  useEffect(() => {
    console.log('[useAutoRefresh Hook] Mount/Initial Load useEffect triggered.');
    const loadSettings = async () => {
      console.log('[Load Settings] Starting...');
      setIsLoading(true);
      try {
        // Initialize DB and store the instance
        console.log('[Load Settings] Initializing DB...');
        const db = await initializeDB();
        if (!db) {
          console.error('[Load Settings] DB Initialization failed.');
          throw new Error('Failed to initialize IndexedDB');
        }
        console.log('[Load Settings] DB Initialized successfully.');
        dbRef.current = db; // <-- Store DB instance in ref

        // First, load saved settings
        console.log('[Load Settings] Getting autoRefresh setting...');
        const autoRefreshData = await getData(db, STORE_NAMES.SETTINGS, 'autoRefresh');
        console.log('[Load Settings] Raw autoRefresh data from DB:', autoRefreshData);
        const loadedAutoRefresh = autoRefreshData?.value === true;
        console.log(`[Load Settings] Parsed loadedAutoRefresh: ${loadedAutoRefresh}`);
        
        console.log('[Load Settings] Getting refreshInterval setting...');
        const intervalData = await getData(db, STORE_NAMES.SETTINGS, 'refreshInterval');
        console.log('[Load Settings] Raw refreshInterval data from DB:', intervalData);
        const savedInterval = Number(intervalData?.value);
        let effectiveInterval = initialInterval;
        
        if (savedInterval && !isNaN(savedInterval) && savedInterval > 0) {
          console.log(`[Load Settings] Using saved interval: ${savedInterval}`);
          effectiveInterval = savedInterval;
          setRefreshInterval(savedInterval);
          setRefreshCountdown(savedInterval);
        } else {
          console.log(`[Load Settings] Using default/initial interval: ${initialInterval}`);
          setRefreshCountdown(initialInterval);
        }
        
        // Always inform service worker about interval first
        console.log(`[Load Settings] Posting SET_INTERVAL (${effectiveInterval}s) to SW.`);
        await postMessageToSW({ 
          type: 'SET_INTERVAL', 
          interval: effectiveInterval 
        });
        
        // Then set auto-refresh state and inform service worker if needed
        setAutoRefresh(loadedAutoRefresh);
        console.log(`[Load Settings] Setting component autoRefresh state to: ${loadedAutoRefresh}`);
        if (loadedAutoRefresh) {
          console.log('[Load Settings] Posting START_SYNC to SW.');
          await postMessageToSW({ type: 'START_SYNC' });
        } else {
          console.log('[Load Settings] Posting STOP_SYNC to SW.');
          await postMessageToSW({ type: 'STOP_SYNC' });
        }
        
        setError(null);
        initialLoadComplete.current = true; // Mark load as complete
        console.log('[Load Settings] Load sequence finished successfully.');
      } catch (error) {
        console.error('[Load Settings] Error during load sequence:', error);
        setError(`Failed to load settings: ${error.message}`);
        initialLoadComplete.current = true; // Mark complete even on error
      } finally {
        console.log('[Load Settings] Setting isLoading to false.');
        setIsLoading(false); // Set loading to false when done
      }
    };

    loadSettings();
    
    return () => {
      console.log('[useAutoRefresh Hook] Unmount/Cleanup for Initial Load useEffect.');
      // Clean up db instance on unmount (optional, idb handles closing)
      // dbRef.current?.close(); 
    };
  }, [initialInterval]);

  /**
   * Save refresh interval setting
   */
  const debouncedSaveInterval = useCallback(
    // Pass db instance to the debounced function
    debounce(async (intervalToSave, db) => { 
      console.log(`[Save Interval Debug] Debounced function EXECUTION for interval: ${intervalToSave}`); // Log execution start
      
      // Use the passed db instance
      if (!db) { 
        console.error('[Save Interval Debug] Cannot save interval, DB not initialized.');
        setError('Database connection lost. Cannot save settings.');
        return;
      }

      try {
        console.log(`[Save Interval Debug] Attempting to save interval ${intervalToSave} to IndexedDB.`);
        const success = await saveData(db, STORE_NAMES.SETTINGS, {
          key: 'refreshInterval',
          value: intervalToSave
        });
        
        if (success) {
          console.log(`[Save Interval Debug] Successfully saved interval ${intervalToSave}.`);
          // Always update the service worker with the new interval
          postMessageToSW({ type: 'SET_INTERVAL', interval: intervalToSave });
          setError(null); // Clear error on successful save
        } else {
           console.error('[Save Interval Debug] saveData function returned false.');
           throw new Error('IndexedDB save operation reported failure.');
        }
      } catch (error) {
        console.error(`[Save Interval Debug] Error saving refresh interval setting: ${error.message}`, error);
        setError(`Failed to save interval: ${error.message}`);
      }
    }, 100),
    [] // No dependencies needed for db instance as it's stable via ref
  );

  /**
   * Save autoRefresh setting & Inform SW of state changes
   * Debounced to handle rapid changes (e.g., StrictMode double invocation)
   */
  const debouncedSaveAutoRefresh = useCallback(
    // Pass db instance to the debounced function
    debounce(async (stateToSave, db) => { 
      console.log(`[Save AutoRefresh Debug] Debounced function EXECUTION for state: ${stateToSave}`);
      // Use the passed db instance
      if (!db) { 
        console.error('[Save AutoRefresh Debug] Cannot save state, DB not initialized.');
        setError('Database connection lost. Cannot save settings.');
        return;
      }

      try {
        console.log(`[Save AutoRefresh Debug] Attempting to save state ${stateToSave} to IndexedDB.`);
        const success = await saveData(db, STORE_NAMES.SETTINGS, { key: 'autoRefresh', value: stateToSave });
        
        if (success) {
          console.log(`[Save AutoRefresh Debug] Successfully saved state ${stateToSave}.`);
          setError(null); // Clear error on successful save
          // Tell SW to start/stop based on the debounced state
          console.log(`[Save AutoRefresh Debug] Posting ${stateToSave ? 'START_SYNC' : 'STOP_SYNC'} to SW.`);
          if (stateToSave) {
            postMessageToSW({ type: 'START_SYNC' });
          } else {
            postMessageToSW({ type: 'STOP_SYNC' });
          }
        } else {
          console.error('[Save AutoRefresh Debug] saveData function returned false.');
          throw new Error('IndexedDB save operation reported failure.');
        }
      } catch (error) {
        console.error(`[Save AutoRefresh Debug] Error in Debounced Save/Sync (state was ${stateToSave}):`, error);
        setError(`Failed to save auto-refresh state: ${error.message}`);
      }
    }, 100), // Debounce for 100ms
    [] // No dependencies needed for db instance as it's stable via ref
  );

  /**
   * Reset countdown when interval changes 
   */
  useEffect(() => {
    console.log(`[useAutoRefresh Hook] Interval changed to ${refreshInterval}. Resetting countdown.`);
    // Reset countdown visually immediately when interval changes
    setRefreshCountdown(refreshInterval);
    
    return () => {
      console.log('[useAutoRefresh Hook] Unmount/Cleanup for Interval Change useEffect.');
    };
  }, [refreshInterval]);

  /**
   * Handle service worker messages to reset countdown
   */
  useEffect(() => {
    console.log('[useAutoRefresh Hook] Setting up SW Message listener.');
    const handleServiceWorkerMessage = (event) => {
      const message = event.data;
      console.log('[SW Message Handler] Received message:', message);
      
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
    let listenerAttached = false;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      listenerAttached = true;
      console.log('[useAutoRefresh Hook] SW Message listener ADDED.');
    } else {
      console.log('[useAutoRefresh Hook] SW Message listener NOT added (no SW support/available).');
    }
    
    return () => {
       if (listenerAttached) {
          navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
          console.log('[useAutoRefresh Hook] SW Message listener REMOVED.');
       }
    };
  }, [refreshInterval]); // Re-attach if interval changes, as it's used in the handler

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
    console.log(`[setValidatedAutoRefresh] Called with value: ${value} -> Parsed: ${booleanValue}`);
    setAutoRefresh(booleanValue);
    // Directly call the debounced save/sync function with the intended value and DB instance
    console.log(`[setValidatedAutoRefresh] Scheduling debounced save for state: ${booleanValue}`);
    debouncedSaveAutoRefresh(booleanValue, dbRef.current);
  }, [debouncedSaveAutoRefresh]); // dbRef.current is stable, no need to list

  /**
   * Update refresh interval state and trigger save
   */
  const setValidatedRefreshInterval = useCallback((interval) => {
    const newInterval = parseInt(interval, 10);
    console.log(`[Save Interval Debug] setValidatedRefreshInterval called with: ${interval} -> Parsed: ${newInterval}`); // Log validation call
    if (!isNaN(newInterval) && newInterval > 0) {
      setRefreshInterval(newInterval);
      // Call debounced save function, passing the current DB instance
      console.log(`[Save Interval Debug] Scheduling debounced save for interval: ${newInterval}`); // Log scheduling
      debouncedSaveInterval(newInterval, dbRef.current);
    } else {
       console.warn(`[Save Interval Debug] Invalid interval value received: ${interval}`);
    }
  }, [debouncedSaveInterval]); // dbRef.current is stable, no need to list

  return {
    autoRefresh,
    setAutoRefresh: setValidatedAutoRefresh,
    refreshInterval,
    setRefreshInterval: setValidatedRefreshInterval,
    refreshCountdown,
    isRefreshing,
    error,
    isLoading
  };
};