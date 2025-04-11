import { useState, useEffect, useCallback } from 'react';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

export const useInvertedPairs = () => {
  const [invertedPairs, setInvertedPairs] = useState(new Set());

  useEffect(() => {
    const loadInvertedPairs = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }

        const savedData = await getData(db, STORE_NAMES.SETTINGS, 'invertedPairs');
        if (savedData?.value) {
          setInvertedPairs(new Set(savedData.value));
        }
      } catch (error) {
        console.error('Error loading inverted pairs:', error);
      }
    };

    loadInvertedPairs();
  }, []);

  useEffect(() => {
    const saveInvertedPairs = async () => {
      try {
        const db = await initializeDB();
        if (!db) {
          throw new Error('Failed to initialize IndexedDB');
        }

        await saveData(db, STORE_NAMES.SETTINGS, {
          key: 'invertedPairs',
          value: Array.from(invertedPairs)
        });
      } catch (error) {
        console.error('Error saving inverted pairs:', error);
      }
    };

    saveInvertedPairs();
  }, [invertedPairs]);

  const handlePairInversion = useCallback((pair) => {
    setInvertedPairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pair)) {
        newSet.delete(pair);
      } else {
        newSet.add(pair);
      }
      return newSet;
    });
  }, []);

  const isInverted = useCallback((pair) => invertedPairs.has(pair), [invertedPairs]);

  return {
    invertedPairs,
    handlePairInversion,
    isInverted
  };
}; 