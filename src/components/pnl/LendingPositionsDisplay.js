import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiCopy, FiShare2 } from 'react-icons/fi';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { Tooltip } from '../common/Tooltip';
import styles from './LendingPositionsDisplay.module.scss';
import { formatFee, formatNumber, copyToClipboard as utilCopyToClipboard, formatWalletAddress as utilFormatWalletAddress, formatDuration } from '../../utils';
import { usePriceContext } from '../../contexts/PriceContext';
import { useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';

// Default structure when data is not yet available
const defaultData = {
  positions: [],
  walletCount: 0,
};

/**
 * Component for displaying lending positions data with loading state
 * 
 * @param {Object} props Component props
 * @param {Object} props.data Data containing lending positions information
 * @param {boolean} props.loading Whether data is currently loading
 * @param {Function} props.getVaultDetails Function to fetch vault details
 * @param {Function} props.getMintDetails Function to fetch mint details
 * @param {Function} props.onShare Function to handle sharing a lending position
 * @returns {JSX.Element} Rendered component
 */
export const LendingPositionsDisplay = ({ 
  data, 
  loading = false,
  getVaultDetails,
  getMintDetails,
  onShare
}) => {
  const rawDisplayData = useMemo(() => {
    if (!data) return defaultData;
    return {
      positions: Array.isArray(data.positions) ? data.positions : [],
      walletCount: typeof data.walletCount === 'number' ? data.walletCount : 0
    };
  }, [data]);

  const [vaultDetails, setVaultDetails] = useState({});
  const [mintDetails, setMintDetails] = useState({});
  const { solPrice } = usePriceContext();
  const { showInSol } = useDisplayCurrency();
  
  useEffect(() => {
    const fetchDetailsForPositions = async () => {
      if (!rawDisplayData.positions.length) return;
      
      const uniqueVaults = [...new Set(rawDisplayData.positions.map(pos => pos.vault))];
      const uniqueMints = new Set();
      
      const newVaultDetails = {}; 
      const currentVaultAddresses = Object.keys(vaultDetails);

      for (const vaultAddress of uniqueVaults) {
        if (!currentVaultAddresses.includes(vaultAddress)) {
          const details = await getVaultDetails(vaultAddress);
          if (details) {
            newVaultDetails[vaultAddress] = details;
            if (details.mint) uniqueMints.add(details.mint);
          }
        } else {
          newVaultDetails[vaultAddress] = vaultDetails[vaultAddress];
          if (vaultDetails[vaultAddress]?.mint) uniqueMints.add(vaultDetails[vaultAddress].mint);
        }
      }
      setVaultDetails(prevDetails => ({...prevDetails, ...newVaultDetails}));
      
      const newMintDetails = {};
      const currentMintAddresses = Object.keys(mintDetails);

      for (const mintAddress of uniqueMints) {
        if (!currentMintAddresses.includes(mintAddress)) {
          const details = await getMintDetails(mintAddress);
          if (details) {
            newMintDetails[mintAddress] = details;
          }
        } else {
          newMintDetails[mintAddress] = mintDetails[mintAddress];
        }
      }
      setMintDetails(prevDetails => ({...prevDetails, ...newMintDetails}));
    };
    
    fetchDetailsForPositions();
  }, [rawDisplayData.positions, getVaultDetails, getMintDetails]);
  
  const formatFinancialValueDisplay = useCallback((amount, usdValue) => {
    if (showInSol) {
      if (usdValue === 0) {
        return `${formatNumber(0)} SOL`;
      } 
      else if (usdValue != null && solPrice != null) { 
        const solAmount = usdValue / solPrice;
        return `${formatNumber(solAmount)} SOL`;
      }
      return 'N/A SOL'; 
    } else {
      const usdValueDisplay = usdValue == null ? 'N/A USD' : formatFee(usdValue, false);
      return (
        <>
          <span className={styles.usdValueParentheses}>{usdValueDisplay}</span>
        </>
      );
    }
  }, [solPrice, showInSol]);

  // Pre-calculate display values for all positions
  const processedPositions = useMemo(() => {
    return rawDisplayData.positions.map(position => ({
      ...position,
      fundsDisplay: formatFinancialValueDisplay(position.funds?.amount, position.funds?.usd),
      earnedDisplay: formatFinancialValueDisplay(position.earned?.amount, position.earned?.usd),
    }));
  }, [rawDisplayData.positions, formatFinancialValueDisplay]);

  // Render vault tooltip content - MODIFIED
  const renderVaultTooltip = (vaultAddress) => {
    const vault = vaultDetails[vaultAddress] || {};
    
    return (
      <div>
        <div className={styles.tooltipLine}>
          <strong>Vault Address:</strong> 
          <span 
            className={styles.tooltipCopyableAddress}
            onClick={() => utilCopyToClipboard(vaultAddress)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') utilCopyToClipboard(vaultAddress); }}
            role="button"
            tabIndex={0}
            title="Copy vault address"
            aria-label={`Copy vault address ${utilFormatWalletAddress(vaultAddress)}`}
          >
            {utilFormatWalletAddress(vaultAddress)}
            <FiCopy className={styles.tooltipCopyIcon} />
          </span>
        </div>
        {vault.deposited_funds && (
          <div className={styles.tooltipLine}><strong>Deposited Funds:</strong> {formatFee(vault.deposited_funds.usd, false)}</div>
        )}
        {vault.borrowed_funds && (
          <div className={styles.tooltipLine}><strong>Borrowed Funds:</strong> {formatFee(vault.borrowed_funds.usd, false)}</div>
        )}
        {vault.supply_apy !== undefined && (
          <div className={styles.tooltipLine}><strong>Supply APY:</strong> {(vault.supply_apy * 100).toFixed(2)}%</div>
        )}
        {vault.borrow_apy !== undefined && (
          <div className={styles.tooltipLine}><strong>Borrow APY:</strong> {(vault.borrow_apy * 100).toFixed(2)}%</div>
        )}
        {vault.utilization !== undefined && (
          <div className={styles.tooltipLine}><strong>Utilization:</strong> {(vault.utilization * 100).toFixed(2)}%</div>
        )}
      </div>
    );
  };

  return (
    <LoadingOverlay loading={loading}>
      <div className={styles.lendingContainer}>
        <div className={styles.contentWrapper}>
          {processedPositions.length > 0 ? (
            <table className={styles.lendingTable}>
              <thead>
                <tr>
                  <th>Vault</th>
                  <th>Wallet</th>
                  <th>Age</th>
                  <th>Funds</th>
                  <th>Supply APY</th>
                  <th>Earned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedPositions.map((position, index) => {
                  const vault = vaultDetails[position.vault] || {};
                  const mintInfo = vault.mint ? mintDetails[vault.mint] || {} : {};
                  
                  return (
                    <tr key={`${position.vault}-${position.authority || position.wallet}-${index}`}>
                      <td data-label="Vault">
                        <div className={styles.vaultInfo}>
                          {mintInfo.logo && (
                            <div className={styles.vaultIcon}>
                              <img src={mintInfo.logo} alt={mintInfo.symbol || 'Token'} />
                            </div>
                          )}
                          <Tooltip content={renderVaultTooltip(position.vault)} position="top">
                            <span className={styles.tooltipTrigger}>
                              {mintInfo.symbol || utilFormatWalletAddress(position.vault)}
                            </span>
                          </Tooltip>
                        </div>
                      </td>
                      <td data-label="Wallet">
                        <div 
                          className={styles.walletAddress}
                          onClick={() => utilCopyToClipboard(position.authority || position.wallet)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              utilCopyToClipboard(position.authority || position.wallet);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title="Copy wallet address"
                          aria-label={`Copy wallet address ${utilFormatWalletAddress(position.authority || position.wallet)}`}
                        >
                          <span>{utilFormatWalletAddress(position.authority || position.wallet)}</span>
                          <FiCopy 
                            className={styles.copyIcon} 
                          />
                        </div>
                      </td>
                      <td data-label="Age">
                        {position.age !== null && position.age !== undefined 
                          ? formatDuration(position.age) 
                          : 'N/A'}
                      </td>
                      <td data-label="Funds">
                        <div>
                          {position.fundsDisplay}
                        </div>
                      </td>
                      <td data-label="Supply APY" className={styles.positive}>
                        {vault.supply_apy ? formatNumber(vault.supply_apy * 100, false) : '0.00'}%
                      </td>
                      <td data-label="Earned" className={styles.positive}>
                        <div>
                          {position.earnedDisplay}
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.shareButton}
                            onClick={() => onShare(position)}
                            title="Share position"
                          >
                            <FiShare2 size={14} />
                            <span>Share</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.noPositionsMessage}>
              No lending positions found for the selected wallet(s).
            </div>
          )}
        </div>
      </div>
    </LoadingOverlay>
  );
}; 