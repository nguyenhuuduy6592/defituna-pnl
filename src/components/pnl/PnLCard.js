import { useRef, useEffect, useCallback } from 'react';
import { HiX } from 'react-icons/hi';
import { HiDownload, HiShare } from 'react-icons/hi';
import { BsCurrencyDollar, BsClock } from 'react-icons/bs';
import { Portal } from '../common/Portal';
import styles from './PnLCard.module.scss';
import { formatNumber, formatDuration } from '../../utils/formatters';
import { getValueClass } from '../../utils/styles';
import { getStateClass } from '../../utils/positionUtils';
import { exportCardAsImage, shareCard } from '../../utils/export';

/**
 * Renders a stat row with label and value
 */
const StatRow = ({ icon: Icon, label, value, valueClass }) => (
  <div className={styles.statRow}>
    <dt className={styles.label}>
      <Icon className={styles.icon} />
      {label}:
    </dt>
    <dd className={`${styles.value} ${valueClass ? styles[valueClass] : ''}`}>
      {value}
    </dd>
  </div>
);

/**
 * Renders the main PnL value display
 */
const PnLDisplay = ({ value, valueClass, displayPnlPercentage }) => {
  // Only hide percentage if it's invalid
  const percentageDisplay = displayPnlPercentage != null ? (
    <span className={styles.percentage}>
      ({displayPnlPercentage}%)
    </span>
  ) : null;

  return (
    <div 
      className={`${styles.pnl} ${styles[valueClass]}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.label}>PnL</span>
      <span className={styles.value}>
        <BsCurrencyDollar className={styles.currencyIcon} />
        {formatNumber(value)}
        {percentageDisplay}
      </span>
    </div>
  );
};

/**
 * Renders the position status display
 */
const StatusDisplay = ({ status }) => {
  const stateClass = getStateClass(status);
  
  return (
    <div className={`${styles.statusBadge} ${styles[stateClass]}`}>
      {status}
    </div>
  );
};

/**
 * Renders action buttons for the card
 */
const CardActions = ({ onExport, onShare, pairName }) => (
  <div className={styles.actions}>
    <button 
      onClick={onExport} 
      aria-label={`Download ${pairName} PnL card as PNG`}
      title="Download PnL card as PNG image"
    >
      <HiDownload className={styles.buttonIcon} />
      Download PNG
    </button>
    <button 
      onClick={onShare} 
      aria-label={`Share ${pairName} PnL card`}
      title="Share PnL card"
    >
      <HiShare className={styles.buttonIcon} />
      Share
    </button>
  </div>
);

/**
 * A modal card that displays detailed PnL information for a position
 * with options to export as image or share
 * 
 * @param {Object} props Component props
 * @param {Object} props.position Position data to display
 * @param {Function} props.onClose Callback to close the card
 */
export const PnLCard = ({ position, onClose }) => {
  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const exportContentRef = useRef(null);

  // Use position.pairDisplay if available, otherwise fall back to position.pair
  const displayPair = position.pairDisplay || position.pair;

  // Handle escape key press
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

  // Handle export button click
  const handleExport = useCallback(() => {
    exportCardAsImage(exportContentRef, `${displayPair}-pnl-${Date.now()}.png`);
  }, [displayPair, exportContentRef]);

  // Handle share button click
  const handleShare = useCallback(() => {
    shareCard(
      cardRef,
      `${displayPair}-pnl.png`,
      `${displayPair} PnL Card`,
      `Check out my ${displayPair} position on DeFiTuna!`
    );
  }, [displayPair, cardRef]);
  
  // Get value classes for styling
  const pnlValueClass = getValueClass(position.pnl.usd);
  const yieldValueClass = getValueClass(position.yield.usd);
  const compoundedValueClass = getValueClass(position.compounded.usd);
  
  return (
    <Portal>
      <div 
        className={styles.cardOverlay}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
        onClick={handleOverlayClick}
      >
        <div className={styles.modalContainer} ref={cardRef}>
          <div className={styles.header}>
            <h2 id="modal-title">PnL Card</h2>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              ref={closeButtonRef}
              aria-label="Close"
              title="Close PnL card"
            >
              <HiX className={styles.closeIcon} size={16} />
            </button>
          </div>

          <div className={styles.cardContent} ref={exportContentRef} data-export-content>
            <h3 className={styles.pairTitle}>{displayPair}</h3>
            
            <StatusDisplay status={position.displayStatus} />
            
            <div className={styles.mainInfo}>
              <PnLDisplay 
                value={position.pnl.usd} 
                valueClass={pnlValueClass} 
                displayPnlPercentage={position.displayPnlPercentage}
              />
              
              <dl className={styles.stats}>
                <StatRow 
                  icon={BsClock}
                  label="Time in Position"
                  value={formatDuration(position.age)}
                />
                <StatRow 
                  icon={BsCurrencyDollar}
                  label="Fee Yield"
                  value={`$${formatNumber(position.yield.usd)}`}
                  valueClass={yieldValueClass}
                />
                <StatRow 
                  icon={BsCurrencyDollar}
                  label="Compounded"
                  value={`$${formatNumber(position.compounded.usd)}`}
                  valueClass={compoundedValueClass}
                />
              </dl>
            </div>
          </div>

          <CardActions 
            onExport={handleExport}
            onShare={handleShare}
            pairName={displayPair}
          />
        </div>
      </div>
    </Portal>
  );
};