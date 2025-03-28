import { useRef, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { HiDownload, HiShare } from 'react-icons/hi';
import { BsCurrencyDollar, BsClock } from 'react-icons/bs';
import { Portal } from '../common/Portal';
import html2canvas from 'html2canvas';
import styles from './PnLCard.module.scss';

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

  const getValueClass = (value) => {
    if (value > 0) return styles.positive;
    if (value < 0) return styles.negative;
    return styles.zero;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0.00';
    if (Math.abs(num) < 0.01 && num !== 0) {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      });
    }
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleExport = async () => {
    try {
      const canvas = await html2canvas(exportContentRef.current);
      const link = document.createElement('a');
      link.download = `${position.pair}-pnl-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting card:', error);
    }
  };

  const handleShare = async () => {
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#1a1a1a'
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      const file = new File([blob], `${position.pair}-pnl.png`, { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `${position.pair} PnL Card`,
          text: `Check out my ${position.pair} position on DeFiTuna!`
        });
      }
    } catch (error) {
      console.error('Error sharing card:', error);
    }
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
            <h2 id="modal-title">Position Details</h2>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              ref={closeButtonRef}
              aria-label="Close"
              title="Close"
            >
              <HiX className={styles.closeIcon} size={16} />
            </button>
          </div>

          <div className={styles.cardContent} ref={exportContentRef}>
            <h3 className={styles.pairTitle}>{position.pair}</h3>
            
            <div className={styles.mainInfo}>
              <div 
                className={`${styles.pnl} ${getValueClass(position.pnl)}`}
                role="status"
                aria-live="polite"
              >
                <span className={styles.label}>PnL</span>
                <span className={styles.value}>
                  <BsCurrencyDollar className={styles.currencyIcon} />
                  {formatNumber(position.pnl)}
                </span>
              </div>
              
              <dl className={styles.stats}>
                <div className={styles.statRow}>
                  <dt className={styles.label}>
                    <BsClock className={styles.icon} />
                    Time in Position:
                  </dt>
                  <dd className={styles.value}>{position.age}</dd>
                </div>
                <div className={styles.statRow}>
                  <dt className={styles.label}>
                    <BsCurrencyDollar className={styles.icon} />
                    Fee Yield:
                  </dt>
                  <dd className={`${styles.value} ${getValueClass(position.yield)}`}>
                    ${formatNumber(position.yield)}
                  </dd>
                </div>
                <div className={styles.statRow}>
                  <dt className={styles.label}>
                    <BsCurrencyDollar className={styles.icon} />
                    Compounded:
                  </dt>
                  <dd className={`${styles.value} ${getValueClass(position.compounded)}`}>
                    ${formatNumber(position.compounded)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={handleExport} aria-label={`Download ${position.pair} PnL card as PNG`}>
              <HiDownload className={styles.buttonIcon} />
              Download PNG
            </button>
            <button onClick={handleShare} aria-label={`Share ${position.pair} PnL card`}>
              <HiShare className={styles.buttonIcon} />
              Share
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};