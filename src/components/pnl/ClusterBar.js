import React, { useState, useRef, useMemo, useCallback } from 'react';
import styles from './ClusterBar.module.scss';
import { TooltipPortal } from '../common/TooltipPortal';

/**
 * Renders a bar segment with a specific width
 */
const BarSegment = ({ percentage, index, label }) => (
  <div 
    className={`${styles.barSegment} ${styles[`segment${index}`]}`}
    style={{ width: `${percentage}%` }}
    aria-label={`${label}: ${percentage.toFixed(1)}%`}
  />
);

/**
 * Renders a tooltip row with label and value
 */
const TooltipRow = ({ label, value, formatValue }) => (
  <div className={styles.tooltipRow}>
    <span className={styles.tooltipLabel}>{label}:</span>
    <span className={styles.tooltipValue}>{formatValue(value)}</span>
  </div>
);

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
  size = 0,
  collateral = { usd: 0 },
  debt = { usd: 0 },
  interest = { usd: 0 },
  formatValue = (val) => val.toLocaleString()
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);
  
  // Memoize calculations for composition percentages
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

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Memoize segment data
  const segments = useMemo(() => [
    { percentage: collateralPercentage, label: 'Collateral' },
    { percentage: debtPercentage, label: 'Debt' },
    { percentage: interestPercentage, label: 'Interest' }
  ], [collateralPercentage, debtPercentage, interestPercentage]);
  
  // Memoize tooltip data
  const tooltipData = useMemo(() => [
    { label: 'Total Size', value: size },
    { label: 'Collateral', value: collateral?.usd ?? 0 },
    { label: 'Debt', value: debt?.usd ?? 0 },
    { label: 'Interest', value: interest?.usd ?? 0 }
  ], [size, collateral, debt, interest]);

  // Memoize tooltip content
  const tooltipContent = useMemo(() => (
    <div className={styles.tooltipContent}>
      {tooltipData.map((item, index) => (
        <TooltipRow 
          key={index}
          label={item.label}
          value={item.value}
          formatValue={formatValue}
        />
      ))}
    </div>
  ), [tooltipData, formatValue]);

  return (
    <div 
      className={styles.clusterBarContainer}
      aria-label="Position composition breakdown"
    >
      <div 
        className={styles.barContainer}
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {segments.map((segment, index) => (
          <BarSegment 
            key={index}
            percentage={segment.percentage}
            index={index}
            label={segment.label}
          />
        ))}
      </div>
      <div className={styles.totalValue} aria-label={`Total: ${formatValue(size)}`}>
        ${formatValue(size)}
      </div>
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
