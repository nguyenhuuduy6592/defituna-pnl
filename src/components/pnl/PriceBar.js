import React, { useState, useRef } from 'react';
import styles from './PriceBar.module.scss';
import { TooltipPortal } from '../common/TooltipPortal';

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

  // Collect all price points and sort them
  const pricePoints = [
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
  ].filter(point => point.value !== Infinity && point.value !== null && point.value !== 0)
   .sort((a, b) => b.value - a.value);

  // Find min and max for scaling
  const minPrice = Math.min(...pricePoints.map(p => p.value));
  const maxPrice = Math.max(...pricePoints.map(p => p.value));
  const range = maxPrice - minPrice;

  // Calculate positions as percentages
  const getPosition = (price) => {
    return ((price - minPrice) / range) * 100;
  };

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      {pricePoints.map((point, index) => (
        <div key={index} className={styles.tooltipRow}>
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
      ))}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={styles.priceBarContainer}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={styles.barContainer}>
        {pricePoints.map((point, index) => (
          <div
            key={index}
            className={`${styles.pricePoint} ${styles[point.shape]}`}
            style={{
              left: `${getPosition(point.value)}%`,
              backgroundColor: point.color
            }}
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