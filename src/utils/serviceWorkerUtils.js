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
      // Optional: Queue message or handle appropriately
    }
  } catch (error) {
    console.error('[SW Utils] Error getting SW registration or posting message:', error, 'Message:', message);
  }
}; 