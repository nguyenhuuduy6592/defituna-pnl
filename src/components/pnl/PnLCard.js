import { useRef, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { HiDownload, HiShare } from 'react-icons/hi';
import { BsCurrencyDollar, BsClock } from 'react-icons/bs';
import { Portal } from '../common/Portal';
import styles from './PnLCard.module.scss';
import { formatNumber, formatDuration } from '../../utils/formatters';
import { getValueClass } from '../../utils/styles';
import { exportCardAsImage, shareCard } from '../../utils/export';

export const PnLCard = ({ position, onClose }) => {
  const cardRef = useRef(null);
  const closeButtonRef = useRef(null);
  const exportContentRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleExport = () => {
    exportCardAsImage(exportContentRef, `${position.pair}-pnl-${Date.now()}.png`);
  };

  const handleShare = () => {
    shareCard(
      cardRef,
      `${position.pair}-pnl.png`,
      `${position.pair} PnL Card`,
      `Check out my ${position.pair} position on DeFiTuna!`
    );
  };
  
  return (
    <Portal>
      <div 
        className={styles.cardOverlay}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
        onClick={(e) => e.target === e.currentTarget && onClose()}
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
              <div 
                className={`${styles.pnl} ${styles[getValueClass(position.pnl.usd)]}`}
                role="status"
                aria-live="polite"
              >
                <span className={styles.label}>PnL</span>
                <span className={styles.value}>
                  <BsCurrencyDollar className={styles.currencyIcon} />
                  {formatNumber(position.pnl.usd)}
                </span>
              </div>
              
              <dl className={styles.stats}>
                <div className={styles.statRow}>
                  <dt className={styles.label}>
                    <BsClock className={styles.icon} />
                    Time in Position:
                  </dt>
                  <dd className={styles.value}>{formatDuration(position.age)}</dd>
                </div>
                <div className={styles.statRow}>
                  <dt className={styles.label}>
                    <BsCurrencyDollar className={styles.icon} />
                    Fee Yield:
                  </dt>
                  <dd className={`${styles.value} ${styles[getValueClass(position.yield.usd)]}`}>
                    ${formatNumber(position.yield.usd)}
                  </dd>
                </div>
                <div className={styles.statRow}>
                  <dt className={styles.label}>
                    <BsCurrencyDollar className={styles.icon} />
                    Compounded:
                  </dt>
                  <dd className={`${styles.value} ${styles[getValueClass(position.compounded.usd)]}`}>
                    ${formatNumber(position.compounded.usd)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className={styles.actions}>
            <button 
              onClick={handleExport} 
              aria-label={`Download ${position.pair} PnL card as PNG`}
              title="Download PnL card as PNG image"
            >
              <HiDownload className={styles.buttonIcon} />
              Download PNG
            </button>
            <button 
              onClick={handleShare} 
              aria-label={`Share ${position.pair} PnL card`}
              title="Share PnL card"
            >
              <HiShare className={styles.buttonIcon} />
              Share
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};