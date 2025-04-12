/**
 * Utility functions to interact with the service worker.
 */

/**
 * Utility function to post messages to the active service worker.
 * Uses navigator.serviceWorker.ready to ensure the worker is active.
 * 
 * @param {Object} message - The message object to send.
 * @returns {Promise<void>}
 */
export const postMessageToSW = async (message) => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW Utils] Service Worker API not supported.');
    return;
  }
  try {
    // Wait for the service worker registration to be active
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
    } else {
      console.warn('[SW Utils] Service Worker is registered but not active.');
    }
  } catch (error) {
    console.error('[SW Utils] Error getting SW registration or posting message:', error, 'Message:', message);
  }
};

/**
 * Enable or disable auto-refresh functionality
 * @param {boolean} enabled - Whether to enable auto-refresh
 * @param {number} [interval] - Optional refresh interval in seconds
 */
export const setAutoRefresh = async (enabled, interval) => {
  // First set the interval if provided
  if (typeof interval === 'number' && interval > 0) {
    await setRefreshInterval(interval);
  }
  
  // Then start/stop the sync
  await postMessageToSW({
    type: enabled ? 'START_SYNC' : 'STOP_SYNC'
  });
};

/**
 * Set the refresh interval for auto-refresh
 * @param {number} interval - Refresh interval in seconds
 */
export const setRefreshInterval = async (interval) => {
  if (typeof interval !== 'number' || interval <= 0) {
    console.warn('[SW Utils] Invalid interval:', interval);
    return;
  }
  
  await postMessageToSW({
    type: 'SET_INTERVAL',
    interval
  });
};

/**
 * Trigger a manual sync without starting the periodic refresh
 */
export const triggerManualSync = async () => {
  await postMessageToSW({
    type: 'FORCE_SYNC'
  });
};

/**
 * Set the wallets to monitor
 * @param {string[]} wallets - Array of wallet addresses
 */
export const setWallets = async (wallets) => {
  await postMessageToSW({
    type: 'SET_WALLETS',
    wallets
  });
}; 