import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for calculating position ages based on timestamps
 * @param {Array} positions Array of position objects
 * @param {Object} positionTimestamps Object with position addresses as keys and timestamps as values
 * @returns {Array} Positions with age property added
 */
export const usePositionAges = (positions = [], positionTimestamps = {}) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Ensure positions is an array
  const safePositions = Array.isArray(positions) ? positions : [];
  
  // Ensure positionTimestamps is an object
  const safeTimestamps = positionTimestamps && typeof positionTimestamps === 'object' 
    ? positionTimestamps 
    : {};

  // Update current time every second for live age calculation
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Merge ages into positions, calculating duration on the fly
  const positionsWithAge = useMemo(() => {
    if (safePositions.length === 0) return [];
    
    const nowSeconds = Math.floor(currentTime / 1000);
    
    return safePositions.map(pos => {
      if (!pos) return { age: null };
      
      const positionAddress = pos.positionAddress;
      const creationTimestamp = positionAddress ? safeTimestamps[positionAddress] : null;
      let ageSeconds = null; 
      
      if (typeof creationTimestamp === 'number' && creationTimestamp > 0) {
        ageSeconds = nowSeconds - creationTimestamp;
      }
      
      return {
        ...pos,
        age: ageSeconds // Pass calculated duration (or null)
      };
    });
  }, [safePositions, safeTimestamps, currentTime]);

  return positionsWithAge;
}; 