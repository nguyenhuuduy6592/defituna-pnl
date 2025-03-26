import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useCountdown } from '../hooks/useCountdown';
import { WalletForm } from '../components/pnl/WalletForm';
import { AutoRefresh } from '../components/pnl/AutoRefresh';
import { PnLDisplay } from '../components/pnl/PnLDisplay';

export async function getServerSideProps() {
  return { props: { data: null } };
}

export default ({ data: initData }) => {
  const [data, setData] = useState(initData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSol, setIsSol] = useState(true);
  const { countdown: fetchCooldown, startCountdown: startFetchCooldown } = useCountdown(0);

  const {
    wallet,
    setWallet,
    savedWallets,
    showDropdown,
    setShowDropdown,
    addWallet,
    removeWallet,
    clearWallets
  } = useWallet();

  const fetchPnLData = useCallback(async (walletAddress, isAutoRefresh = false) => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/fetch-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch');
      const newData = await res.json();
      setData(newData);
      setError(null);
      
      if (!isAutoRefresh) {
        startFetchCooldown(15);
        addWallet(walletAddress);
      }
    } catch (err) {
      setError(isAutoRefresh ? `Auto-refresh error: ${err.message}` : err.message);
    } finally {
      setLoading(false);
    }
  }, [addWallet, startFetchCooldown]);

  const {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown
  } = useAutoRefresh(
    useCallback(() => fetchPnLData(wallet, true), [fetchPnLData, wallet])
  );

  useEffect(() => {
    setIsSol(localStorage.getItem('currency') !== 'usd');
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem('currency', isSol ? 'sol' : 'usd');
  }, [isSol, data]);

  // Auto fetch data if there's a wallet on page load
  useEffect(() => {
    if (wallet && !data) {
      fetchPnLData(wallet, false);
    }
  }, [wallet, data, fetchPnLData]);

  const handleSubmit = async e => {
    e.preventDefault();
    setData(null);
    await fetchPnLData(wallet, false);
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
        onSubmit={handleSubmit}
        loading={loading}
        countdown={fetchCooldown}
        savedWallets={savedWallets}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        onRemoveWallet={removeWallet}
        onClearWallets={clearWallets}
      />
      
      {data && (
        <AutoRefresh
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          refreshInterval={refreshInterval}
          onIntervalChange={handleIntervalChange}
          autoRefreshCountdown={refreshCountdown}
          loading={loading}
        />
      )}
      
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {data && <PnLDisplay data={data} isSol={isSol} setIsSol={setIsSol} />}
    </div>
  );
};