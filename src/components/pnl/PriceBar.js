import React, { useState, useRef, useMemo, useCallback } from 'react';
import styles from './PriceBar.module.scss';
import { TooltipPortal } from '../common/TooltipPortal';

/**
 * Renders a row in the tooltip showing price information
 */
const TooltipRow = ({ point, formatValue }) => (
  <div className={styles.tooltipRow}>
    <span className={styles.tooltipLabel}>
      <span 
        className={`${styles.priceShape} ${styles[point.shape]}`} 
        style={{ backgroundColor: point.color }}
      />
      {point.label}:
    </span>
    <span className={styles.tooltipValue}>
      ${formatValue(point.value)}
    </span>
  </div>
);

/**
 * A visual price bar component showing current price within a specified range.
 * 
 * @param {Object} props Component props
 * @param {number} props.currentPrice Current market price
 * @param {number} props.entryPrice Position entry price
 * @param {Object} props.liquidationPrice Liquidation price upper and lower bounds
 * @param {Object} props.rangePrices Price range upper and lower bounds { lower: number, upper: number }
 * @param {Object} props.limitOrderPrices Limit order upper and lower prices
 * @param {Function} props.formatValue Function to format price values for display
 */
export const PriceBar = ({ 
  currentPrice,
  entryPrice,
  liquidationPrice,
  rangePrices,
  limitOrderPrices,
  formatValue
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef(null);

  // Process all price points for tooltip and calculate display info
  const { pricePoints, minPrice, maxPrice, range, currentPricePoint } = useMemo(() => {
    // Define all possible price points for tooltip
    const allPoints = [
      { 
        value: liquidationPrice.lower, 
        label: 'Liq. Lower', 
        color: '#FF2D55',
        shape: 'triangle-up'
      },
      { 
        value: liquidationPrice.upper, 
        label: 'Liq. Upper', 
        color: '#FF2D55',
        shape: 'triangle-down'
      },
      { 
        value: entryPrice, 
        label: 'Entry', 
        color: '#007AFF',
        shape: 'diamond'
      },
      { 
        value: currentPrice, 
        label: 'Current', 
        color: '#FFCC00',
        shape: 'circle'
      },
      { 
        value: rangePrices.lower, 
        label: 'Range Lower', 
        color: '#34C759',
        shape: 'square'
      },
      { 
        value: rangePrices.upper, 
        label: 'Range Upper', 
        color: '#34C759',
        shape: 'square'
      },
      {
        value: limitOrderPrices.lower,
        label: 'Stop Loss',
        color: '#FF9500',
        shape: 'triangle-up'
      },
      {
        value: limitOrderPrices.upper,
        label: 'Take Profit',
        color: '#FF9500',
        shape: 'triangle-down'
      }
    ];
    
    // Filter out invalid price points
    const validPoints = allPoints.filter(point => (
      point.value !== Infinity && 
      point.value !== null && 
      point.value !== 0
    )).sort((a, b) => b.value - a.value);
    
    // Define overall bar min/max based on rangePrices with a padding for grace areas
    const graceAmount = (rangePrices.upper - rangePrices.lower) * 0.15; // 15% grace
    const finalMinPrice = rangePrices.lower - graceAmount;
    const finalMaxPrice = rangePrices.upper + graceAmount;
    const calculatedRange = finalMaxPrice - finalMinPrice;

    // Determine current price point color and position
    let displayCurrentPriceValue = currentPrice;
    let displayCurrentPriceColor = '#FFCC00'; // Yellow for in-range

    if (currentPrice < rangePrices.lower) {
      displayCurrentPriceValue = finalMinPrice; // Clamp to lower bound
      displayCurrentPriceColor = '#FF2D55'; // Red
    } else if (currentPrice > rangePrices.upper) {
      displayCurrentPriceValue = finalMaxPrice; // Clamp to upper bound
      displayCurrentPriceColor = '#FF2D55'; // Red
    }

    return {
      pricePoints: validPoints,
      minPrice: finalMinPrice,
      maxPrice: finalMaxPrice,
      range: calculatedRange,
      currentPricePoint: {
        value: displayCurrentPriceValue,
        originalValue: currentPrice,
        color: displayCurrentPriceColor
      }
    };
  }, [
    currentPrice, 
    entryPrice, 
    liquidationPrice.lower, 
    liquidationPrice.upper,
    rangePrices.lower,
    rangePrices.upper,
    limitOrderPrices.lower,
    limitOrderPrices.upper
  ]);

  const getPosition = useCallback((price) => {
    if (range === 0) return 50;
    return ((price - minPrice) / range) * 100;
  }, [minPrice, range]);
  
  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const tooltipContent = useMemo(() => (
    <div className={styles.tooltipContent}>
      {pricePoints.map((point, index) => (
        <TooltipRow 
          key={index} 
          point={point} 
          formatValue={formatValue} 
        />
      ))}
    </div>
  ), [pricePoints, formatValue]);

  // Calculate positions for bar segments
  const activeRangeStartPos = Math.max(0, Math.min(100, getPosition(rangePrices.lower)));
  const activeRangeEndPos = Math.max(0, Math.min(100, getPosition(rangePrices.upper)));
  const leftGraceWidth = activeRangeStartPos;
  const activeRangeWidth = activeRangeEndPos - activeRangeStartPos;
  const rightGraceWidth = 100 - activeRangeEndPos;

  return (
    <div 
      ref={containerRef}
      className={styles.priceBarContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Price range bar with current price indicator"
    >
      <div className={styles.barSegmentsContainer}>
        {/* Left Grace Segment */}
        <div
          className={`${styles.barSegment} ${styles.graceRange}`}
          style={{ left: '0%', width: `${leftGraceWidth}%` }}
        />
        {/* Active Range Segment */}
        <div
          className={`${styles.barSegment} ${styles.activeRange}`}
          style={{ left: `${leftGraceWidth}%`, width: `${activeRangeWidth}%` }}
        />
        {/* Right Grace Segment */}
        <div
          className={`${styles.barSegment} ${styles.graceRange}`}
          style={{ left: `${activeRangeStartPos + activeRangeWidth}%`, width: `${rightGraceWidth}%` }}
        />
        
        {/* Range Price Labels */}
        <div 
          className={styles.priceLabel}
          style={{ left: `${activeRangeStartPos}%` }}
        >
          ${formatValue(rangePrices.lower)}
        </div>
        <div 
          className={styles.priceLabel}
          style={{ left: `${activeRangeEndPos}%` }}
        >
          ${formatValue(rangePrices.upper)}
        </div>
        
        {/* Current Price Indicator */}
        <div
          className={styles.priceIndicator}
          style={{
            left: `${getPosition(currentPricePoint.value)}%`,
            backgroundColor: currentPricePoint.color
          }}
          aria-label={`Current price: ${currentPricePoint.originalValue}`}
        />
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