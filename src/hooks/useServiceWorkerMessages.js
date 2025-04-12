import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Simple debounce function to prevent multiple rapid calls
 */
const debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
};

/**
 * Manually trigger a check for new data from IndexedDB
 * This can be called if we know the service worker may have fetched data
 * but we haven't received a notification for some reason
 */
export const checkForUpdates = (callback) => {
  if (typeof callback === 'function') {
    // Create a synthetic event with current timestamp
    const syntheticEvent = {
      data: {
        type: 'NEW_POSITIONS_DATA',
        timestamp: Date.now(),
        count: 0,
        synthetic: true
      }
    };
    callback(syntheticEvent.data);
  }
};

/**
 * Hook that listens for messages from the service worker
 * 
 * @param {Object} options Configuration options
 * @param {Function} options.onNewPositionsData Callback for when new positions data is available
 * @returns {Object} Service worker message state and handlers
 */
export const useServiceWorkerMessages = ({ onNewPositionsData }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs to maintain stable references across renders
  const lastHandledTimestampRef = useRef(0);
  const listenerAddedRef = useRef(false);
  const callbackRef = useRef(onNewPositionsData);
  
  // Update the callback ref whenever the passed callback changes
  useEffect(() => {
    callbackRef.current = onNewPositionsData;
  }, [onNewPositionsData]);
  
  // Create a stable debounced handler that always uses the latest callback
  const stablePositionHandler = useRef(
    debounce((data) => {
      if (typeof callbackRef.current === 'function') {
        console.log('Executing debounced position data handler');
        callbackRef.current(data);
      }
    }, 1000)
  ).current;
  
  // Create a stable message handler that doesn't change on rerenders
  const stableMessageHandler = useRef((event) => {
    console.log('[SW Message]', event.data);
    
    // Store the last message received
    setLastMessage(event.data);
    
    // Handle specific message types
    if (event.data && event.data.type === 'NEW_POSITIONS_DATA') {
      // Check if this message has a timestamp and if it's newer than the last one we handled
      if (event.data.timestamp && event.data.timestamp > lastHandledTimestampRef.current) {
        lastHandledTimestampRef.current = event.data.timestamp;
        console.log('Received new positions data notification:', event.data);
        stablePositionHandler(event.data);
      } else {
        console.log('Skipping duplicate/old position data message');
      }
    }
  }).current;
  
  // Register for navigator.serviceWorker.message events (from active service worker)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker API not supported in this browser');
      return;
    }
    
    const setup = async () => {
      try {
        // Check if service worker is active
        const registration = await navigator.serviceWorker.ready;
        setIsConnected(!!registration.active);
        
        if (!listenerAddedRef.current) {
          // Add message listener to the navigator.serviceWorker
          navigator.serviceWorker.addEventListener('message', stableMessageHandler);
          listenerAddedRef.current = true;
          console.log('Service worker message listener added');
          
          // Immediately check for updates when we connect
          checkForUpdates(stableMessageHandler);
        }
      } catch (error) {
        console.error('Error setting up service worker message listener:', error);
      }
    };
    
    setup();
    
    // Clean up listener ONLY on component unmount
    return () => {
      if ('serviceWorker' in navigator && listenerAddedRef.current) {
        navigator.serviceWorker.removeEventListener('message', stableMessageHandler);
        listenerAddedRef.current = false;
        console.log('Service worker message listener removed (component unmounted)');
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Also set up a visibility change listener to check for updates when the tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[SW] Tab became visible, checking for updates');
        checkForUpdates(stableMessageHandler);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stableMessageHandler]);
  
  return {
    lastMessage,
    isConnected,
    forceCheck: () => checkForUpdates(stableMessageHandler)
  };
}; 