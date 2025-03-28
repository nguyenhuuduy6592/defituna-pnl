import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Portal } from '../common/Portal';
import { prepareChartData, groupChartData } from '../../utils/chart';
import styles from './PositionChart.module.scss';

const TIME_PERIODS = {
  MINUTE_1: '1min',
  MINUTE_5: '5min',
  MINUTE_15: '15min',
  MINUTE_30: '30min',
  HOUR_1: '1hour',
  HOUR_4: '4hour',
  DAY_1: '1day',
  WEEK_1: '1week',
  MONTH_1: '1month'
};

export const PositionChart = ({ positionHistory, onClose }) => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState(TIME_PERIODS.MINUTE_5);
  const [metrics, setMetrics] = useState({
    pnl: true,
    yield: true
  });

  useEffect(() => {
    if (positionHistory?.length > 0) {
      try {
        console.log('Raw position history sample:', positionHistory[0]);
        console.log('Processing position history:', positionHistory.length, 'entries');
        
        const chartData = prepareChartData(positionHistory);
        console.log('Prepared chart data:', chartData.length, 'entries');
        console.log('Sample prepared data:', chartData[0]);
        
        const groupedData = groupChartData(chartData, period);
        console.log('Grouped chart data:', groupedData.length, 'entries');
        console.log('Sample grouped data:', groupedData[0]);
        
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
        
        console.log('Valid data points:', validData.length);
        if (validData.length > 0) {
          console.log('Sample valid data:', validData[0]);
          console.log('Value ranges:', {
            pnl: {
              min: Math.min(...validData.map(d => d.pnl)),
              max: Math.max(...validData.map(d => d.pnl))
            },
            yield: {
              min: Math.min(...validData.map(d => d.yield)),
              max: Math.max(...validData.map(d => d.yield))
            }
          });
          console.log('Data range:', {
            start: new Date(validData[0].timestamp).toISOString(),
            end: new Date(validData[validData.length - 1].timestamp).toISOString()
          });
        }
        
        setData(validData);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setData([]);
      }
    } else {
      console.log('No position history data available');
      setData([]);
    }
  }, [positionHistory, period]);

  const getTimeAxisTicks = (data) => {
    if (!data || data.length < 2) return [];
    
    const start = data[0].timestamp;
    const end = data[data.length - 1].timestamp;
    const duration = end - start;
    
    // Calculate number of ticks based on period
    let tickCount;
    switch(period) {
      case TIME_PERIODS.MINUTE_1:
        tickCount = 12;
        break;
      case TIME_PERIODS.MINUTE_5:
        tickCount = 10;
        break;
      case TIME_PERIODS.MINUTE_15:
      case TIME_PERIODS.MINUTE_30:
        tickCount = 8;
        break;
      default:
        tickCount = 6;
    }

    // Generate evenly spaced ticks
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(start + (duration * i) / tickCount);
    }
    return ticks;
  };

  const formatXAxisLabel = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    try {
      switch(period) {
        case TIME_PERIODS.MINUTE_1:
        case TIME_PERIODS.MINUTE_5:
        case TIME_PERIODS.MINUTE_15:
        case TIME_PERIODS.MINUTE_30:
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case TIME_PERIODS.HOUR_1:
        case TIME_PERIODS.HOUR_4:
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case TIME_PERIODS.DAY_1:
          return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
        case TIME_PERIODS.WEEK_1:
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        case TIME_PERIODS.MONTH_1:
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        default:
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const formatValue = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    if (Math.abs(value) < 0.01 && value !== 0) {
      return `$${value.toFixed(6)}`;
    }
    return `$${value.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{formatXAxisLabel(label)}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatValue(entry.value)}
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
            <h3>Position History</h3>
            <div className={styles.controls}>
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className={styles.periodSelect}
              >
                <option value={TIME_PERIODS.MINUTE_1}>1 Minute</option>
                <option value={TIME_PERIODS.MINUTE_5}>5 Minutes</option>
                <option value={TIME_PERIODS.MINUTE_15}>15 Minutes</option>
                <option value={TIME_PERIODS.MINUTE_30}>30 Minutes</option>
                <option value={TIME_PERIODS.HOUR_1}>1 Hour</option>
                <option value={TIME_PERIODS.HOUR_4}>4 Hours</option>
                <option value={TIME_PERIODS.DAY_1}>1 Day</option>
                <option value={TIME_PERIODS.WEEK_1}>1 Week</option>
                <option value={TIME_PERIODS.MONTH_1}>1 Month</option>
              </select>
              <button 
                className={styles.closeButton} 
                onClick={onClose}
                aria-label="Close chart"
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
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={data}
                  margin={{ top: 5, right: 30, bottom: 25, left: 30 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={true}
                    verticalPoints={getTimeAxisTicks(data)}
                    horizontalPoints={getYAxisTicks(data)}
                  />
                  <XAxis 
                    dataKey="timestamp" 
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatXAxisLabel}
                    ticks={getTimeAxisTicks(data)}
                    tick={{
                      fontSize: 11,
                      textAnchor: 'middle',
                      dy: 10
                    }}
                    height={40}
                    padding={{ left: 0, right: 0 }}
                  />
                  <YAxis 
                    tickFormatter={formatValue}
                    ticks={getYAxisTicks(data)}
                    domain={[
                      dataMin => Math.floor(dataMin * 1.1 * 100) / 100,
                      dataMax => Math.ceil(dataMax * 1.1 * 100) / 100
                    ]}
                    padding={{ top: 10, bottom: 10 }}
                    width={70}
                    tick={{
                      fontSize: 11,
                      dx: -5
                    }}
                    axisLine={true}
                    tickLine={true}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    isAnimationActive={false}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    onClick={handleMetricToggle}
                    wrapperStyle={{
                      paddingTop: '10px'
                    }}
                  />
                  {metrics.pnl && (
                    <Line
                      type="monotone"
                      dataKey="pnl"
                      stroke="#8884d8"
                      name="PnL"
                      dot={false}
                      activeDot={{ r: 4 }}
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
                      activeDot={{ r: 4 }}
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