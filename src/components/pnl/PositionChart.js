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
import { prepareChartData, groupChartData, formatXAxisLabel, CustomChartTooltip, formatNumber, TIME_PERIODS } from '../../utils';
import styles from './PositionChart.module.scss';

// --- Constants ---
const Y_AXIS_TICK_COUNT = 8;
const Y_AXIS_DOMAIN_PADDING_FACTOR = 0.1;

/**
 * A modal component displaying a historical performance chart for a position.
 * 
 * @param {object} props - Component props.
 * @param {Array<object>} props.positionHistory - Array of historical data points for the position.
 * @param {Function} props.onClose - Callback function to close the chart modal.
 * @returns {JSX.Element|null} The rendered component.
 */
export const PositionChart = ({ positionHistory, onClose }) => {
  const [chartData, setChartData] = useState([]);
  const [activePeriod, setActivePeriod] = useState(TIME_PERIODS.MINUTE_5.value);
  const [activeMetrics, setActiveMetrics] = useState({
    pnl: true,
    yield: true
  });

  useEffect(() => {
    if (!positionHistory || positionHistory.length === 0) {
      setChartData([]);
      return;
    }
    try {
      const preparedData = prepareChartData(positionHistory);
      const groupedData = groupChartData(preparedData, activePeriod);
      
      // Enhanced validation: Ensure items have valid timestamp and some non-zero metric
      const validData = groupedData.filter(item => 
        item &&
        typeof item.timestamp === 'number' && 
        !isNaN(item.timestamp) &&
        (Math.abs(item.pnl) > 1e-9 || Math.abs(item.yield) > 1e-9) // Use epsilon for float comparison
      );
      
      setChartData(validData);
    } catch (error) {
      console.error('Error processing chart data:', error);
      setChartData([]); // Reset data on error
    }
  }, [positionHistory, activePeriod]);

  const handleMetricToggle = (metric) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const handleOverlayClick = (e) => {
    // Close only if the click is directly on the overlay, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getYAxisDomain = (data) => {
    if (!data || data.length === 0) return [0, 0];

    const values = [];
    data.forEach(item => {
      if (activeMetrics.pnl && item.pnl != null) values.push(item.pnl);
      if (activeMetrics.yield && item.yield != null) values.push(item.yield);
    });

    if (values.length === 0) return [0, 0];

    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add padding to min/max unless they are the same
    const range = max - min;
    if (range === 0) {
      // Handle case where min === max (e.g., single point or all values same)
      const padding = Math.abs(max * Y_AXIS_DOMAIN_PADDING_FACTOR) || 1; // Default padding if max is 0
      return [min - padding, max + padding];
    }
    
    const padding = range * Y_AXIS_DOMAIN_PADDING_FACTOR;
    return [min - padding, max + padding];
  };
  
  const yAxisDomain = getYAxisDomain(chartData);

  if (!positionHistory) return null;

  return (
    <Portal>
      <div className={styles.chartOverlay} onClick={handleOverlayClick}>
        <div className={styles.chartContainer} onClick={e => e.stopPropagation()}>
          <div className={styles.chartHeader}>
            <h3 className={styles.title}>
              Position History
              <Tooltip content={`• Shows PnL ($) and Yield ($) changes over time.
• Historical data is stored locally in your browser.
• Limited to 30 days of history.
• Enable "Store History" to collect data.`}>
                <span className={styles.infoIcon}>
                  <BsInfoCircle />
                </span>
              </Tooltip>
            </h3>
            <div className={styles.controls}>
              <select 
                value={activePeriod}
                onChange={(e) => setActivePeriod(e.target.value)}
                className={styles.periodSelect}
                aria-label="Select time period"
                title="Select time period for chart data aggregation"
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
            {chartData.length === 0 ? (
              <div className={styles.noData}>
                No displayable data available for the selected time period or filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) => formatXAxisLabel(ts, chartData, activePeriod)}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    tick={{ fontSize: 11 }}
                    height={35}
                  />
                  <YAxis
                    tickFormatter={formatNumber}
                    tick={{ fontSize: 11 }}
                    width={60}
                    tickCount={Y_AXIS_TICK_COUNT}
                    domain={yAxisDomain}
                    allowDataOverflow={false}
                  />
                  <ReferenceLine y={0} stroke="#4dabf7" strokeWidth={1} />
                  <RechartsTooltip 
                    content={<CustomChartTooltip />}
                    isAnimationActive={false}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30}
                    onClick={(e) => handleMetricToggle(e.dataKey)}
                    wrapperStyle={{ paddingTop: '5px' }}
                  />
                  {activeMetrics.pnl && (
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false} 
                      activeDot={{ r: 6 }}
                      name="PnL ($)"
                    />
                  )}
                  {activeMetrics.yield && (
                    <Line 
                      type="monotone" 
                      dataKey="yield" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      name="Yield ($)"
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