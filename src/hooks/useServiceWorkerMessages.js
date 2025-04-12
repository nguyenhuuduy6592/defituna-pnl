import { useState, useEffect, useCallback, useRef } from 'react';
import { postMessageToSW } from '@/utils/serviceWorkerUtils'; // Import the utility

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
  
  useEffect(() => {
    callbackRef.current = onNewPositionsData;
  }, [onNewPositionsData]);
  
  const stableMessageHandler = useRef((event) => {
    console.log('[SW Message]', event.data);
    setLastMessage(event.data);
    
    if (!event.data || !event.data.type) return;

    switch (event.data.type) {
      case 'NEW_POSITIONS_DATA':
        if (event.data.timestamp && event.data.timestamp > lastHandledTimestampRef.current) {
          lastHandledTimestampRef.current = event.data.timestamp;
          console.log('Received new positions data notification:', event.data);
          if (typeof callbackRef.current === 'function') {
            callbackRef.current(event.data);
          } 
        } else {
          console.log('Skipping duplicate/old position data message');
        }
        break;

      default:
        console.log('[UI] Received unhandled message type from SW:', event.data.type);
        break;
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
  }, [stableMessageHandler]);
  
  // Also set up a visibility change listener to check for updates when the tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[SW] Tab became visible, checking for updates');
        if (typeof callbackRef.current === 'function') {
          checkForUpdates(callbackRef.current);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return {
    lastMessage,
    isConnected,
    forceCheck: () => {
       if (typeof callbackRef.current === 'function') {
           checkForUpdates(callbackRef.current);
       }
    }
  };
}; 