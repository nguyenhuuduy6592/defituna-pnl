import React from 'react';
import PropTypes from 'prop-types';
import styles from '@/styles/PoolMetrics.module.scss';
import EnhancedTooltip from '@/components/common/EnhancedTooltip';
import InfoIcon from '@/components/common/InfoIcon';
import { formatNumber } from '@/utils/formatters';
import { usePoolData } from '@/hooks/usePoolData';
import classNames from 'classnames';
import { 
  getFeeAPRTooltip, 
  getVolumeTVLTooltip, 
  getVolatilityTooltip,
  getTVLTooltip,
  getVolumeTooltip,
  getYieldTooltip,
  getFeeRateTooltip,
} from '@/utils/tooltipContent';

const MetricDisplay = ({ label, value, tooltipContent, className, prefix = '', suffix = '', textColor = '' }) => {
  return (
    <div className={classNames(styles.metricContainer, className)}>
      <div className={styles.metricLabel}>
        {label}
        {tooltipContent && (
          <EnhancedTooltip title={label} content={tooltipContent}>
            <InfoIcon size="small" />
          </EnhancedTooltip>
        )}
      </div>
      <div className={classNames(styles.metricValue, textColor ? styles[textColor] : '')}>
        {prefix}{value}{suffix}
      </div>
    </div>
  );
};

MetricDisplay.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tooltipContent: PropTypes.string,
  className: PropTypes.string,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  textColor: PropTypes.string
};

const PoolMetrics = ({ poolId, timeframe, className }) => {
  const { loading, error, data } = usePoolData(poolId, timeframe);

  if (loading) return <div className={styles.loading}>Loading pool data...</div>;
  if (error) return <div className={styles.error}>Error loading pool data</div>;
  if (!data) return null;

  // Format data for display
  const formattedData = {
    tvl: formatNumber(data.tvl, 'currency'),
    volume: formatNumber(data.volume, 'currency'),
    yield: formatNumber(data.yield, 'percentage', 2),
    fee: formatNumber(data.fee, 'percentage', 2),
    feeAPR: formatNumber(data.feeAPR, 'percentage', 2),
    volumeTVL: formatNumber(data.volumeTVL, 'number', 2),
    volatility: data.volatility || 'N/A'
  };

  return (
    <div className={classNames(styles.metricsContainer, className)}>
      <MetricDisplay 
        label="TVL" 
        value={formattedData.tvl} 
        tooltipContent={getTVLTooltip(formattedData.tvl)}
      />
      <MetricDisplay 
        label="Volume" 
        value={formattedData.volume} 
        tooltipContent={getVolumeTooltip(timeframe)}
      />
      <MetricDisplay 
        label="Yield" 
        value={formattedData.yield} 
        tooltipContent={getYieldTooltip(timeframe)}
      />
      <MetricDisplay 
        label="Fee" 
        value={formattedData.fee} 
        tooltipContent={getFeeRateTooltip()}
      />
      <MetricDisplay 
        label="Fee APR" 
        value={formattedData.feeAPR} 
        tooltipContent={getFeeAPRTooltip(data.feeAPR)}
      />
      <MetricDisplay 
        label="Volume/TVL" 
        value={formattedData.volumeTVL} 
        tooltipContent={getVolumeTVLTooltip(data.volumeTVL)}
      />
      <MetricDisplay 
        label="Volatility" 
        value={formattedData.volatility}
        tooltipContent={getVolatilityTooltip(data.volatility)}
        textColor={
          data.volatility === 'High' ? 'textDanger' : 
          data.volatility === 'Medium' ? 'textWarning' : 
          data.volatility === 'Low' ? 'textSuccess' : ''
        }
      />
    </div>
  );
};

PoolMetrics.propTypes = {
  poolId: PropTypes.string.isRequired,
  timeframe: PropTypes.string,
  className: PropTypes.string
};

PoolMetrics.defaultProps = {
  timeframe: '24h'
};

export default PoolMetrics; 