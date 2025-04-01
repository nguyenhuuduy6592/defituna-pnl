import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for calculating position ages based on opened_at field from API
 * @param {Array} positions Array of position objects
 * @returns {Array} Positions with age property added
 */
export const usePositionAges = (positions = []) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Ensure positions is an array
  const safePositions = Array.isArray(positions) ? positions : [];

  // Update current time every second for live age calculation
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Add ages to positions, calculating duration on the fly from opened_at
  const positionsWithAge = useMemo(() => {
    if (safePositions.length === 0) return [];
    
    const nowSeconds = Math.floor(currentTime / 1000);
    
    return safePositions.map(pos => {
      if (!pos) return { age: null };
      
      let ageSeconds = null; 
      
      // Use opened_at from the API
      if (pos.opened_at) {
        try {
          // opened_at is in ISO format, convert to timestamp
          const openedAtTimestamp = new Date(pos.opened_at).getTime() / 1000;
          if (!isNaN(openedAtTimestamp)) {
            ageSeconds = nowSeconds - openedAtTimestamp;
          }
        } catch (e) {
          console.warn('Error parsing opened_at date:', e);
        }
      }
      
      return {
        ...pos,
        age: ageSeconds // Pass calculated duration (or null)
      };
    });
  }, [safePositions, currentTime]);

  return positionsWithAge;
}; 