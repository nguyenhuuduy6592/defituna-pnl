import { useState, useEffect } from 'react';

export const useCountdown = (initialValue = 0) => {
  const [countdown, setCountdown] = useState(initialValue);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const startCountdown = (seconds) => {
    setCountdown(seconds);
  };

  return {
    countdown,
    startCountdown,
    setCountdown
  };
};