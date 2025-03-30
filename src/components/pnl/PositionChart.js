import { useState, useEffect, useCallback, memo } from 'react';
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
 * Chart header component with title, info tooltip and controls
 */
const ChartHeader = memo(({ activePeriod, setActivePeriod, onClose }) => (
  <div className={styles.chartHeader}>
    <h3 className={styles.title}>
      Position History
      <Tooltip content={`• Shows PnL ($) and Yield ($) changes over time.
• Historical data is stored locally in your browser.
• Limited to 30 days of history.
• Enable "Store History" to collect data.`} position="bottom-center">
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
));

ChartHeader.displayName = 'ChartHeader';

/**
 * No data message component
 */
const NoChartData = memo(() => (
  <div className={styles.noData}>
    No displayable data available for the selected time period or filters.
  </div>
));

NoChartData.displayName = 'NoChartData';

/**
 * Chart content component that renders the chart or no data message
 */
const ChartContent = memo(({ chartData, activeMetrics, activePeriod }) => {
  if (chartData.length === 0) {
    return <NoChartData />;
  }
  
  return (
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
          tickFormatter={(value) => value === 0 ? '0' : formatNumber(value)}
          tick={{ fontSize: 11 }}
          width={60}
          domain={[
            dataMin => {
              // Ensure we include 0 and add padding below the min value
              const minWithZero = Math.min(0, dataMin);
              const padding = Math.abs(dataMin) * Y_AXIS_DOMAIN_PADDING_FACTOR;
              return minWithZero - padding;
            }, 
            dataMax => {
              // Ensure we include 0 and add padding above the max value
              const maxWithZero = Math.max(0, dataMax);
              const padding = Math.abs(dataMax) * Y_AXIS_DOMAIN_PADDING_FACTOR;
              return maxWithZero + padding;
            }
          ]}
          allowDataOverflow={false}
        />
        <ReferenceLine 
          y={0} 
          stroke="#4dabf7" 
          strokeWidth={1.5}
          strokeDasharray="3 3"
          ifOverflow="extendDomain"
          label={{
            value: "Break-even ($0)",
            position: "insideBottomRight",
            fill: "#4dabf7",
            fontSize: 11,
            fontWeight: "500"
          }}
        />
        <RechartsTooltip 
          content={<CustomChartTooltip />}
          isAnimationActive={false}
        />
        <Legend 
          verticalAlign="top" 
          height={30}
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
  );
});

ChartContent.displayName = 'ChartContent';

/**
 * A modal component displaying a historical performance chart for a position.
 * 
 * @param {object} props - Component props.
 * @param {Array<object>} props.positionHistory - Array of historical data points for the position.
 * @param {Function} props.onClose - Callback function to close the chart modal.
 * @returns {JSX.Element|null} The rendered component.
 */
const PositionChart = memo(function PositionChart({ positionHistory, onClose }) {
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

  const handleMetricToggle = useCallback((metric) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  }, []);

  const handleOverlayClick = useCallback((e) => {
    // Close only if the click is directly on the overlay, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!positionHistory) return null;

  return (
    <Portal>
      <div className={styles.chartOverlay} onClick={handleOverlayClick}>
        <div className={styles.chartContainer} onClick={e => e.stopPropagation()}>
          <ChartHeader 
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
            onClose={onClose}
          />

          <div className={styles.chartContent}>
            <ChartContent 
              chartData={chartData}
              activeMetrics={activeMetrics}
              activePeriod={activePeriod}
            />
          </div>
        </div>
      </div>
    </Portal>
  );
});

PositionChart.displayName = 'PositionChart';

export { PositionChart };