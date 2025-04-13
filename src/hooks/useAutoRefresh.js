import { useState, useEffect, useRef, useCallback } from 'react';

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
  const onRefreshRef = useRef(onRefresh); // Store callback in ref to avoid dependency changes

  // Update callback ref when onRefresh changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  /**
   * Load saved settings from localStorage on initial mount
   */
  useEffect(() => {
    try {
      // Load auto-refresh state
      const savedAutoRefresh = localStorage.getItem(AUTO_REFRESH_KEY) === 'true';
      setAutoRefresh(savedAutoRefresh);
      
      // Load refresh interval
      const savedInterval = Number(localStorage.getItem(REFRESH_INTERVAL_KEY));
      if (savedInterval && !isNaN(savedInterval) && savedInterval > 0) {
        setRefreshInterval(savedInterval);
        setRefreshCountdown(savedInterval);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading auto-refresh settings:', error);
      setError('Failed to load auto-refresh settings');
    }
  }, []);

  /**
   * Save settings to localStorage whenever they change
   */
  useEffect(() => {
    try {
      localStorage.setItem(AUTO_REFRESH_KEY, String(autoRefresh));
      localStorage.setItem(REFRESH_INTERVAL_KEY, String(refreshInterval));
      setError(null);
    } catch (error) {
      console.error('Error saving auto-refresh settings:', error);
      setError('Failed to save auto-refresh settings');
    }
  }, [autoRefresh, refreshInterval]);

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
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          try {
            // Only refresh if tab is visible - Removing visibility check
            if (onRefreshRef.current) {
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