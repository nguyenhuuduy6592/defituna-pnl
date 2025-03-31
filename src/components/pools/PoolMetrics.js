import { memo } from 'react';
import { BsInfoCircle } from 'react-icons/bs';
import { Tooltip } from '../common/Tooltip';
import { usePoolData } from '../../hooks/usePoolData';
import styles from './PoolMetrics.module.scss';

/**
 * Metric display component with tooltip
 */
const MetricDisplay = memo(({ label, value, tooltip, className }) => (
  <div className={`${styles.metric} ${className || ''}`}>
    <div className={styles.metricHeader}>
      <span className={styles.label}>{label}</span>
      <Tooltip content={tooltip} position="top-center">
        <span className={styles.infoIcon}>
          <BsInfoCircle />
        </span>
      </Tooltip>
    </div>
    <div className={styles.value}>{value}</div>
  </div>
));

MetricDisplay.displayName = 'MetricDisplay';

/**
 * Component for displaying pool metrics with visual indicators
 * @param {Object} props Component props
 * @param {string} props.poolAddress The address of the pool
 * @param {string} props.timeframe The timeframe for metrics ('24h', '7d', '30d')
 */
export const PoolMetrics = memo(({ poolAddress, timeframe = '24h' }) => {
  const {
    loading,
    error,
    feeAPR,
    volumeTVLRatio,
    volatility
  } = usePoolData(poolAddress, timeframe);

  if (loading) {
    return <div className={styles.loading}>Loading metrics...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading metrics: {error}</div>;
  }

  // Format values
  const formattedFeeAPR = `${feeAPR.toFixed(2)}%`;
  const formattedVolumeTVL = volumeTVLRatio.toFixed(2);

  // Get volatility class for styling
  const volatilityClass = styles[`volatility${volatility.charAt(0).toUpperCase() + volatility.slice(1)}`];

  return (
    <div className={styles.metricsContainer}>
      <MetricDisplay
        label="Fee APR"
        value={formattedFeeAPR}
        tooltip="Annual Percentage Rate of fees earned by liquidity providers based on recent activity"
        className={styles.feeAPR}
      />
      
      <MetricDisplay
        label="Volume/TVL"
        value={formattedVolumeTVL}
        tooltip="Ratio of trading volume to total value locked, indicating capital efficiency"
        className={styles.volumeTVL}
      />
      
      <MetricDisplay
        label="Volatility"
        value={volatility}
        tooltip="Price volatility indicator based on recent price changes"
        className={`${styles.volatility} ${volatilityClass}`}
      />
    </div>
  );
});

PoolMetrics.displayName = 'PoolMetrics'; 