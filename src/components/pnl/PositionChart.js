import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Portal } from '../common/Portal';
import { Tooltip } from '../common/Tooltip';
import { BsInfoCircle } from 'react-icons/bs';
import { prepareChartData, groupChartData } from '../../utils/chart';
import { formatNumber } from '../../utils/formatters';
import { TIME_PERIODS } from '../../utils/constants';
import styles from './PositionChart.module.scss';

export const PositionChart = ({ positionHistory, onClose }) => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState(TIME_PERIODS.MINUTE_5.value);
  const [metrics, setMetrics] = useState({
    pnl: true,
    yield: true
  });

  useEffect(() => {
    if (positionHistory?.length > 0) {
      try {
        const chartData = prepareChartData(positionHistory);
        const groupedData = groupChartData(chartData, period);
        
        // Enhanced validation
        const validData = groupedData.filter(item => {
          const hasValidTimestamp = item && 
            typeof item.timestamp === 'number' && 
            !isNaN(item.timestamp);
            
          const hasNonZeroValues = 
            Math.abs(item.pnl) > 0 ||
            Math.abs(item.yield) > 0;
            
          return hasValidTimestamp && hasNonZeroValues;
        });
        
        setData(validData);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setData([]);
      }
    } else {
      setData([]);
    }
  }, [positionHistory, period]);

  const formatXAxisLabel = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    try {
      // Check if we have data spanning different calendar dates
      const startDate = new Date(data[0]?.timestamp);
      const endDate = new Date(data[data.length - 1]?.timestamp);
      const isDifferentDates = startDate && endDate && 
        (startDate.getDate() !== endDate.getDate() ||
         startDate.getMonth() !== endDate.getMonth() ||
         startDate.getFullYear() !== endDate.getFullYear());

      if (isDifferentDates) {
        switch(period) {
          case TIME_PERIODS.MINUTE_1.value:
          case TIME_PERIODS.MINUTE_5.value:
          case TIME_PERIODS.MINUTE_15.value:
          case TIME_PERIODS.MINUTE_30.value:
          case TIME_PERIODS.HOUR_1.value:
          case TIME_PERIODS.HOUR_4.value:
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                   date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          case TIME_PERIODS.DAY_1.value:
          case TIME_PERIODS.WEEK_1.value:
          case TIME_PERIODS.MONTH_1.value:
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          default:
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
                   date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } else {
        // For same-day data, use original formatting
        switch(period) {
          case TIME_PERIODS.MINUTE_1.value:
          case TIME_PERIODS.MINUTE_5.value:
          case TIME_PERIODS.MINUTE_15.value:
          case TIME_PERIODS.MINUTE_30.value:
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          case TIME_PERIODS.HOUR_1.value:
          case TIME_PERIODS.HOUR_4.value:
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          case TIME_PERIODS.DAY_1.value:
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
          case TIME_PERIODS.WEEK_1.value:
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          case TIME_PERIODS.MONTH_1.value:
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          default:
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleMetricToggle = (metric) => {
    setMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{formatXAxisLabel(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const getYAxisTicks = (data) => {
    if (!data || data.length === 0) return [];

    // Get min and max values across all active metrics
    const values = [];
    data.forEach(item => {
      if (metrics.pnl) values.push(item.pnl);
      if (metrics.yield) values.push(item.yield);
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add some padding
    const padding = (max - min) * 0.1;
    const effectiveMin = min - padding;
    const effectiveMax = max + padding;
    
    // Generate 8 evenly spaced ticks
    const ticks = [];
    for (let i = 0; i <= 8; i++) {
      ticks.push(effectiveMin + ((effectiveMax - effectiveMin) * i) / 8);
    }
    return ticks;
  };

  return (
    <Portal>
      <div className={styles.chartOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={styles.chartContainer} onClick={e => e.stopPropagation()}>
          <div className={styles.chartHeader}>
            <h3 className={styles.title}>
              Position History
              <Tooltip content={`
• Shows how your position value changes over time
• Historical data is stored locally in your browser
• Data is collected and saved each time data is refreshed
• Limited to 30 days of history
• Enable "Store History" to collect data
              `}>
                <span className={styles.infoIcon}>
                  <BsInfoCircle />
                </span>
              </Tooltip>
            </h3>
            <div className={styles.controls}>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={styles.periodSelect}
                aria-label="Select time period"
                title="Select time period for chart data"
              >
                {Object.entries(TIME_PERIODS).map(([key, { value, label }]) => (
                  <option key={key} value={value}>{label}</option>
                ))}
              </select>
              <button 
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close chart"
                title="Close chart view"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={styles.chartContent}>
            {data.length === 0 ? (
              <div className={styles.noData}>
                No data available for the selected time period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{
                    top: 10,
                    right: 10,
                    bottom: 20,
                    left: 50
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxisLabel}
                    interval="preserveStartEnd"
                    minTickGap={40}
                    tick={{ fontSize: 11 }}
                    height={30}
                  />
                  <YAxis
                    tickFormatter={formatNumber}
                    ticks={getYAxisTicks(data)}
                    tick={{ fontSize: 11 }}
                    width={50}
                    tickCount={8}
                    domain={['auto', 'auto']}
                  />
                  <ReferenceLine y={0} stroke="#4dabf7" strokeWidth={1} />
                  <RechartsTooltip 
                    content={<CustomTooltip />}
                    isAnimationActive={false}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={24}
                    onClick={handleMetricToggle}
                    wrapperStyle={{
                      paddingTop: '5px',
                      fontSize: '11px'
                    }}
                  />
                  {metrics.pnl && (
                    <Line
                      type="monotone"
                      dataKey="pnl"
                      stroke="#8884d8"
                      name="PnL"
                      dot={false}
                      activeDot={{ r: 3 }}
                      isAnimationActive={false}
                      connectNulls
                      strokeWidth={1.5}
                    />
                  )}
                  {metrics.yield && (
                    <Line
                      type="monotone"
                      dataKey="yield"
                      stroke="#82ca9d"
                      name="Yield"
                      dot={false}
                      activeDot={{ r: 3 }}
                      isAnimationActive={false}
                      connectNulls
                      strokeWidth={1.5}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};