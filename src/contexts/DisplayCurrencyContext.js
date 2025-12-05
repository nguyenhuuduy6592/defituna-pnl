import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DisplayCurrencyContext = createContext();

// Key for localStorage
const LOCAL_STORAGE_KEY = 'defituna-pnl-showInSol';

export function DisplayCurrencyProvider({ children }) {
  // Initialize with a default value, will be updated by useEffect on client-side
  const [showInSol, setShowInSol] = useState(false);

  // Effect to load preference from localStorage on initial client-side render
  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedValue !== null) {
          setShowInSol(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        // Optionally set to default if error occurs
        // setShowInSol(false);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save to localStorage whenever showInSol changes
  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(showInSol));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [showInSol]);

  const toggleCurrency = useCallback(() => {
    setShowInSol(prevShowInSol => !prevShowInSol);
  }, []);

  const value = {
    showInSol,
    toggleCurrency,
    // Derived value for convenience, can be 'USD' or 'SOL'
    currentCurrency: showInSol ? 'TOKENS' : 'USD',
  };

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const context = useContext(DisplayCurrencyContext);
  if (!context) {
    throw new Error('useDisplayCurrency must be used within a DisplayCurrencyProvider');
  }
  return context;
}