import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that provides a countdown timer functionality
 * Creates a timer that counts down from a given value to zero
 *
 * @param {number} initialValue - Initial countdown value in seconds
 * @returns {Object} Countdown state and controls
 * @returns {number} returns.countdown - Current countdown value in seconds
 * @returns {Function} returns.startCountdown - Function to start a new countdown
 * @returns {Function} returns.stopCountdown - Function to stop the current countdown
 * @returns {Function} returns.resetCountdown - Function to reset countdown to zero
 */
export const useCountdown = (initialValue = 0) => {
  const [countdown, setCountdown] = useState(Math.max(0, initialValue));
  const [isRunning, setIsRunning] = useState(initialValue > 0);

  // Countdown timer effect
  useEffect(() => {
    let timerId;

    if (isRunning && countdown > 0) {
      timerId = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            setIsRunning(false);
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (timerId) {clearInterval(timerId);}
    };
  }, [countdown, isRunning]);

  /**
   * Start a new countdown with the specified number of seconds
   * @param {number} seconds - Number of seconds to count down from
   */
  const startCountdown = useCallback((seconds) => {
    const validSeconds = parseInt(seconds, 10);

    if (isNaN(validSeconds) || validSeconds <= 0) {
      console.warn('Invalid countdown value provided, must be a positive number');
      return;
    }

    setCountdown(validSeconds);
    setIsRunning(true);
  }, []);

  /**
   * Stop the current countdown without resetting the value
   */
  const stopCountdown = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * Reset the countdown to zero and stop it
   */
  const resetCountdown = useCallback(() => {
    setCountdown(0);
    setIsRunning(false);
  }, []);

  return {
    countdown,
    startCountdown,
    stopCountdown,
    resetCountdown,
    isRunning,
  };
};