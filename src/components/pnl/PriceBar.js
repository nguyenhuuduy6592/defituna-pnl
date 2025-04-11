import React, { useState, useRef, useMemo, useCallback } from 'react';
import styles from '@/styles/PriceBar.module.scss';
import { TooltipPortal } from '@/components/common/TooltipPortal';

/**
 * Renders a price point marker on the price bar
 */
const PriceMarker = ({ point, position }) => (
  <div
    className={`${styles.pricePoint} ${styles[point.shape]}`}
    style={{
      left: `${position}%`,
      backgroundColor: point.color
    }}
    aria-label={`${point.label}: ${point.value}`}
  />
);

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
 * A visual price bar component showing current price, entry price and other important price levels
 * 
 * @param {Object} props Component props
 * @param {number} props.currentPrice Current market price
 * @param {number} props.entryPrice Position entry price
 * @param {Object} props.liquidationPrice Liquidation price upper and lower bounds
 * @param {Object} props.rangePrices Price range upper and lower bounds
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

  // Collect and process all price points
  const { pricePoints, minPrice, maxPrice, range } = useMemo(() => {
    // Define all possible price points
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
    
    // Calculate price range
    const min = Math.min(...validPoints.map(p => p.value));
    const max = Math.max(...validPoints.map(p => p.value));
    
    return {
      pricePoints: validPoints,
      minPrice: min,
      maxPrice: max,
      range: max - min
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

  // Calculate position as percentage
  const getPosition = useCallback((price) => {
    return ((price - minPrice) / range) * 100;
  }, [minPrice, range]);

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Create tooltip content
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

  return (
    <div 
      ref={containerRef}
      className={styles.priceBarContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Price bar showing current, entry, and key price levels"
    >
      <div className={styles.barContainer}>
        {pricePoints.map((point, index) => (
          <PriceMarker
            key={index}
            point={point}
            position={getPosition(point.value)}
          />
        ))}
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