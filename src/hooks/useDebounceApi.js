import { useCallback, useState, useRef, useEffect } from 'react';
import { debouncePromise } from '@/utils/debounce';

/**
 * Custom hook for debounced API calls.
 * This hook creates a debounced version of the provided API call function and
 * manages the loading and error states automatically.
 * 
 * @param {Function} apiCall - The API call function to debounce
 * @param {number} delay - The debounce delay in milliseconds (default: 500ms)
 * @param {any} initialData - Initial data to use before the first API call (default: null)
 * @returns {Object} - An object containing:
 *   - data: the result of the API call
 *   - loading: boolean indicating if a request is in progress
 *   - error: error object if the request failed
 *   - execute: function to execute the debounced API call
 *   - reset: function to reset the data, loading and error states
 */
export function useDebounceApi(apiCall, delay = 500, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Keep track of the latest call to avoid race conditions
  const latestCallIdRef = useRef(0);
  
  // Create a debounced version of the API call
  const debouncedApiCall = useRef(
    debouncePromise(async (...args) => {
      const callId = ++latestCallIdRef.current;
      try {
        const result = await apiCall(...args);
        // Only update state if this is the latest call
        if (callId === latestCallIdRef.current) {
          setData(result);
          setError(null);
        }
        return result;
      } catch (err) {
        // Only update state if this is the latest call
        if (callId === latestCallIdRef.current) {
          setError(err);
        }
        throw err;
      } finally {
        // Only update loading state if this is the latest call
        if (callId === latestCallIdRef.current) {
          setLoading(false);
        }
      }
    }, delay)
  ).current;
  
  // Execute function that can be called from components
  const execute = useCallback(async (...args) => {
    setLoading(true);
    try {
      return await debouncedApiCall(...args);
    } catch (err) {
      return Promise.reject(err);
    }
  }, [debouncedApiCall]);
  
  // Reset function to clear states
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    latestCallIdRef.current++;
  }, [initialData]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      latestCallIdRef.current++;
    };
  }, []);
  
  return { data, loading, error, execute, reset };
}

/**
 * Hook that creates a debounced wrapper for any function, particularly useful for form inputs
 * that trigger API calls when value changes.
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function useDebounce(fn, delay = 300) {
  return useCallback(
    debouncePromise(fn, delay),
    [fn, delay]
  );
} 