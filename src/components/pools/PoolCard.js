import React from 'react';
import Link from 'next/link';
import styles from '../../styles/PoolCard.module.scss';
import { formatNumber, formatWalletAddress, formatPercentage, formatFee } from '../../utils/formatters';

/**
 * Get class name for value based on its range
 * @param {number} value - The value to check
 * @param {Object} ranges - Range thresholds { low, medium, high }
 * @returns {string} CSS class name
 */
const getValueRangeClass = (value, ranges) => {
  if (!value) return '';
  if (value >= ranges.high) return styles.high;
  if (value >= ranges.medium) return styles.medium;
  if (value > 0) return styles.low;
  return '';
};

/**
 * Get class name for yield value
 * @param {number} value - The yield value in percentage
 * @returns {string} CSS class name
 */
const getYieldClass = (value) => {
  if (!value) return '';
  if (value > 20) return styles.positive;
  if (value > 10) return styles.neutral;
  if (value > 0) return styles.negative;
  return '';
};

/**
 * Get trending indicator class based on change
 * @param {number} currentValue - Current period value
 * @param {number} previousValue - Previous period value
 * @returns {string} CSS class name
 */
const getTrendingClass = (currentValue, previousValue) => {
  if (!currentValue || !previousValue) return '';
  const change = ((currentValue - previousValue) / previousValue) * 100;
  if (Math.abs(change) < 1) return styles.neutral;
  return change > 0 ? styles.up : styles.down;
};

/**
 * Pool Card Component
 * @param {Object} props - Component props
 * @param {Object} props.pool - Pool data object
 * @param {string} props.timeframe - Timeframe for stats ('24h', '7d', '30d')
 */
export default function PoolCard({ pool, timeframe = '24h' }) {
  if (!pool) return null;
  
  // Extract stats for the selected timeframe
  const stats = pool.stats?.[timeframe] || {};
  const prevTimeframe = timeframe === '24h' ? '7d' : timeframe === '7d' ? '30d' : null;
  const prevStats = prevTimeframe ? pool.stats?.[prevTimeframe] || {} : {};
  
  // Format values for display
  const formattedTVL = '$' + formatNumber(pool.tvl_usdc, true);
  const formattedVolume = '$' + formatNumber(stats.volume || 0, true);
  const formattedFees = formatFee(stats.fees || 0);
  
  // Get the actual yield value and formatted string
  const yieldValue = (stats.yield_over_tvl || 0) * 100;
  const formattedYield = formatPercentage(stats.yield_over_tvl || 0);
  
  const formattedFeeRate = formatPercentage(pool.fee_rate / 10000); // Convert basis points to percentage
  
  // Get token symbols from metadata if available, or fallback to address placeholders
  const tokenASymbol = pool.tokenA?.symbol || formatWalletAddress(pool.token_a_mint);
  const tokenBSymbol = pool.tokenB?.symbol || formatWalletAddress(pool.token_b_mint);
  
  // Format price if available
  const formattedPrice = pool.currentPrice 
    ? Number(pool.currentPrice) > 0 
      ? `1 ${tokenASymbol} = ${formatNumber(pool.currentPrice)} ${tokenBSymbol}`
      : `Price unavailable`
    : '';
  
  // Should show trend indicators?
  const showTrends = prevTimeframe !== null;

  // Get trending indicators
  const volumeTrend = showTrends ? getTrendingClass(stats.volume, prevStats.volume) : '';
  const feesTrend = showTrends ? getTrendingClass(stats.fees, prevStats.fees) : '';
  const yieldTrend = showTrends ? getTrendingClass(stats.yield_over_tvl, prevStats.yield_over_tvl) : '';

  // Define tooltips for statValues
  const volumeTooltip = showTrends 
    ? `Volume ${volumeTrend === 'up' ? 'increased' : volumeTrend === 'down' ? 'decreased' : 'changed little'} compared to ${prevTimeframe}` 
    : `Trading volume over ${timeframe}`;

  const feesTooltip = showTrends 
    ? `Fees ${feesTrend === 'up' ? 'increased' : feesTrend === 'down' ? 'decreased' : 'changed little'} compared to ${prevTimeframe}`
    : `Fees earned over ${timeframe}`;

  const yieldTooltip = showTrends 
    ? `Yield ${yieldTrend === 'up' ? 'increased' : yieldTrend === 'down' ? 'decreased' : 'changed little'} compared to ${prevTimeframe}`
    : `Annualized yield based on ${timeframe} fees as % of TVL`;

  const tvlTooltip = `Total Value Locked in the pool`;
  
  return (
    <Link href={`/pools/${pool.address}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.tokenPair}>
            <div className={styles.tokenInfo}>
              <span className={styles.tokenSymbol}>{tokenASymbol}</span>
            </div>
            <span className={styles.separator}>/</span>
            <div className={styles.tokenInfo}>
              <span className={styles.tokenSymbol}>{tokenBSymbol}</span>
            </div>
          </div>
          {formattedPrice && (
            <div className={styles.priceInfo}>
              <span className={styles.priceLabel}>Price:</span>
              <span className={styles.priceValue}>{formattedPrice}</span>
            </div>
          )}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>TVL</div>
            <div 
              className={`${styles.statValue} ${getValueRangeClass(pool.tvl_usdc, { high: 1000000, medium: 100000, low: 0 })}`}
              title={tvlTooltip}
            >
              {formattedTVL}
            </div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statLabel}>Volume</div>
            <div 
              className={`${styles.statValue} ${getValueRangeClass(stats.volume, { high: 1000000, medium: 100000, low: 0 })}`}
              title={volumeTooltip}
            >
              {formattedVolume}
              {showTrends && (
                <span className={`${styles.trendingIndicator} ${volumeTrend}`} />
              )}
            </div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statLabel}>Fees</div>
            <div 
              className={`${styles.statValue} ${getValueRangeClass(stats.fees, { high: 10000, medium: 1000, low: 0 })}`}
              title={feesTooltip}
            >
              {formattedFees}
              {showTrends && (
                <span className={`${styles.trendingIndicator} ${feesTrend}`} />
              )}
            </div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statLabel}>Yield</div>
            <div 
              className={`${styles.statValue} ${getYieldClass(yieldValue)}`}
              title={yieldTooltip}
            >
              {formattedYield}
              {showTrends && (
                <span className={`${styles.trendingIndicator} ${yieldTrend}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 