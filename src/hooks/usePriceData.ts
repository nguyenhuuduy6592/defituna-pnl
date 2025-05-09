import { useState, useEffect, useCallback } from 'react';
import { PriceData } from '@/utils/api/lending';

// In-memory cache
const priceDataCache = new Map<string, PriceData>();
const lastFetchTimes = new Map<string, number>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes in milliseconds

interface PriceDataState {
  priceData: PriceData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePriceData(mint: string): PriceDataState {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = priceDataCache.get(mint);
        const lastFetch = lastFetchTimes.get(mint);
        
        if (cached && lastFetch && Date.now() - lastFetch < CACHE_TTL) {
          setPriceData(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const response = await fetch(`/api/lending/price-data/${mint}`);
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }

      const data = await response.json();

      // Update cache
      priceDataCache.set(mint, data);
      lastFetchTimes.set(mint, Date.now());

      setPriceData(data);
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price data');
      setPriceData(null);
    } finally {
      setLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    if (mint) {
      fetchPriceData();

      // Refresh price data every 2 minutes
      const intervalId = setInterval(() => {
        fetchPriceData();
      }, CACHE_TTL);

      return () => clearInterval(intervalId);
    }
  }, [mint, fetchPriceData]);

  const refresh = useCallback(() => {
    return fetchPriceData(true);
  }, [fetchPriceData]);

  return {
    priceData,
    loading,
    error,
    refresh
  };
}

// Utility functions for price calculations
export function calculateUsdValue(amount: string, priceData: PriceData): number {
  const value = parseFloat(amount);
  const price = priceData.price;
  const decimals = priceData.decimals;
  return (value * price) / Math.pow(10, decimals);
}

export function calculateApy(
  depositRate: number,
  borrowRate: number,
  utilization: number
): { supplyApy: number; borrowApy: number } {
  // Simple APY calculation based on rates and utilization
  const supplyApy = depositRate * utilization;
  const borrowApy = borrowRate;
  
  return {
    supplyApy,
    borrowApy
  };
} 