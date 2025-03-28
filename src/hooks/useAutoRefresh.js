import { useState, useEffect, useRef, useCallback } from 'react';

export const useAutoRefresh = (onRefresh, initialInterval = 30) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [refreshCountdown, setRefreshCountdown] = useState(initialInterval);
  const isVisibleRef = useRef(true);

  // Load saved settings
  useEffect(() => {
    setAutoRefresh(localStorage.getItem('autoRefresh') === 'true');
    const savedInterval = Number(localStorage.getItem('refreshInterval'));
    if (savedInterval) {
      setRefreshInterval(savedInterval);
      setRefreshCountdown(savedInterval);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('autoRefresh', autoRefresh);
    localStorage.setItem('refreshInterval', refreshInterval);
  }, [autoRefresh, refreshInterval]);

  // Handle visibility changes
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = document.visibilityState === 'visible';
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Reset countdown when interval changes or auto-refresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      setRefreshCountdown(refreshInterval);
    }
  }, [refreshInterval, autoRefresh]);

  // Handle countdown and refresh
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const countdownTick = () => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Only refresh if tab is visible
          if (isVisibleRef.current && onRefresh) {
            onRefresh();
          }
          return refreshInterval;
        }
        return prev - 1;
      });
    };

    const timer = setInterval(countdownTick, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, onRefresh]);

  return {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown
  };
};