import { useState, useEffect, useCallback } from 'react';
import { TokenInfo } from '@/utils/api/lending';

// In-memory cache
const tokenMetadataCache = new Map<string, TokenInfo>();
const lastFetchTimes = new Map<string, number>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

interface TokenMetadataState {
  metadata: TokenInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTokenMetadata(mint: string): TokenMetadataState {
  const [metadata, setMetadata] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = tokenMetadataCache.get(mint);
        const lastFetch = lastFetchTimes.get(mint);
        
        if (cached && lastFetch && Date.now() - lastFetch < CACHE_TTL) {
          setMetadata(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const response = await fetch(`/api/lending/token-info/${mint}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token metadata');
      }

      const data = await response.json();

      // Update cache
      tokenMetadataCache.set(mint, data);
      lastFetchTimes.set(mint, Date.now());

      setMetadata(data);
    } catch (err) {
      console.error('Error fetching token metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token metadata');
      
      // Use fallback for unknown tokens
      const fallback: TokenInfo = {
        mint,
        symbol: mint.slice(0, 4) + '...' + mint.slice(-4),
        logo: '/images/unknown-token.png',
        decimals: 9
      };
      setMetadata(fallback);
    } finally {
      setLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    if (mint) {
      fetchMetadata();
    }
  }, [mint, fetchMetadata]);

  const refresh = useCallback(() => {
    return fetchMetadata(true);
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refresh
  };
} 