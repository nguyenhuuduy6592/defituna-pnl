import { useState, useEffect, useCallback, useRef } from 'react';
import { BsInfoCircle } from 'react-icons/bs';
import { FiAlertTriangle } from 'react-icons/fi';
import { Tooltip } from '../components/common/Tooltip';
import { DisclaimerModal } from '../components/common/DisclaimerModal';
import { CollapsibleSection } from '../components/common/CollapsibleSection';
import { LendingPositionShareCard } from '../components/lending/LendingPositionShareCard';
import {
  useWallet,
  useAutoRefresh,
  useHistoricalData,
  useDebounceApi,
  useLendingPositions
} from '../hooks';
import { WalletForm } from '../components/pnl/WalletForm';
import { AutoRefresh } from '../components/pnl/AutoRefresh';
import { PnLDisplay } from '../components/pnl/PnLDisplay';
import { LendingPositionsDisplay } from '../components/pnl/LendingPositionsDisplay';
import {
  fetchWalletPnL
} from '../utils';
import styles from './index.module.scss';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePriceContext } from '../contexts/PriceContext';
import { getValueClass, formatNumber } from '@/utils';

// Storage keys for collapsible sections
const TRADING_EXPANDED_KEY = 'tradingExpanded';
const LENDING_EXPANDED_KEY = 'lendingExpanded';

export default () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [allPositionsHistory, setAllPositionsHistory] = useState([]);
  const initialFetched = useRef(false);
  const [lendingEnabled, setLendingEnabled] = useState(false);

  // State for lending position share modal
  const [lendingShareModalState, setLendingShareModalState] = useState({
    isOpen: false,
    positionData: null,
  });

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

  const { updateSolPrice } = usePriceContext();

  // Check if this is the first visit
  useEffect(() => {
    const disclaimerShown = localStorage.getItem('disclaimerShown');
    if (!disclaimerShown) {
      setDisclaimerOpen(true);
      localStorage.setItem('disclaimerShown', 'true');
    }
  }, []);

  // Debounced version for auto-refresh - extract the execute function
  const { execute: debouncedExecuteFetchWalletPnL } = useDebounceApi(fetchWalletPnL, 500);

  // Aggregate PnL data from multiple wallets, filtering out errors
  const aggregatePnLData = useCallback((walletsData, solPrice) => {
    const validData = walletsData.filter(d => d && !d.error); 
    if (validData.length === 0) return null;

    const allPositions = validData.flatMap(d => d.positions || []);
    
    const totalPnLInSol = (() => {
      const tokenTotals = allPositions.reduce((acc, position) => {
        position.pnlData.token_pnl.forEach(token => {
          if (!acc[token.token]) {
            acc[token.token] = 0;
          }
          acc[token.token] += token.amount;
        });
        return acc;
      }, {});
      
      return Object.entries(tokenTotals)
        .map(([token, amount]) => {
          const valueClass = getValueClass(amount);
          return `<span class="${valueClass}">${formatNumber(amount)} ${token}</span>`;
        })
        .join('<br />');
    })();
    const totalPnL = (() => {
      const sumPnL = allPositions.reduce((acc, position) => {
        return acc + position.pnlData.pnl_usd.amount;
      }, 0);
      return `<span class="${getValueClass(sumPnL)}">${formatNumber(sumPnL)} $</span>`;
    })();

    const totalYieldInSol = (() => {
      const tokenTotals = allPositions.reduce((acc, position) => {
        position.yieldData.tokens.forEach(token => {
            if (!acc[token.token]) {
              acc[token.token] = 0;
            }
            acc[token.token] += token.amount;
          });
          return acc;
        }, {});
        
        return Object.entries(tokenTotals)
          .map(([token, amount]) => {
            const valueClass = getValueClass(amount);
            return `<span class="${valueClass}">${formatNumber(amount)} ${token}</span>`;
          })
          .join('<br />');
      })()
    const totalYield = (() => {
      const sumYield = allPositions.reduce((acc, position) => {
        return acc + position.yieldData.usd.amount;
      }, 0);
      return `<span class="${getValueClass(sumYield)}">${formatNumber(sumYield)} $</span>`;
    })();

    const totalCompoundedInSol = (() => {
      const tokenTotals = allPositions.reduce((acc, position) => {
        position.compoundedData.tokens.forEach(token => {
            if (!acc[token.token]) {
              acc[token.token] = 0;
            }
            acc[token.token] += token.amount;
          });
          return acc;
        }, {});
        
        return Object.entries(tokenTotals)
          .map(([token, amount]) => {
            const valueClass = getValueClass(amount);
            return `<span class="${valueClass}">${formatNumber(amount)} ${token}</span>`;
          })
          .join('<br />');
      })()
    const totalCompounded = (() => {
      const sumCompounded = allPositions.reduce((acc, position) => {
        return acc + position.compoundedData.usd.amount;
      }, 0);
      return `<span class="${getValueClass(sumCompounded)}">${formatNumber(sumCompounded)} $</span>`;
    })();

    const totalSize = (() => {
      const sumSize = allPositions.reduce((acc, position) => {
        return acc + position.size;
      }, 0);
      return sumSize;
    })();
    const totalSizeInSol = (() => {
      if (totalSize === 0) {
        return `${formatNumber(0)} SOL`;
      }
      if (solPrice != null && solPrice > 0) {
        const solAmount = totalSize / solPrice;
        return `${formatNumber(solAmount)} SOL`;
      }
      return 'N/A SOL';
    })();

    return {
      totalPnL,
      totalPnLInSol,
      totalYield,
      totalYieldInSol,
      totalCompounded,
      totalCompoundedInSol,
      totalSize,
      totalSizeInSol,
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
      const solPrice = await updateSolPrice();

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
        combined = aggregatePnLData(results, solPrice);
        if (!combined) {
          // If aggregation fails completely after errors, clear data
          setAggregatedData(null);
        }
      } else {
         // Clear error message on successful fetch/refresh
         setErrorMessage('');
         combined = aggregatePnLData(results, solPrice);
      }

      if (combined) {
        setAggregatedData(combined);
        
        // Handle history data if enabled
        if (historyEnabled) {
          await savePositionSnapshot(combined.positions);
        }
        
        // Handle wallet form submission logic (adding wallet, clearing input)
        if (isSubmission && wallet) {
          addWallet(wallet);
          setWallet('');
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
    historyEnabled, 
    savePositionSnapshot, 
    fetchWalletPnL, 
    wallet, 
    addWallet, 
    setWallet, 
    debouncedExecuteFetchWalletPnL,
    updateSolPrice
  ]);

  const {
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    refreshCountdown
  } = useAutoRefresh(
    useCallback(() => {
      fetchPnLData(activeWallets);
      // Also fetch lending positions when auto-refresh runs
      if (lendingPositionsHook && lendingPositionsHook.fetchLendingData) {
        lendingPositionsHook.fetchLendingData(activeWallets);
      }
    }, [fetchPnLData, activeWallets])
  );

  // Hook for lending positions
  const lendingPositionsHook = useLendingPositions(lendingEnabled ? activeWallets : []);

  // Handle initial load and wallet query parameter
  useEffect(() => {
    if (router.isReady && !initialFetched.current) {
      const walletParam = router.query.wallet;
      if (walletParam) {
        const wallets = walletParam.split(',').map(w => w.trim()).filter(w => w);
        if (wallets.length > 0) {
          console.log(`Handle wallet query parameter: ${wallets}`);
          setActiveWallets(wallets);
          fetchPnLData(wallets, false);
        }
      } else
        // Initial load logic: Fetch only if wallets are active, no data yet, not already loading, and no error shown
        if (activeWallets.length > 0 && !aggregatedData && !loading && !errorMessage) {
        console.log(`Auto fetch data if there are active wallets on page load 1: ${activeWallets}`);
        fetchPnLData(activeWallets, false);
      }
      // Clear data/error if no wallets are active
      if (activeWallets.length === 0) {
        console.log('Auto fetch data if there are active wallets on page load 2');
        setAggregatedData(null);
        setErrorMessage('');
      }
      initialFetched.current = true;
      setLendingEnabled(true);
    }
  }, [router.isReady, router.query.wallet, activeWallets, aggregatedData, loading, errorMessage, fetchPnLData, setActiveWallets]);

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
      // Also fetch lending positions data
      if (lendingPositionsHook && lendingPositionsHook.fetchLendingData) {
        lendingPositionsHook.fetchLendingData(walletsToSubmit, true);
      }
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

  // Handler to open the lending position share modal
  const handleLendingPositionShare = useCallback((positionToShare) => {
    const vaultDetails = lendingPositionsHook.vaultDetails[positionToShare.vault];
    const mintDetails = vaultDetails ? lendingPositionsHook.mintDetails[vaultDetails.mint] : {};

    const preparedPositionData = {
      ...positionToShare,
      vaultSymbol: mintDetails?.symbol || 'N/A',
      supplyApy: vaultDetails?.supply_apy ? vaultDetails.supply_apy * 100 : 0, // Convert to percentage
      // ensure all other necessary fields from positionToShare are included
    };

    setLendingShareModalState({ isOpen: true, positionData: preparedPositionData });
  }, [lendingPositionsHook.vaultDetails, lendingPositionsHook.mintDetails]);

  // Handler to close the lending position share modal
  const handleCloseLendingShareModal = useCallback(() => {
    setLendingShareModalState({ isOpen: false, positionData: null });
  }, []);

  // Determine if we should show lending positions
  const shouldShowLendingSection = activeWallets.length > 0 && lendingPositionsHook && lendingPositionsHook.lendingData && lendingPositionsHook.lendingData.positions.length > 0;

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
          <Link href="/lending" className={styles.navButton}>
            <span>Lending</span>
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
        <>
          <CollapsibleSection 
            title="Trading Positions" 
            storageKey={TRADING_EXPANDED_KEY}
            defaultExpanded={true}
            visible={aggregatedData !== null}
          >
            <PnLDisplay
              data={aggregatedData}
              historyEnabled={historyEnabled}
              loading={loading}
              positionsHistory={allPositionsHistory}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title="Lending Positions"
            storageKey={LENDING_EXPANDED_KEY}
            defaultExpanded={true}
            visible={shouldShowLendingSection}
          >
            <LendingPositionsDisplay
              data={lendingPositionsHook.lendingData}
              loading={lendingPositionsHook.loading}
              getVaultDetails={lendingPositionsHook.getVaultDetails}
              getMintDetails={lendingPositionsHook.getMintDetails}
              onShare={handleLendingPositionShare}
            />
          </CollapsibleSection>
        </>
      )}

      {!loading && !errorMessage && !aggregatedData && activeWallets.length > 0 && (
         <div className={styles.noDataMessage}>No position data found for the selected wallet(s).</div>
      )}
      
      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={handleCloseDisclaimer}
      />

      {lendingShareModalState.isOpen && (
        <LendingPositionShareCard 
          position={lendingShareModalState.positionData} 
          onClose={handleCloseLendingShareModal} 
        />
      )}
    </div>
  );
};