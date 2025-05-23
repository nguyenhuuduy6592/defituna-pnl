import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const PriceContext = createContext();

export function PriceProvider({ children }) {
  const [solPrice, setSolPrice] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateSolPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/price/sol');
      const data = await response.json();
      
      if (response.ok && data.price) {
        setSolPrice(data.price);
        setLastUpdate(data.timestamp);
      } else {
        throw new Error(data.error || 'Failed to fetch SOL price from context');
      }
    } catch (err) {
      console.error('[PriceContext] Failed to update SOL price:', err);
    }
    setIsLoading(false);
  }, []);

  // Optionally, fetch price on initial load or set up an interval
  // For now, we'll let the page trigger it after PnL load as per previous logic

  return (
    <PriceContext.Provider value={{ solPrice, lastUpdate, updateSolPrice, isLoading, error }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePriceContext() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePriceContext must be used within a PriceProvider');
  }
  return context;
} 