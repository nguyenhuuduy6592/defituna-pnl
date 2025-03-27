import { useState, useEffect, useRef } from 'react';

export const useAutoRefresh = (onRefresh, initialInterval = 30) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [refreshCountdown, setRefreshCountdown] = useState(initialInterval);
  const refreshTimeoutId = useRef(null);

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

  // Reset countdown when interval changes or auto-refresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      setRefreshCountdown(refreshInterval);
    }
  }, [refreshInterval, autoRefresh]);

  // Handle countdown and refresh
  useEffect(() => {
    if (!autoRefresh) {
      if (refreshTimeoutId.current) {
        clearTimeout(refreshTimeoutId.current);
      }
      return;
    }

    const countdownTick = () => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Only refresh if tab is visible
          if (document.visibilityState === 'visible' && onRefresh) {
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