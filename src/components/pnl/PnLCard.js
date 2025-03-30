import { useRef, useEffect, useCallback } from 'react';
import { HiX } from 'react-icons/hi';
import { HiDownload, HiShare } from 'react-icons/hi';
import { BsCurrencyDollar, BsClock } from 'react-icons/bs';
import { Portal } from '../common/Portal';
import styles from './PnLCard.module.scss';
import { formatNumber, formatDuration } from '../../utils/formatters';
import { getValueClass } from '../../utils/styles';
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
const PnLDisplay = ({ value, valueClass }) => (
  <div 
    className={`${styles.pnl} ${styles[valueClass]}`}
    role="status"
    aria-live="polite"
  >
    <span className={styles.label}>PnL</span>
    <span className={styles.value}>
      <BsCurrencyDollar className={styles.currencyIcon} />
      {formatNumber(value)}
    </span>
  </div>
);

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
    exportCardAsImage(exportContentRef, `${position.pair}-pnl-${Date.now()}.png`);
  }, [position.pair, exportContentRef]);

  // Handle share button click
  const handleShare = useCallback(() => {
    shareCard(
      cardRef,
      `${position.pair}-pnl.png`,
      `${position.pair} PnL Card`,
      `Check out my ${position.pair} position on DeFiTuna!`
    );
  }, [position.pair, cardRef]);
  
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
            <h3 className={styles.pairTitle}>{position.pair}</h3>
            
            <div className={styles.mainInfo}>
              <PnLDisplay 
                value={position.pnl.usd} 
                valueClass={pnlValueClass} 
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
            pairName={position.pair}
          />
        </div>
      </div>
    </Portal>
  );
};