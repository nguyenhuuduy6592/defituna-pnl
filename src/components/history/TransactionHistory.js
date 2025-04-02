import { useState, useEffect, useCallback, useMemo } from 'react';
import { TransactionsTable } from './TransactionsTable';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { getMultipleTxsFromCache, saveTxToCache } from '../../utils/db'; // Import DB utils
import { parseTunaTransaction } from '../../utils/parser'; // Import the parser
import styles from './TransactionHistory.module.scss';

// Delay between fetching details for each transaction (in milliseconds)
const FETCH_DELAY_MS = 300; 

const DEFITUNA_PROGRAM_ID = 'tuna4uSQZncNeeiAMKbstuxA9CUkHH6HmC64wgmnogD';

/**
 * Helper function to introduce a delay.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isDefitunaTransaction = (transaction) => {
  if (!transaction?.transaction?.message?.instructions || !transaction?.transaction?.message?.accountKeys) {
    return false;
  }

  const accountKeys = transaction.transaction.message.accountKeys.map(k => k.pubkey || k);
  const instructions = transaction.transaction.message.instructions;

  // Check if any instruction uses the DeFiTuna program
  return instructions.some(ix => {
    const programIdIndex = ix.programIdIndex;
    if (programIdIndex === undefined || programIdIndex >= accountKeys.length) {
      return false;
    }
    return accountKeys[programIdIndex] === DEFITUNA_PROGRAM_ID;
  });
};

/**
 * Container component to fetch and display transaction history for the active wallet.
 * Fetches signatures first, then progressively fetches details for each signature.
 * Receives activeWallets as a prop.
 */
export const TransactionHistory = ({ activeWallets = [] }) => { // Accept prop, provide default
  const [signaturesInfo, setSignaturesInfo] = useState([]);
  const [transactionDetails, setTransactionDetails] = useState({}); // Store details keyed by signature
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [loadingDetailsCount, setLoadingDetailsCount] = useState(0);
  const [error, setError] = useState('');

  // 1. Fetch signature list
  const fetchSignatures = useCallback(async (walletAddress) => {
    if (!walletAddress) {
      setSignaturesInfo([]);
      setTransactionDetails({});
      setLoadingSignatures(false);
      setLoadingDetailsCount(0);
      setError('');
      return;
    }

    setLoadingSignatures(true);
    setError('');
    setSignaturesInfo([]); // Clear previous signatures
    setTransactionDetails({}); // Clear previous details
    try {
      const response = await fetch(`/api/history?walletAddress=${encodeURIComponent(walletAddress)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      const fetchedSignaturesInfo = await response.json();
      setSignaturesInfo(fetchedSignaturesInfo || []);
    } catch (err) {
      setError(err.message || 'Failed to load transaction signatures.');
      setSignaturesInfo([]);
    } finally {
      setLoadingSignatures(false);
    }
  }, []);

  const fetchAllDetails = async () => {
    const signatures = signaturesInfo.map(s => s.signature).filter(Boolean);
    if (signatures.length === 0) return;
    
    let cachedDetailsMap = new Map();
    try {
      cachedDetailsMap = await getMultipleTxsFromCache(signatures);
    } catch (error) {
      setError("Error loading cached transaction details.");
      return;
    }

    const parsedCachedDetails = {};
    for (const [sig, detail] of cachedDetailsMap.entries()) {
      // Only include DeFiTuna transactions
      if (isDefitunaTransaction(detail.originalDetail)) {
        const parsedInfo = parseTunaTransaction(detail.originalDetail);
        parsedCachedDetails[sig] = { 
          ...detail, 
          parsed: parsedInfo,
          originalDetail: detail.originalDetail,
          loading: false 
        };
      }
    }
    setTransactionDetails(prev => ({ ...prev, ...parsedCachedDetails }));

    const signaturesToFetch = signatures.filter(sig => !cachedDetailsMap.has(sig));
    
    if (signaturesToFetch.length === 0) {
        setLoadingDetailsCount(0);
        return;
    }

    setLoadingDetailsCount(signaturesToFetch.length);
    
    for (const signature of signaturesToFetch) {
      if (transactionDetails[signature]) continue; 

      try {
        const response = await fetch(`/api/transaction-detail?signature=${encodeURIComponent(signature)}`);
        
        if (response.ok) {
          const detail = await response.json();
          if (detail && isDefitunaTransaction(detail)) {
            const parsedInfo = parseTunaTransaction(detail);
            const detailToStore = { 
              originalDetail: detail,
              parsed: parsedInfo,
              loading: false 
            }; 
            
            await saveTxToCache(signature, detailToStore);
            setTransactionDetails(prev => ({ ...prev, [signature]: detailToStore })); 
          }
        }
      } catch (err) {
      }
      
      setLoadingDetailsCount(prevCount => Math.max(0, prevCount - 1));
      await delay(FETCH_DELAY_MS);
    }
    setLoadingDetailsCount(0);
  };

  // 2. Progressively fetch details for signatures, checking cache first and parsing
  useEffect(() => {
    if (signaturesInfo.length === 0 || loadingSignatures) {
      setLoadingDetailsCount(0);
      return;
    }

    fetchAllDetails();

    return () => {
      // Cleanup logic if needed
    };

  }, [signaturesInfo, loadingSignatures]); // Depend on signaturesInfo and loadingSignatures

  // Effect to trigger signature fetch when activeWallets change
  useEffect(() => {
    const primaryWallet = activeWallets.length > 0 ? activeWallets[0] : null;

    // Only fetch if we have a valid primary wallet address
    if (primaryWallet) {
      fetchSignatures(primaryWallet);
    } else {
      // If no primary wallet (e.g., user deselects all), clear the history data
      fetchSignatures(null); // Calling with null clears state within the function
    }
  // We still depend on activeWallets changing to trigger this logic.
  // fetchSignatures is memoized, so it's safe.
  }, [activeWallets, fetchSignatures]);
  
  // Function to manually re-parse details already in state
  const handleManualParse = () => {
    setTransactionDetails(currentDetails => {
      const updatedDetails = {};
      let changed = false;
      for (const signature in currentDetails) {
        const stateEntry = currentDetails[signature];
        if (isDefitunaTransaction(stateEntry.originalDetail)) {
          const oldParsedInfo = stateEntry.parsed;
          const newParsedInfo = parseTunaTransaction(stateEntry.originalDetail);
          
          if (JSON.stringify(oldParsedInfo) !== JSON.stringify(newParsedInfo)) {
               changed = true;
          }
          updatedDetails[signature] = { 
            ...stateEntry, 
            parsed: newParsedInfo, 
            loading: false 
          };
        }
      }
      return changed ? updatedDetails : currentDetails;
    });
  };

  // Modify useMemo to include parsed data
  const combinedAndFilteredTransactions = useMemo(() => {
      const result = signaturesInfo
        .map(sigInfo => {
          const signature = sigInfo.signature;
          const detailEntry = transactionDetails[signature]; 
          
          if (detailEntry && !detailEntry.loading) {
              return { 
                  signature: signature,
                  blockTime: sigInfo.blockTime,
                  parsed: detailEntry.parsed,
                  status: detailEntry.originalDetail?.meta?.err === null ? 'Success' : 'Failed',
                  loading: false 
              };
          } else {
              return { 
                  signature: signature,
                  blockTime: sigInfo.blockTime,
                  parsed: null, 
                  status: 'Loading...',
                  loading: true
              };
          }
        })
        .filter(tx => tx.parsed !== null); // Only include transactions that were successfully parsed
      return result;
  }, [signaturesInfo, transactionDetails]);
  
  const isLoading = loadingSignatures || loadingDetailsCount > 0;

  // If no active wallet, don't render the main content
  if (activeWallets.length === 0) {
    return null;
  }

  return (
    <div className={styles.historyContainer}> 
      <h2>Recent Transaction History (Last 7 Days)</h2>
      {/* Add Manual Parse Button */} 
      <button 
        onClick={handleManualParse} 
        className={styles.manualParseButton}
        title={isLoading ? "Wait for loading to complete" : Object.keys(transactionDetails).length === 0 ? "Waiting for details to load" : "Manually re-parse loaded transactions"}
      >
        Manual Parse
      </button>
      
      {activeWallets.length > 0 && 
        <p className={styles.walletInfo}>Showing history for: {activeWallets[0].slice(0, 6)}...{activeWallets[0].slice(-4)}</p>
      }
      {activeWallets.length > 1 && 
        <p className={styles.multiWalletWarning}>Note: Currently showing history for the first active wallet only.</p>
      }
      
      {/* Show overall loading or specific detail loading count */} 
      <LoadingOverlay loading={loadingSignatures} message="Loading signatures..."> 
         {/* Optionally show detail loading progress */} 
         {loadingDetailsCount > 0 && 
            <p className={styles.loadingDetails}>Loading details for {loadingDetailsCount} transactions...</p>
         }
         
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        {!error && (
           <TransactionsTable 
               transactions={combinedAndFilteredTransactions} 
               isLoading={isLoading} 
               totalSignatures={signaturesInfo.length}
            />
        )}
      </LoadingOverlay>
    </div>
  );
}; 