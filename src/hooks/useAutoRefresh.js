import { useState, useEffect } from 'react';

export const useAutoRefresh = (onRefresh, initialInterval = 30) => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [refreshCountdown, setRefreshCountdown] = useState(initialInterval);

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
    let timer;

    if (autoRefresh) {
      timer = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) {
            // Schedule refresh for next tick to avoid state update conflicts
            setTimeout(() => {
              onRefresh();
              setRefreshCountdown(refreshInterval);
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [autoRefresh, refreshInterval, onRefresh]);

  return {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown
  };
};