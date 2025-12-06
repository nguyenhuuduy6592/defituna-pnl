import { useState, useEffect, useCallback } from 'react';

export const useInvertedPairs = () => {
  const [invertedPairs, setInvertedPairs] = useState(() => {
    // Initialize state with value from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedInvertedPairs = localStorage.getItem('invertedPairs');
        if (savedInvertedPairs) {
          return new Set(JSON.parse(savedInvertedPairs));
        }
      } catch (error) {
        console.error('Error reading invertedPairs from localStorage:', error);
      }
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(
      'invertedPairs',
      JSON.stringify(Array.from(invertedPairs))
    );
  }, [invertedPairs]);

  const handlePairInversion = useCallback((pair) => {
    setInvertedPairs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pair)) {
        newSet.delete(pair);
      } else {
        newSet.add(pair);
      }
      return newSet;
    });
  }, []);

  const isInverted = useCallback(
    (pair) => invertedPairs.has(pair),
    [invertedPairs]
  );

  return {
    invertedPairs,
    handlePairInversion,
    isInverted,
  };
};
