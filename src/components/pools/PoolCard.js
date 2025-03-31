import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/PoolCard.module.scss';

/**
 * Formats large numbers for display with appropriate suffixes
 * @param {number} num - Number to format
 * @param {number} digits - Number of digits after decimal point
 * @returns {string} Formatted number
 */
function formatNumber(num, digits = 2) {
  const absNum = Math.abs(Number(num));
  if (isNaN(absNum)) return "N/A";
  
  if (absNum >= 1e9) return (absNum / 1e9).toFixed(digits) + 'B';
  if (absNum >= 1e6) return (absNum / 1e6).toFixed(digits) + 'M';
  if (absNum >= 1e3) return (absNum / 1e3).toFixed(digits) + 'K';
  return absNum.toFixed(digits);
}

/**
 * Formats percentage values
 * @param {number} value - Percentage value in decimal form
 * @returns {string} Formatted percentage
 */
function formatPercentage(value) {
  const percentValue = Number(value) * 100;
  if (isNaN(percentValue)) return "N/A";
  
  return percentValue.toFixed(2) + '%';
}

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
  const formattedTVL = '$' + formatNumber(pool.tvl_usdc);
  const formattedVolume = '$' + formatNumber(stats.volume || 0);
  const formattedFees = '$' + formatNumber(stats.fees || 0);
  
  // Get the actual yield value and formatted string
  const yieldValue = (stats.yield_over_tvl || 0) * 100;
  const formattedYield = yieldValue.toFixed(2) + '%';
  
  const formattedFeeRate = (pool.fee_rate / 10000).toFixed(2) + '%'; // Convert basis points to percentage
  
  // Get token symbols from metadata if available, or fallback to address placeholders
  const tokenASymbol = pool.tokenA ? pool.tokenA.symbol : pool.token_a_mint.slice(0, 4) + '...' + pool.token_a_mint.slice(-4);
  const tokenBSymbol = pool.tokenB ? pool.tokenB.symbol : pool.token_b_mint.slice(0, 4) + '...' + pool.token_b_mint.slice(-4);
  
  // Get token logos if available
  const tokenALogo = pool.tokenA?.logoURI;
  const tokenBLogo = pool.tokenB?.logoURI;
  
  // Determine yield class based on value
  const getYieldClass = (value) => {
    if (value > 20) return styles.positive;
    if (value > 10) return styles.neutral;
    if (value < 5) return styles.negative;
    return '';
  };
  
  // Format price if available
  const formattedPrice = pool.currentPrice 
    ? pool.currentPrice > 0.01 
      ? `1 ${tokenASymbol} = ${pool.currentPrice.toFixed(2)} ${tokenBSymbol}`
      : `1 ${tokenBSymbol} = ${(1/pool.currentPrice).toFixed(2)} ${tokenASymbol}`
    : '';
  
  return (
    <Link href={`/pools/${pool.address}`} className={styles.cardLink}>
      <div className={styles.poolCard}>
        <div className={styles.poolHeader}>
          <div className={styles.tokenPair}>
            <div className={styles.tokenInfo}>
              {tokenALogo && (
                <div className={styles.tokenLogo}>
                  <Image 
                    src={tokenALogo} 
                    alt={tokenASymbol} 
                    width={20} 
                    height={20} 
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
              <span className={styles.tokenSymbol}>{tokenASymbol}</span>
            </div>
            <span className={styles.separator}>/</span>
            <div className={styles.tokenInfo}>
              {tokenBLogo && (
                <div className={styles.tokenLogo}>
                  <Image 
                    src={tokenBLogo} 
                    alt={tokenBSymbol} 
                    width={20} 
                    height={20}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
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