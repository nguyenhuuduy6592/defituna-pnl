import { useState, useEffect, useMemo } from 'react';
import { FiCopy, FiShare2 } from 'react-icons/fi';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { Tooltip } from '../common/Tooltip';
import styles from './LendingPositionsDisplay.module.scss';
import { formatFee, formatNumber, copyToClipboard as utilCopyToClipboard, formatWalletAddress as utilFormatWalletAddress, formatDuration } from '../../utils';

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
  // Use provided data or default data
  const displayData = useMemo(() => {
    if (!data) return defaultData;
    
    return {
      positions: Array.isArray(data.positions) ? data.positions : [],
      walletCount: typeof data.walletCount === 'number' ? data.walletCount : 0
    };
  }, [data]);

  const [vaultDetails, setVaultDetails] = useState({});
  const [mintDetails, setMintDetails] = useState({});
  
  // Fetch vault and mint details for all positions
  useEffect(() => {
    const fetchDetailsForPositions = async () => {
      if (!displayData.positions.length) return;
      
      // Get unique vault addresses
      const uniqueVaults = [...new Set(displayData.positions.map(pos => pos.vault))];
      const uniqueMints = new Set();
      
      // Fetch vault details and collect unique mints
      const newVaultDetails = { ...vaultDetails };
      
      for (const vaultAddress of uniqueVaults) {
        if (!newVaultDetails[vaultAddress]) {
          const details = await getVaultDetails(vaultAddress);
          if (details) {
            newVaultDetails[vaultAddress] = details;
            if (details.mint) uniqueMints.add(details.mint);
          }
        } else if (newVaultDetails[vaultAddress].mint) {
          uniqueMints.add(newVaultDetails[vaultAddress].mint);
        }
      }
      
      setVaultDetails(newVaultDetails);
      
      // Fetch mint details
      const newMintDetails = { ...mintDetails };
      
      for (const mintAddress of uniqueMints) {
        if (!newMintDetails[mintAddress]) {
          const details = await getMintDetails(mintAddress);
          if (details) {
            newMintDetails[mintAddress] = details;
          }
        }
      }
      
      setMintDetails(newMintDetails);
    };
    
    fetchDetailsForPositions();
  }, [displayData.positions, getVaultDetails, getMintDetails]);
  
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
          {displayData.positions.length > 0 ? (
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
                {displayData.positions.map((position, index) => {
                  const vault = vaultDetails[position.vault] || {};
                  const mintInfo = vault.mint ? mintDetails[vault.mint] || {} : {};
                  
                  return (
                    <tr key={`${position.vault}-${position.authority || position.wallet}-${index}`}>
                      <td>
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
                      <td>
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
                      <td>
                        {position.age !== null && position.age !== undefined 
                          ? formatDuration(position.age) 
                          : 'N/A'}
                      </td>
                      <td>
                        <div>
                          <span className={styles.fundsAmount}>{formatNumber(position.funds_amount || 0, false)}</span>
                          <span className={styles.usdValueParentheses}>
                            ({formatFee(position.funds_usd_value || 0, false)})
                          </span>
                        </div>
                      </td>
                      <td className={styles.positive}>
                        {vault.supply_apy ? formatNumber(vault.supply_apy * 100, false) : '0.00'}%
                      </td>
                      <td className={styles.positive}>
                        <div>
                          <span className={styles.earnedAmount}>{formatNumber(position.earned_amount || 0, false)}</span>
                          <span className={styles.usdValueParentheses}>
                            ({formatFee(position.earned_usd_value || 0, false)})
                          </span>
                        </div>
                      </td>
                      <td>
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