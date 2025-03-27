import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useCountdown } from '../hooks/useCountdown';
import { usePositionAlerts } from '../hooks/usePositionAlerts';
import WalletForm from '../components/pnl/WalletForm';
import { AutoRefresh } from '../components/pnl/AutoRefresh';
import { PnLDisplay } from '../components/pnl/PnLDisplay';

export async function getServerSideProps() {
  return { props: { data: null } };
}

export default ({ data: initData }) => {
  const [data, setData] = useState(initData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { countdown: fetchCooldown, startCountdown: startFetchCooldown } = useCountdown(0);
  const [aggregatedData, setAggregatedData] = useState(null);

  const {
    wallet,
    setWallet,
    activeWallets,
    toggleWalletActive,
    savedWallets,
    showDropdown,
    setShowDropdown,
    addWallet,
    removeWallet,
    clearWallets
  } = useWallet();

  // Function to fetch PnL data for a specific wallet
  const fetchWalletPnL = useCallback(async (walletAddress) => {
    if (!walletAddress) return null;
    
    try {
      const res = await fetch('/api/fetch-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch');
      }
      
      return await res.json();
    } catch (err) {
      console.error(`Error fetching data for wallet ${walletAddress}:`, err.message);
      return null;
    }
  }, []);

  // Aggregate PnL data from multiple wallets
  const aggregatePnLData = useCallback((walletsData) => {
    // Remove null entries (failed fetches)
    const validData = walletsData.filter(d => d !== null);
    
    if (validData.length === 0) return null;
    
    // Use the first wallet's solPrice (they should all be the same)
    const solPrice = validData[0].solPrice;
    
    // Combine all positions from different wallets
    const allPositions = validData.flatMap(d => 
      // Add wallet address to each position for reference
      d.positions.map(pos => ({
        ...pos,
        walletAddress: d.walletAddress
      }))
    );
    
    // Calculate total PnL across all wallets
    const totalPnL = validData.reduce((sum, d) => sum + d.totalPnL, 0);
    
    return {
      totalPnL,
      positions: allPositions,
      solPrice,
      walletCount: validData.length
    };
  }, []);

  // Function to fetch PnL for all active wallets
  const fetchPnLData = useCallback(async (isAutoRefresh = false) => {
    // Check if there are active wallets
    if (activeWallets.length === 0 && wallet) {
      // Support legacy behavior with single wallet
      toggleWalletActive(wallet);
    }
    
    // If still no active wallets, don't fetch
    if (activeWallets.length === 0 && !wallet) return;
    
    // Determine which wallets to fetch
    const walletsToFetch = activeWallets.length > 0 ? activeWallets : [wallet];
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data for each wallet in parallel
      const results = await Promise.all(
        walletsToFetch.map(async (address) => {
          const walletData = await fetchWalletPnL(address);
          return walletData ? { ...walletData, walletAddress: address } : null;
        })
      );
      
      // Process results
      const successfulResults = results.filter(r => r !== null);
      const failedCount = results.length - successfulResults.length;
      
      if (successfulResults.length === 0) {
        throw new Error('Failed to fetch data for all wallets');
      }
      
      if (failedCount > 0) {
        console.warn(`Failed to fetch data for ${failedCount} wallet(s)`);
      }
      
      // For backward compatibility, set data to the primary wallet's data
      const primaryWalletData = results.find(r => r?.walletAddress === wallet) || successfulResults[0];
      setData(primaryWalletData);
      
      // Aggregate data from all wallets
      const combined = aggregatePnLData(successfulResults);
      setAggregatedData(combined);
      
      if (!isAutoRefresh) {
        startFetchCooldown(30);
        // Add wallet to saved wallets if it's not there already
        if (wallet) {
          addWallet(wallet);
        }
      }
    } catch (err) {
      setError(isAutoRefresh ? `Auto-refresh error: ${err.message}` : err.message);
      setAggregatedData(null);
    } finally {
      setLoading(false);
    }
  }, [activeWallets, wallet, fetchWalletPnL, aggregatePnLData, toggleWalletActive, addWallet, startFetchCooldown]);

  const {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown
  } = useAutoRefresh(
    useCallback(() => fetchPnLData(true), [fetchPnLData])
  );

  const {
    alerts,
    settings: alertSettings,
    updateSettings: updateAlertSettings,
    clearAlerts
  } = usePositionAlerts(aggregatedData?.positions || data?.positions, aggregatedData?.solPrice || data?.solPrice);

  // Auto fetch data if there are active wallets on page load
  useEffect(() => {
    if ((activeWallets.length > 0 || wallet) && !data && !aggregatedData) {
      fetchPnLData(false);
    }
  }, [activeWallets, wallet, data, aggregatedData, fetchPnLData]);

  const handleSubmit = async e => {
    e.preventDefault();
    setData(null);
    setAggregatedData(null);
    await fetchPnLData(false);
  };

  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value);
    setRefreshInterval(newInterval);
  };

  return (
    <div className="container">
      <title>Wallet PnL Viewer</title>
      <h1>Wallet PnL Viewer</h1>
      
      <WalletForm
        wallet={wallet}
        onWalletChange={setWallet}
        activeWallets={activeWallets}
        toggleWalletActive={toggleWalletActive}
        onSubmit={handleSubmit}
        loading={loading}
        countdown={fetchCooldown}
        savedWallets={savedWallets}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        onRemoveWallet={removeWallet}
        onClearWallets={clearWallets}
      />
      
      {(data || aggregatedData) && (
        <>
          <AutoRefresh
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            refreshInterval={refreshInterval}
            onIntervalChange={handleIntervalChange}
            autoRefreshCountdown={refreshCountdown}
            loading={loading}
          />
          
        </>
      )}
      
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      
      {/* Display aggregated data if available, otherwise fall back to single wallet data */}
      {aggregatedData && <PnLDisplay data={aggregatedData} isAggregated={true} />}
      {!aggregatedData && data && <PnLDisplay data={data} isAggregated={false} />}
    </div>
  );
};