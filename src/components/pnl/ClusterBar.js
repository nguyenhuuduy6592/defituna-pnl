import React, { useState, useRef } from 'react';
import styles from './ClusterBar.module.scss';
import { TooltipPortal } from '../TooltipPortal';

export const ClusterBar = ({ size, collateral, debt, interest, formatValue }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);
  
  const total = Math.abs(size);
  const collateralPercentage = (Math.abs(collateral.usd) / total) * 100;
  const debtPercentage = (Math.abs(debt.usd) / total) * 100;
  const interestPercentage = (Math.abs(interest.usd) / total) * 100;

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Total Size:</span>
        <span className={styles.tooltipValue}>${formatValue(size)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Collateral:</span>
        <span className={styles.tooltipValue}>${formatValue(collateral.usd)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Debt:</span>
        <span className={styles.tooltipValue}>${formatValue(debt.usd)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Interest:</span>
        <span className={styles.tooltipValue}>${formatValue(interest.usd)}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.clusterBarContainer}>
      <div className={styles.barContainer}
          ref={containerRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}>
        <div 
          className={styles.barSegment}
          style={{ width: `${collateralPercentage}%` }}
        />
        <div 
          className={styles.barSegment}
          style={{ width: `${debtPercentage}%` }}
        />
        <div 
          className={styles.barSegment}
          style={{ width: `${interestPercentage}%` }}
        />
      </div>
      <div className={styles.totalValue}>${formatValue(size)}</div>
      {showTooltip && containerRef.current && (
        <TooltipPortal
          targetRef={containerRef}
          show={showTooltip}
          position="top"
        >
          {tooltipContent}
        </TooltipPortal>
      )}
    </div>
  );
}; 
