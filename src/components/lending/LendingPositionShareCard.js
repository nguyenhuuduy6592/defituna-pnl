import React, { useRef, useEffect, useCallback } from 'react';
import { FiX, FiCopy } from 'react-icons/fi';
import { HiDownload, HiShare } from 'react-icons/hi'; // Icons for new buttons
import styles from './LendingPositionShareCard.module.scss';
import { copyToClipboard, formatWalletAddress, formatFee, formatNumber, exportCardAsImage, shareCard } from '../../utils'; 
import { Portal } from '../common/Portal'; // Import Portal

// Helper for stat rows, similar to PnLCard
const StatRow = ({ label, value, valueClass }) => (
  <div className={styles.statRow}>
    <dt className={styles.label}>{label}:</dt>
    <dd className={`${styles.value} ${valueClass || ''}`}>{value}</dd>
  </div>
);

export const LendingPositionShareCard = ({ position, onClose }) => {
  if (!position) return null;

  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const exportContentRef = useRef(null);

  // Destructure for convenience
  const { 
    vault,
    authority, 
    wallet, 
    funds_amount,
    funds_usd_value,
    earned_amount,
    earned_usd_value,
    vaultSymbol,
    supplyApy
  } = position;

  const effectiveWallet = authority || wallet;

  // Handle escape key and focus
  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const cardTitle = `${vaultSymbol || 'Lending'} Position Snapshot`;

  // Handle export button click
  const handleExport = useCallback(() => {
    exportCardAsImage(exportContentRef, `${vaultSymbol || 'lending'}-position-${Date.now()}.png`);
  }, [vaultSymbol, exportContentRef]);

  // Handle share button click
  const handleShare = useCallback(() => {
    const shareDetails = {
      title: cardTitle,
      text: `Check out this ${vaultSymbol || 'Lending'} position on DeFiTuna!`,
      fileName: `${vaultSymbol || 'lending'}-position.png`
    };
    shareCard(cardRef, shareDetails.fileName, shareDetails.title, shareDetails.text);
  }, [vaultSymbol, cardRef, cardTitle]);

  // Text for simple copy (if still needed, or remove if card is purely visual)
  const shareTextForClipboard = `DeFiTuna Lending Position:\n` +
                                `Vault: ${vaultSymbol || 'N/A'} (${formatWalletAddress(vault || 'N/A')})\n` +
                                `Wallet: ${formatWalletAddress(effectiveWallet || 'N/A')}\n` +
                                `Funds: ${formatNumber(funds_amount || 0, false)} (${formatFee(funds_usd_value || 0, false)})\n` +
                                `Supply APY: ${supplyApy ? supplyApy.toFixed(2) : '0.00'}%\n` +
                                `Earned: ${formatNumber(earned_amount || 0, false)} (${formatFee(earned_usd_value || 0, false)})`;

  const handleSimpleCopy = () => {
    copyToClipboard(shareTextForClipboard);
  };

  return (
    <Portal>
      <div 
        className={styles.cardOverlay} // Style to match PnLCard.module.scss
        role="dialog"
        aria-labelledby="lending-modal-title"
        aria-modal="true"
        onClick={handleOverlayClick}
      >
        <div className={styles.modalContainer} ref={cardRef}> {/* Style to match PnLCard.module.scss */} 
          <div className={styles.header}> {/* Style to match PnLCard.module.scss */} 
            <h2 id="lending-modal-title">{cardTitle}</h2>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              ref={closeButtonRef}
              aria-label="Close"
              title="Close snapshot card"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className={styles.cardContent} ref={exportContentRef} data-export-content> {/* Style to match PnLCard.module.scss */} 
            {/* Main content mimicking PnLCard structure but with Lending Data */}
            <div className={styles.detailsGrid}> {/* Adapting for lending data */}
              <StatRow label="Vault" value={`${vaultSymbol || 'N/A'} (${formatWalletAddress(vault || 'N/A')})`} />
              <StatRow label="Wallet" value={formatWalletAddress(effectiveWallet || 'N/A')} />
              <StatRow label="Funds" value={`${formatNumber(funds_amount || 0, false)} (${formatFee(funds_usd_value || 0, false)})`} />
              <StatRow label="Supply APY" value={`${supplyApy ? supplyApy.toFixed(2) : '0.00'}%`} valueClass={styles.positiveValue} />
              <StatRow 
                label="Earned" 
                value={`${formatNumber(earned_amount || 0, false)} (${formatFee(earned_usd_value || 0, false)})`} 
                valueClass={styles.positiveValue}
              />
            </div>
          </div>

          <div className={styles.actions}> {/* Style to match PnLCard.module.scss */} 
            <button onClick={handleExport} title="Download as PNG">
              <HiDownload /> Download PNG
            </button>
            <button onClick={handleShare} title="Share this snapshot">
              <HiShare /> Share
            </button>
            {/* Optional: Keep a simple text copy button if desired */}
            <button onClick={handleSimpleCopy} title="Copy details as text">
              <FiCopy /> Copy Text
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}; 