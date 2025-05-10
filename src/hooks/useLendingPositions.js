import { useState, useEffect, useCallback } from 'react';
import { useDebounceApi } from './useDebounceApi';

/**
 * Function to fetch lending positions for a specific wallet
 * @param {string} walletAddress - The wallet address to fetch lending positions for
 * @returns {Promise<Object>} - Object containing lending positions or error
 */
const fetchWalletLendingPositions = async (walletAddress) => {
  if (!walletAddress) return null;
  
  try {
    const res = await fetch(`/api/lending/positions/${walletAddress}`);
    if (!res.ok) {
      const errorData = await res.json();
      console.error(`Error fetching lending positions for ${walletAddress}:`, errorData);
      throw new Error(errorData.error || `Failed to fetch lending positions for ${walletAddress}`);
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Caught error fetching lending positions for ${walletAddress}:`, err);
    return { error: err.message || 'Unknown error fetching lending positions data' };
  }
};

/**
 * Custom hook that manages lending positions data for multiple wallets
 * @param {Array<string>} activeWallets - Array of active wallet addresses to fetch data for
 * @returns {Object} Object containing lending positions data and state
 */
export const useLendingPositions = (activeWallets) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lendingData, setLendingData] = useState(null);
  const [vaultDetailsCache, setVaultDetailsCache] = useState({});
  const [mintDetailsCache, setMintDetailsCache] = useState({});
  
  // Create a debounced version of the fetch function
  const { execute: debouncedFetchLendingPositions } = useDebounceApi(fetchWalletLendingPositions, 500);
  
  // Function to aggregate lending data from multiple wallets
  const aggregateLendingData = useCallback((walletsData) => {
    const validData = walletsData.filter(d => d && !d.error);
    if (validData.length === 0) return null;
    
    // Combine positions from all wallets
    const allPositions = validData.flatMap(d => (d.data || []).map(pos => ({
      ...pos,
      wallet: pos.authority || pos.wallet // Ensure wallet info is preserved
    })));
    
    return {
      positions: allPositions,
      walletCount: validData.length
    };
  }, []);
  
  // Function to fetch lending positions for specified wallets
  const fetchLendingData = useCallback(async (walletsToFetch, isSubmission = false) => {
    if (!walletsToFetch || walletsToFetch.length === 0) {
      setLendingData(null);
      setErrorMessage('');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Use either direct or debounced function based on submission state
      const fetchFunc = isSubmission ? fetchWalletLendingPositions : debouncedFetchLendingPositions;
      
      const results = await Promise.all(
        walletsToFetch.map(address => fetchFunc(address))
      );
      
      const fetchErrors = results.filter(r => r && r.error).map(r => r.error);
      let combined = null;
      
      if (fetchErrors.length > 0) {
        setErrorMessage(`Failed to fetch lending positions for ${fetchErrors.length} wallet(s). Please wait for next refresh.`);
        combined = aggregateLendingData(results);
        if (!combined) {
          setLendingData(null);
        }
      } else {
        setErrorMessage('');
        combined = aggregateLendingData(results);
      }
      
      if (combined) {
        setLendingData(combined);
      } else if (fetchErrors.length === 0) {
        setErrorMessage('No lending positions found for the provided wallet(s).');
      }
    } catch (err) {
      console.error('Error in fetchLendingData:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while fetching lending data.');
      setLendingData(null);
    } finally {
      setLoading(false);
    }
  }, [aggregateLendingData, debouncedFetchLendingPositions]);
  
  // Fetch data when active wallets change
  useEffect(() => {
    if (activeWallets.length > 0) {
      fetchLendingData(activeWallets, false);
    } else {
      setLendingData(null);
      setErrorMessage('');
    }
  }, [JSON.stringify(activeWallets), fetchLendingData]);
  
  // Get vault details for a specific vault address, with caching
  const getVaultDetails = useCallback(async (vaultAddress) => {
    if (!vaultAddress) return null;
    if (vaultDetailsCache[vaultAddress]) return vaultDetailsCache[vaultAddress];
    
    try {
      const res = await fetch(`/api/lending/vaults/${vaultAddress}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch vault details: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data && data.data) {
        setVaultDetailsCache(prevCache => ({...prevCache, [vaultAddress]: data.data }));
        return data.data;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching vault details for ${vaultAddress}:`, err);
      return null;
    }
  }, [vaultDetailsCache]);
  
  // Get mint details for a specific mint address, with caching
  const getMintDetails = useCallback(async (mintAddress) => {
    if (!mintAddress) return null;
    if (mintDetailsCache[mintAddress]) return mintDetailsCache[mintAddress];
    
    try {
      const res = await fetch(`/api/mints/${mintAddress}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch mint details: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data && data.data) {
        setMintDetailsCache(prevCache => ({...prevCache, [mintAddress]: data.data }));
        return data.data;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching mint details for ${mintAddress}:`, err);
      return null;
    }
  }, [mintDetailsCache]);
  
  return {
    lendingData,
    loading,
    errorMessage,
    fetchLendingData,
    getVaultDetails,
    getMintDetails,
    vaultDetails: vaultDetailsCache,
    mintDetails: mintDetailsCache
  };
}; 