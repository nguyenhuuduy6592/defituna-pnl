import React, { useState, useRef, useMemo, useCallback } from 'react';
import styles from './ClusterBar.module.scss';
import { TooltipPortal } from '../common/TooltipPortal';
import { formatNumber } from '../../utils';

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
 * Renders a tooltip row with label and value, using the new display formatter
 */
const TooltipRow = ({ label, value, formatDisplayValue }) => (
  <div className={styles.tooltipRow}>
    <span className={styles.tooltipLabel}>{label}:</span>
    <span className={styles.tooltipValue}>{formatDisplayValue(value)}</span>
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
 * @param {function(number): string} props.formatValue - Function to format USD currency values (e.g., adding commas).
 * @param {boolean} props.showInSol - Whether to display values in SOL.
 * @param {number | null} props.solPrice - The current price of SOL in USD.
 */
export const ClusterBar = ({
  size = 0,
  collateral = { usd: 0 },
  debt = { usd: 0 },
  interest = { usd: 0 },
  formatValue = (val) => val.toLocaleString(),
  showInSol = false,
  solPrice = null,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);

  // Internal formatting function based on currency preference
  const formatDisplayValue = useCallback(
    (usdValue) => {
      if (usdValue === null) {
        return showInSol ? 'N/A SOL' : 'N/A USD';
      }
      if (showInSol) {
        if (usdValue === 0) {
          return `${formatNumber(0)} SOL`;
        }
        if (solPrice !== null && solPrice > 0) {
          const solAmount = usdValue / solPrice;
          return `${formatNumber(solAmount)} SOL`;
        }
        return 'N/A SOL';
      } else {
        return `$${formatValue(usdValue, false)}`;
      }
    },
    [showInSol, solPrice, formatValue]
  );

  // Memoize calculations for composition percentages
  const { total, collateralPercentage, debtPercentage, interestPercentage } =
    useMemo(() => {
      const totalSize = Math.abs(size);
      const collUsd = Math.abs(collateral?.usd ?? 0);
      const debtUsd = Math.abs(debt?.usd ?? 0);
      const intUsd = Math.abs(interest?.usd ?? 0);

      // Prevent division by zero
      if (totalSize === 0) {
        return {
          total: 0,
          collateralPercentage: 0,
          debtPercentage: 0,
          interestPercentage: 0,
        };
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
  const segments = useMemo(
    () => [
      { percentage: collateralPercentage, label: 'Collateral' },
      { percentage: debtPercentage, label: 'Debt' },
      { percentage: interestPercentage, label: 'Interest' },
    ],
    [collateralPercentage, debtPercentage, interestPercentage]
  );

  // Tooltip data now just holds the USD values; formatting happens in TooltipRow
  const tooltipData = useMemo(
    () => [
      { label: 'Total Size', value: size },
      { label: 'Collateral', value: collateral?.usd ?? 0 },
      { label: 'Debt', value: debt?.usd ?? 0 },
      { label: 'Interest', value: interest?.usd ?? 0 },
    ],
    [size, collateral, debt, interest]
  );

  // Tooltip content now passes formatDisplayValue to TooltipRow
  const tooltipContent = useMemo(
    () => (
      <div className={styles.tooltipContent}>
        {tooltipData.map((item, index) => (
          <TooltipRow
            key={index}
            label={item.label}
            value={item.value}
            formatDisplayValue={formatDisplayValue}
          />
        ))}
      </div>
    ),
    [tooltipData, formatDisplayValue]
  );

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
      <div
        className={styles.totalValue}
        aria-label={`Total: ${formatDisplayValue(size)}`}
      >
        {formatDisplayValue(size)}
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
