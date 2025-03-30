import React, { useState, useRef, useMemo } from 'react';
import styles from './ClusterBar.module.scss';
import { TooltipPortal } from '../common/TooltipPortal';

/**
 * Renders a segmented bar representing the composition of a value (e.g., collateral, debt, interest).
 * Shows a tooltip on hover with detailed breakdown.
 *
 * @param {object} props - The component props.
 * @param {number} props.size - The total absolute size/value represented by the bar.
 * @param {{usd: number}} props.collateral - Object containing the collateral value.
 * @param {{usd: number}} props.debt - Object containing the debt value.
 * @param {{usd: number}} props.interest - Object containing the interest value.
 * @param {function(number): string} props.formatValue - Function to format currency values.
 */
export const ClusterBar = ({ 
  size = 0, // Default prop
  collateral = { usd: 0 }, // Default prop
  debt = { usd: 0 }, // Default prop
  interest = { usd: 0 }, // Default prop
  formatValue = (val) => val.toLocaleString() // Default prop
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);
  
  // Memoize calculations
  const { 
    total, 
    collateralPercentage, 
    debtPercentage, 
    interestPercentage 
  } = useMemo(() => {
    const totalSize = Math.abs(size);
    const collUsd = Math.abs(collateral?.usd ?? 0);
    const debtUsd = Math.abs(debt?.usd ?? 0);
    const intUsd = Math.abs(interest?.usd ?? 0);

    // Prevent division by zero
    if (totalSize === 0) {
      return { total: 0, collateralPercentage: 0, debtPercentage: 0, interestPercentage: 0 };
    }

    // Calculate percentages
    const collPerc = (collUsd / totalSize) * 100;
    const debtPerc = (debtUsd / totalSize) * 100;
    const intPerc = (intUsd / totalSize) * 100;
    
    return {
      total: totalSize,
      collateralPercentage: collPerc,
      debtPercentage: debtPerc,
      interestPercentage: intPerc,
    };
  }, [size, collateral, debt, interest]);

  // Memoize tooltip content
  const tooltipContent = useMemo(() => (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Total Size:</span>
        <span className={styles.tooltipValue}>{formatValue(size)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Collateral:</span>
        <span className={styles.tooltipValue}>{formatValue(collateral?.usd ?? 0)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Debt:</span>
        <span className={styles.tooltipValue}>{formatValue(debt?.usd ?? 0)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Interest:</span>
        <span className={styles.tooltipValue}>{formatValue(interest?.usd ?? 0)}</span>
      </div>
    </div>
  ), [size, collateral, debt, interest, formatValue]); // Include formatValue in deps

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
      <div className={styles.totalValue}>{formatValue(size)}</div>
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
