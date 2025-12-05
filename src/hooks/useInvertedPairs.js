import { useState, useEffect, useCallback } from 'react';

export const useInvertedPairs = () => {
  const [invertedPairs, setInvertedPairs] = useState(new Set());

  useEffect(() => {
    const savedInvertedPairs = localStorage.getItem('invertedPairs');
    if (savedInvertedPairs) {
      setInvertedPairs(new Set(JSON.parse(savedInvertedPairs)));
    }
  }, []);

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
