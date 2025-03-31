import React from 'react';
import Link from 'next/link';
import styles from '../../styles/PoolCard.module.scss';
import { formatNumber, formatWalletAddress, formatPercentage, formatFee } from '../../utils/formatters';
import { usePoolData } from '../../hooks/usePoolData';
import CompareButton from './CompareButton';
import InfoIcon from '../common/InfoIcon';
import { 
  getFeeAPRTooltip, 
  getVolumeTVLTooltip, 
  getTVLTooltip,
  getVolumeTooltip,
  getYieldTooltip,
  getFeeRateTooltip 
} from '../../utils/tooltipContent';

/**
 * Pool Card Component
 * @param {Object} props - Component props
 * @param {Object} props.pool - Pool data object
 * @param {string} props.timeframe - Timeframe for stats ('24h', '7d', '30d')
 * @param {Object} props.sortBy - Current sort field
 * @param {string} props.sortOrder - Current sort order ('asc' or 'desc')
 */
export default function PoolCard({ pool, timeframe = '24h', sortBy, sortOrder }) {
  if (!pool) return null;
  
  // Get derived metrics for the pool
  const { feeAPR, volumeTVLRatio, loading: metricsLoading } = usePoolData(pool.address, timeframe);
  
  // Extract stats for the selected timeframe
  const stats = pool.stats?.[timeframe] || {};
  
  // Format values for display
  const formattedTVL = '$' + formatNumber(pool.tvl_usdc, true);
  const formattedVolume = '$' + formatNumber(stats.volume || 0, true);
  const formattedFees = formatFee(stats.fees || 0);
  const formattedYield = formatPercentage(stats.yield_over_tvl || 0);
  const formattedFeeRate = formatPercentage(pool.fee_rate / 10000);
  
  // Format derived metrics
  const formattedFeeAPR = metricsLoading ? '...' : `${feeAPR.toFixed(2)}%`;
  const formattedVolumeTVL = metricsLoading ? '...' : volumeTVLRatio.toFixed(2);
  
  // Get token symbols from metadata if available, or fallback to address placeholders
  const tokenASymbol = pool.tokenA?.symbol || formatWalletAddress(pool.token_a_mint);
  const tokenBSymbol = pool.tokenB?.symbol || formatWalletAddress(pool.token_b_mint);
  
  // Format price if available
  const formattedPrice = pool.currentPrice 
    ? Number(pool.currentPrice) > 0 
      ? `1 ${tokenASymbol} = ${formatNumber(pool.currentPrice)} ${tokenBSymbol}`
      : `Price unavailable`
    : '';

  // Get sort indicator classes
  const getSortIndicatorClass = (field) => {
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc;
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardWrapper}>
        <Link href={`/pools/${pool.address}`} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.tokenPair}>
              <span className={styles.tokenSymbol}>{tokenASymbol}</span>
              <span className={styles.separator}>/</span>
              <span className={styles.tokenSymbol}>{tokenBSymbol}</span>
            </div>
            <div className={styles.price}>{formattedPrice}</div>
          </div>

          <div className={styles.metrics}>
            <div className={`${styles.metric} ${getSortIndicatorClass('tvl')}`}>
              <div className={styles.metricLabel}>
                TVL
                <InfoIcon content={getTVLTooltip(formattedTVL)} position="top" />
              </div>
              <div className={styles.metricValue}>{formattedTVL}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass(`volume${timeframe}`)}`}>
              <div className={styles.metricLabel}>
                Volume
                <InfoIcon content={getVolumeTooltip(timeframe)} position="top" />
              </div>
              <div className={styles.metricValue}>{formattedVolume}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass(`yield_over_tvl${timeframe}`)}`}>
              <div className={styles.metricLabel}>
                Yield
                <InfoIcon content={getYieldTooltip(timeframe)} position="top" />
              </div>
              <div className={styles.metricValue}>{formattedYield}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass('fee')}`}>
              <div className={styles.metricLabel}>
                Fee
                <InfoIcon content={getFeeRateTooltip()} position="top" />
              </div>
              <div className={styles.metricValue}>{formattedFeeRate}</div>
            </div>
            
            {/* Add derived metrics */}
            <div className={styles.metric}>
              <div className={styles.metricLabel}>
                Fee APR
                <InfoIcon content={getFeeAPRTooltip(feeAPR)} position="top" />
              </div>
              <div className={styles.metricValue}>{formattedFeeAPR}</div>
            </div>
            
            <div className={styles.metric}>
              <div className={styles.metricLabel}>
                Volume/TVL
                <InfoIcon content={getVolumeTVLTooltip(volumeTVLRatio)} position="top" />
              </div>
              <div className={styles.metricValue}>{formattedVolumeTVL}</div>
            </div>
          </div>
        </Link>
        
        <div className={styles.cardActions}>
          <CompareButton pool={pool} />
        </div>
      </div>
    </div>
  );
} 