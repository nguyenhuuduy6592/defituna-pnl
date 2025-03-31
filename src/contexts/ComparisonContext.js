import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Maximum number of pools that can be compared
const MAX_COMPARISON_POOLS = 3;

// Create the context
const ComparisonContext = createContext(null);

/**
 * Provider component for managing pools selected for comparison
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
export function ComparisonProvider({ children }) {
  // State for selected pools
  const [comparisonPools, setComparisonPools] = useState([]);
  
  // Load saved comparison pools from localStorage on mount
  useEffect(() => {
    try {
      const savedPools = localStorage.getItem('comparisonPools');
      if (savedPools) {
        setComparisonPools(JSON.parse(savedPools));
      }
    } catch (error) {
      console.error('Error loading saved comparison pools:', error);
    }
  }, []);
  
  // Save comparison pools to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('comparisonPools', JSON.stringify(comparisonPools));
    } catch (error) {
      console.error('Error saving comparison pools:', error);
    }
  }, [comparisonPools]);

  // Add a pool to comparison
  const addPoolToComparison = useCallback((pool) => {
    setComparisonPools(prev => {
      // Check if pool is already in comparison
      if (prev.some(p => p.address === pool.address)) {
        return prev;
      }
      
      // Limit to MAX_COMPARISON_POOLS
      if (prev.length >= MAX_COMPARISON_POOLS) {
        return [...prev.slice(1), pool];
      }
      
      return [...prev, pool];
    });
  }, []);

  // Remove a pool from comparison
  const removePoolFromComparison = useCallback((poolAddress) => {
    setComparisonPools(prev => 
      prev.filter(pool => pool.address !== poolAddress)
    );
  }, []);

  // Clear all pools from comparison
  const clearComparison = useCallback(() => {
    setComparisonPools([]);
  }, []);

  // Check if a pool is in comparison
  const isInComparison = useCallback((poolAddress) => {
    return comparisonPools.some(pool => pool.address === poolAddress);
  }, [comparisonPools]);

  // Context value
  const value = {
    comparisonPools,
    addPoolToComparison,
    removePoolFromComparison,
    clearComparison,
    isInComparison,
    maxPools: MAX_COMPARISON_POOLS
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

/**
 * Hook to use the comparison context
 * @returns {Object} Comparison context value
 */
export function useComparison() {
  const context = useContext(ComparisonContext);
  
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  
  return context;
} 