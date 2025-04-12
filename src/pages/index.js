import { useEffect, useState, useCallback } from 'react';
import { BsInfoCircle } from 'react-icons/bs';
import { FiAlertTriangle } from 'react-icons/fi';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';
import { Tooltip } from '@/components/common/Tooltip';
import { DisclaimerModal } from '@/components/common/DisclaimerModal';
import { 
  useWallet, 
  useAutoRefresh, 
  useCountdown, 
  useHistoricalData, 
  useDebounceApi 
} from '@/hooks';
import { useServiceWorkerMessages } from '@/hooks/useServiceWorkerMessages';
import { WalletForm } from '@/components/pnl/WalletForm';
import { AutoRefresh } from '@/components/pnl/AutoRefresh';
import { PnLDisplay } from '@/components/pnl/PnLDisplay';
import { fetchWalletPnL, appTitle } from '@/utils';
import { postMessageToSW } from '@/utils/serviceWorkerUtils';
import styles from '@/styles/index.module.scss';
import Link from 'next/link';
import Head from 'next/head';
import { BiLineChart } from 'react-icons/bi';

export default () => {
  const [loading, setLoading] = useState(false);
  const { countdown: fetchCooldown, startCountdown: startFetchCooldown } = useCountdown(0);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [allPositionsHistory, setAllPositionsHistory] = useState([]);
  const [updateSource, setUpdateSource] = useState(null);

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
    const checkDisclaimerShown = async () => {
      try {
        const db = await initializeDB();
        if (!db) return;

        const disclaimerData = await getData(db, STORE_NAMES.SETTINGS, 'disclaimerShown');
        if (!disclaimerData?.value) {
          setDisclaimerOpen(true);
          await saveData(db, STORE_NAMES.SETTINGS, {
            key: 'disclaimerShown',
            value: true
          });
        }
      } catch (error) {
        console.error('Error checking disclaimer status:', error);
      }
    };

    checkDisclaimerShown();
  }, []);

  // Debounced version for auto-refresh - extract the execute function
  const { execute: debouncedExecuteFetchWalletPnL } = useDebounceApi(fetchWalletPnL, 500);

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
      const fetchFunc = isSubmission ? fetchWalletPnL : debouncedExecuteFetchWalletPnL;

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
        setUpdateSource(isSubmission ? 'user-submission' : 'auto-refresh');
        
        // Handle history data if enabled
        if (historyEnabled) {
          await savePositionSnapshot(combined.positions);
        }
        
        // Handle wallet form submission logic (adding wallet, clearing input)
        if (isSubmission && wallet) {
          addWallet(wallet);
          setWallet('');
        }

        // Start cooldown if this was triggered by a form submission
        if (isSubmission) {
          startFetchCooldown(30); 
        }

      } else if (fetchErrors.length === 0) {
        setErrorMessage('No position data found for the provided wallet(s).');
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
    fetchWalletPnL, 
    wallet, 
    addWallet, 
    setWallet, 
    debouncedExecuteFetchWalletPnL,
    setUpdateSource
  ]);

  // Auto-refresh hook now delegates refresh logic to service worker
  const {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown,
    isRefreshing
  } = useAutoRefresh();

  // Combine general loading and auto-refresh loading states
  const isDataLoading = loading || isRefreshing;

  // This handler no longer needs to trigger data fetching - it just updates the interval in the UI
  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value);
    setRefreshInterval(newInterval);
    // Service worker is notified directly from setRefreshInterval
  };

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

  // Effect to send wallet updates to Service Worker
  useEffect(() => {
    console.log('[UI] Sending SET_WALLETS to SW:', activeWallets);
    postMessageToSW({ type: 'SET_WALLETS', wallets: activeWallets });
  }, [activeWallets]);

  // Handle new positions data from service worker
  const handleNewPositionsData = useCallback(async (data) => {
    if (!data || !data.results) {
        console.warn('[UI Update] Received message without results data. Cannot update UI based on direct results.');
        return;
    }

    if (activeWallets.length === 0) {
      console.log('Skipping update: No active wallets or already loading');
      return;
    }
    
    try {
      const results = data.results;
      
      const relevantResults = results.filter(r => r && !r.error && activeWallets.includes(r.walletAddress));

      if (relevantResults.length > 0) {
        const aggregated = aggregatePnLData(relevantResults);
        if (aggregated) {
          console.log('Updating UI with latest position data from service worker');
          setAggregatedData(aggregated);
          setUpdateSource('service-worker-direct');
        } else {
          setAggregatedData(null); 
          setUpdateSource('service-worker-empty'); 
        }
      } else {
        setAggregatedData(null); 
        setUpdateSource('service-worker-empty'); 
      }

    } catch (error) {
      console.error('[UI Update] Error processing direct results:', error);
    }
  }, [activeWallets, aggregatePnLData]);

  // Setup service worker message listener
  const { isConnected } = useServiceWorkerMessages({
    onNewPositionsData: handleNewPositionsData,
    activeWallets: activeWallets
  });

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

  const handleCloseDisclaimer = async () => {
    setDisclaimerOpen(false);
    try {
      const db = await initializeDB();
      if (db) {
        await saveData(db, STORE_NAMES.SETTINGS, {
          key: 'disclaimerShown',
          value: true
        });
      }
    } catch (error) {
      console.error('Error saving disclaimer status:', error);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>{appTitle}</title>
      </Head>
      <div className={styles.titleContainer}>
        <h1>{appTitle}</h1>
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
        fetchCooldown={fetchCooldown}
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
          loading={isDataLoading}
          historyEnabled={historyEnabled}
          onHistoryToggle={toggleHistoryEnabled}
          isRefreshing={isRefreshing}
        />
      )}

      {activeWallets.length > 0 && (
        <PnLDisplay
          data={aggregatedData}
          errorMessage={errorMessage}
          showWallet={true}
          historyEnabled={historyEnabled}
          loading={isDataLoading}
          lastUpdateSource={updateSource}
          positionsHistory={allPositionsHistory}
        />
      )}

      {!isDataLoading && !errorMessage && !aggregatedData && activeWallets.length > 0 && (
         <div className={styles.noDataMessage}>No position data found for the selected wallet(s).</div>
      )}
      
      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={handleCloseDisclaimer}
      />
    </div>
  );
};