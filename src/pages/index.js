import { useState, useEffect, useCallback } from 'react';
import { BsInfoCircle } from 'react-icons/bs';
import { FiAlertTriangle } from 'react-icons/fi';
import { Tooltip } from '../components/common/Tooltip';
import { DisclaimerModal } from '../components/common/DisclaimerModal';
import { 
  useWallet, 
  useAutoRefresh, 
  useCountdown, 
  useHistoricalData, 
  useDebounceApi 
} from '../hooks';
import { WalletForm } from '../components/pnl/WalletForm';
import { AutoRefresh } from '../components/pnl/AutoRefresh';
import { PnLDisplay } from '../components/pnl/PnLDisplay';
import { 
  addWalletAddressToPositions, 
  decodePositions, 
  decodeValue 
} from '../utils';
import styles from './index.module.scss';
import Link from 'next/link';

export default () => {
  const [loading, setLoading] = useState(false);
  const { countdown: fetchCooldown, startCountdown: startFetchCooldown } = useCountdown(0);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [positionTimestamps, setPositionTimestamps] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [allPositionsHistory, setAllPositionsHistory] = useState([]);

  const {
    wallet,
    setWallet,
    activeWallets,
    setActiveWallets,
    toggleWalletActive,
    savedWallets,
    addWallet,
    removeWallet,
    clearWallets
  } = useWallet();

  const {
    enabled: historyEnabled,
    toggleHistoryEnabled,
    savePositionSnapshot,
    getPositionHistory
  } = useHistoricalData();

  // Check if this is the first visit
  useEffect(() => {
    const disclaimerShown = localStorage.getItem('disclaimerShown');
    if (!disclaimerShown) {
      setDisclaimerOpen(true);
      localStorage.setItem('disclaimerShown', 'true');
    }
  }, []);

  // Base function for fetching PnL data for a single wallet
  const _fetchWalletPnL = useCallback(async (walletAddress) => {
    if (!walletAddress) return null;
    try {
      const res = await fetch('/api/fetch-pnl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error(`Error fetching for ${walletAddress}:`, errorData);
        throw new Error(errorData.error || `Failed to fetch data for ${walletAddress}`);
      }
      
      const data = await res.json();
      
      // Decode the total PnL value (using same USD_MULTIPLIER = 100)
      if (data.t_pnl !== undefined) {
        data.totalPnL = decodeValue(data.t_pnl, 100);
        delete data.t_pnl; // Remove the encoded field
      }
      
      // First decode the numeric encoded values in positions
      if (data && data.positions) {
        data.positions = decodePositions(data.positions);
      }
      
      // Then add the wallet address to each position (was removed from server response)
      if (data && data.positions) {
        data.positions = addWalletAddressToPositions(data.positions, walletAddress);
      }
      
      return data;
    } catch (err) {
      console.error(`Caught error fetching for ${walletAddress}:`, err);
      return { error: err.message || 'Unknown error fetching wallet data' }; 
    }
  }, []);

  // Debounced version for auto-refresh - extract the execute function
  const { execute: debouncedExecuteFetchWalletPnL } = useDebounceApi(_fetchWalletPnL, 500);

  // Aggregate PnL data from multiple wallets, filtering out errors
  const aggregatePnLData = useCallback((walletsData) => {
    const validData = walletsData.filter(d => d && !d.error); 
    if (validData.length === 0) return null;

    const allPositions = validData.flatMap(d => d.positions || []);
    
    const totalPnL = validData.reduce((sum, d) => sum + (d.totalPnL || 0), 0);
    
    return {
      totalPnL,
      positions: allPositions,
      walletCount: validData.length
    };
  }, []);

  // Function to fetch PnL for specified wallets
  const fetchPnLData = useCallback(async (walletsToFetch, isSubmission = false) => {
    if (!walletsToFetch || walletsToFetch.length === 0) {
      setAggregatedData(null);
      setErrorMessage('');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Select the appropriate fetch function
      const fetchFunc = isSubmission ? _fetchWalletPnL : debouncedExecuteFetchWalletPnL;

      const results = await Promise.all(
        walletsToFetch.map(address => fetchFunc(address))
      );

      const fetchErrors = results.filter(r => r && r.error).map(r => r.error);
      let combined = null; // Initialize combined data

      if (fetchErrors.length > 0) {
        // Set error message but don't clear existing data immediately
        setErrorMessage(`Failed to fetch data for ${fetchErrors.length} wallet(s). Please wait for next refresh.`);
        // Attempt to aggregate still, maybe some wallets succeeded
        combined = aggregatePnLData(results);
        if (!combined) {
          // If aggregation fails completely after errors, clear data
          setAggregatedData(null);
        }
      } else {
         // Clear error message on successful fetch/refresh
         setErrorMessage('');
         combined = aggregatePnLData(results);
      }

      if (combined) {
        setAggregatedData(combined);
        
        // --- Fetch Creation Timestamps for NEW positions only --- 
        if (combined.positions && combined.positions.length > 0) {
          const allCurrentPositionAddresses = combined.positions.map(p => p.positionAddress);
          const existingTimestampsKeys = Object.keys(positionTimestamps);
          
          const newPositionAddresses = allCurrentPositionAddresses.filter(
            addr => !existingTimestampsKeys.includes(addr) || !positionTimestamps[addr] // Also fetch if timestamp is falsy (e.g., 0 from previous error)
          );

          if (newPositionAddresses.length > 0) {
            try {
              const tsRes = await fetch('/api/fetch-position-age', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ positionAddresses: newPositionAddresses })
              });
              if (tsRes.ok) {
                const newTimestampsData = await tsRes.json();
                setPositionTimestamps(prevTs => ({
                  ...prevTs, 
                  ...newTimestampsData
                }));
              } else {
                console.error('Failed to fetch new position timestamps:', await tsRes.text());
              }
            } catch (tsErr) {
              console.error('Error fetching new position timestamps:', tsErr);
            }
          }
        }
        // --- End Fetch Creation Timestamps ---

        if (historyEnabled) {
          await savePositionSnapshot(combined.positions);
        }
        if (isSubmission && wallet) {
          addWallet(wallet);
          setWallet('');
          startFetchCooldown(30);
        }
      } else if (fetchErrors.length === 0) { 
        setErrorMessage('No position data found for the provided wallet(s).');
        // Clear timestamps if no positions are found at all?
        setPositionTimestamps({});
      }

    } catch (err) {
      console.error('Error in fetchPnLData:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while fetching data.');
      setAggregatedData(null);
    } finally {
      setLoading(false);
    }
  }, [
    activeWallets, 
    aggregatePnLData, 
    startFetchCooldown, 
    historyEnabled, 
    savePositionSnapshot, 
    _fetchWalletPnL, 
    wallet, 
    addWallet, 
    setWallet, 
    debouncedExecuteFetchWalletPnL,
    positionTimestamps,
    setPositionTimestamps
  ]);

  const {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown
  } = useAutoRefresh(
    useCallback(() => fetchPnLData(activeWallets), [fetchPnLData, activeWallets])
  );

  // Auto fetch data if there are active wallets on page load
  useEffect(() => {
    // Initial load logic: Fetch only if wallets are active, no data yet, not already loading, and no error shown
    if (activeWallets.length > 0 && !aggregatedData && !loading && !errorMessage) {
      fetchPnLData(activeWallets, false);
    }
    // Clear data/error if no wallets are active
    if (activeWallets.length === 0) {
      setAggregatedData(null);
      setErrorMessage('');
    }
  }, [JSON.stringify(activeWallets), fetchPnLData, aggregatedData, loading, errorMessage]);

  // Load all historical data
  useEffect(() => {
    if (historyEnabled && aggregatedData?.positions?.length > 0) {
      const loadAllHistory = async () => {
        try {
          const allHistory = [];
          
          for (const position of aggregatedData.positions) {
            if (position.positionAddress) {
              const history = await getPositionHistory(position.positionAddress);
              if (history && history.length > 0) {
                allHistory.push(...history);
              }
            }
          }
          
          setAllPositionsHistory(allHistory);
        } catch (error) {
          console.error('Error loading historical data:', error);
        }
      };
      
      loadAllHistory();
    }
  }, [historyEnabled, aggregatedData, getPositionHistory]);

  const handleSubmit = async e => {
    e.preventDefault();
    const walletsToSubmit = wallet ? [wallet] : activeWallets; 
    if (walletsToSubmit.length > 0) {
      await fetchPnLData(walletsToSubmit, true); 
    } else {
      setErrorMessage("Please enter a wallet address or select a saved wallet.");
      setAggregatedData(null);
    }
  };

  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value);
    setRefreshInterval(newInterval);
  };

  const handleCloseDisclaimer = () => {
    setDisclaimerOpen(false);
    localStorage.setItem('disclaimerShown', 'true');
  };

  const title = 'Defituna PnL Viewer';
  return (
    <div className="container">
      <title>{title}</title>
      <div className={styles.titleContainer}>
        <h1>{title}</h1>
        <Tooltip content={`• View Defituna positions and PnL
• No transactions needed - just enter wallet address
• Support for multiple wallets
• Auto-refresh data with configurable intervals
• Historical data tracking for positions
• Position age tracking
• PnL card to share with friends`}>
          <div className={styles.infoIcon}>
            <BsInfoCircle />
          </div>
        </Tooltip>
        <div className={styles.titleActions}>
          <Link href="/pools" className={styles.navButton}>
            <span>Pools</span>
          </Link>
          <button 
            className={styles.disclaimerButton} 
            onClick={() => setDisclaimerOpen(true)}
            aria-label="Project disclaimer"
            title="View project disclaimer"
          >
            <FiAlertTriangle />
            <span>Disclaimer</span>
          </button>
        </div>
      </div>
      
      <WalletForm
        wallet={wallet}
        onWalletChange={setWallet}
        activeWallets={activeWallets}
        setActiveWallets={setActiveWallets}
        toggleWalletActive={toggleWalletActive}
        onSubmit={handleSubmit}
        loading={loading}
        countdown={fetchCooldown}
        savedWallets={savedWallets}
        onRemoveWallet={removeWallet}
        onClearWallets={clearWallets}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
      />
      
      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

      {activeWallets.length > 0 && (
        <AutoRefresh
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          refreshInterval={refreshInterval}
          onIntervalChange={handleIntervalChange}
          autoRefreshCountdown={refreshCountdown}
          loading={loading}
          historyEnabled={historyEnabled}
          onHistoryToggle={toggleHistoryEnabled}
        />
      )}

      {activeWallets.length > 0 && (
        <PnLDisplay
          data={aggregatedData}
          positionTimestamps={positionTimestamps}
          historyEnabled={historyEnabled}
          loading={loading}
          positionsHistory={allPositionsHistory}
        />
      )}

      {!loading && !errorMessage && !aggregatedData && activeWallets.length > 0 && (
         <div className={styles.noDataMessage}>No position data found for the selected wallet(s).</div>
      )}
      
      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={handleCloseDisclaimer}
      />
    </div>
  );
};