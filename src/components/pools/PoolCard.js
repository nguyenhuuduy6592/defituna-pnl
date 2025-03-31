import React from 'react';
import Link from 'next/link';
import styles from '../../styles/PoolCard.module.scss';
import { formatNumber, formatWalletAddress, formatPercentage } from '../../utils/formatters';

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
  
  // Format values for display
  const formattedTVL = '$' + formatNumber(pool.tvl_usdc, true);
  const formattedVolume = '$' + formatNumber(stats.volume || 0, true);
  const formattedFees = '$' + formatNumber(stats.fees || 0, true);
  
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
  
  // Determine yield class based on value
  const getYieldClass = (value) => {
    if (value > 20) return styles.positive;
    if (value > 10) return styles.neutral;
    if (value < 5) return styles.negative;
    return '';
  };
  
  return (
    <Link href={`/pools/${pool.address}`} className={styles.cardLink}>
      <div className={styles.poolCard}>
        <div className={styles.poolHeader}>
          <div className={styles.tokenPair}>
            <div className={styles.tokenInfo}>
              <span className={styles.tokenSymbol}>{tokenASymbol}</span>
            </div>
            <span className={styles.separator}>/</span>
            <div className={styles.tokenInfo}>
              <span className={styles.tokenSymbol}>{tokenBSymbol}</span>
            </div>
          </div>
          <div className={styles.provider}>{pool.provider}</div>
        </div>
        
        {formattedPrice && (
          <div className={styles.priceInfo}>
            {formattedPrice}
          </div>
        )}
        
        <div className={styles.poolStats}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>TVL</div>
            <div className={`${styles.statValue} ${styles.highlight}`}>{formattedTVL}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Volume ({timeframe})</div>
            <div className={styles.statValue}>{formattedVolume}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Fees ({timeframe})</div>
            <div className={styles.statValue}>{formattedFees}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Yield ({timeframe})</div>
            <div className={`${styles.statValue} ${getYieldClass(yieldValue)}`}>{formattedYield}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Fee Rate</div>
            <div className={styles.statValue}>{formattedFeeRate}</div>
          </div>
        </div>
      </div>
    </Link>
  );
} 