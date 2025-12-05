import { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Portal } from '../common/Portal';
import { Tooltip } from '../common/Tooltip';
import { BsInfoCircle } from 'react-icons/bs';
import { HiDownload, HiShare } from 'react-icons/hi';
import {
  prepareChartData,
  groupChartData,
  formatXAxisLabel,
  CustomChartTooltip,
  formatNumber,
  TIME_PERIODS,
} from '../../utils';
import { exportChartAsImage, shareCard } from '../../utils/export';
import styles from './PositionChart.module.scss';

// --- Constants ---
const Y_AXIS_DOMAIN_PADDING_FACTOR = 0.1;

/**
 * Chart header component with title, info tooltip and controls
 */
const ChartHeader = memo(
  ({
    position,
    activePeriod,
    setActivePeriod,
    onClose,
    onExport,
    onShare,
    forExport = false,
  }) => {
    // Use position.pairDisplay if available, otherwise fall back to position.pair
    const displayPair = position?.pairDisplay || position?.pair || 'Position';

    return (
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>
          {displayPair} History
          {!forExport && (
            <Tooltip
              content={`• Shows PnL ($) and Yield ($) changes over time.
• Historical data is stored locally in your browser.
• Limited to 30 days of history.
• Enable "Store History" to collect data.`}
              position="bottom-center"
            >
              <span className={styles.infoIcon}>
                <BsInfoCircle />
              </span>
            </Tooltip>
          )}
        </h3>
        {!forExport && (
          <div className={styles.controls}>
            <select
              value={activePeriod}
              onChange={(e) => setActivePeriod(e.target.value)}
              className={styles.periodSelect}
              aria-label="Select time period"
              title="Select time period for chart data aggregation"
            >
              {Object.entries(TIME_PERIODS).map(([key, { value, label }]) => (
                <option key={key} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button
              className={styles.exportButton}
              onClick={onExport}
              aria-label={`Download ${displayPair} chart as PNG`}
              title="Download chart as PNG image"
            >
              <HiDownload className={styles.buttonIcon} />
            </button>

            <button
              className={styles.shareButton}
              onClick={onShare}
              aria-label={`Share ${displayPair} chart`}
              title="Share chart"
            >
              <HiShare className={styles.buttonIcon} />
            </button>

            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close chart"
              title="Close chart view"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }
);

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

  // Get the last PnL value to determine the line color
  const lastPnL = chartData[chartData.length - 1]?.pnl || 0;
  const pnlColor =
    lastPnL >= 0 ? 'var(--chart-positive)' : 'var(--chart-negative)';

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
          tickFormatter={(value) => (value === 0 ? '0' : formatNumber(value))}
          tick={{ fontSize: 11 }}
          width={60}
          domain={[
            (dataMin) => {
              // Ensure we include 0 and add padding below the min value
              const minWithZero = Math.min(0, dataMin);
              const padding = Math.abs(dataMin) * Y_AXIS_DOMAIN_PADDING_FACTOR;
              return minWithZero - padding;
            },
            (dataMax) => {
              // Ensure we include 0 and add padding above the max value
              const maxWithZero = Math.max(0, dataMax);
              const padding = Math.abs(dataMax) * Y_AXIS_DOMAIN_PADDING_FACTOR;
              return maxWithZero + padding;
            },
          ]}
          allowDataOverflow={false}
        />
        <ReferenceLine
          y={0}
          stroke="var(--chart-neutral)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          ifOverflow="extendDomain"
          label={{
            value: 'Break-even ($0)',
            position: 'insideBottomRight',
            fill: 'var(--chart-neutral)',
            fontSize: 11,
            fontWeight: '500',
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
            stroke={pnlColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="PnL ($)"
            connectNulls={true}
          />
        )}
        {activeMetrics.totalYield && (
          <Line
            type="monotone"
            dataKey="totalYield"
            stroke="var(--chart-primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="Yield + Compound ($)"
            connectNulls={true}
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
 * @param {object} props.position - The position data with pair name.
 * @param {Array<object>} props.positionHistory - Array of historical data points for the position.
 * @param {Function} props.onClose - Callback function to close the chart modal.
 * @returns {JSX.Element|null} The rendered component.
 */
const PositionChart = memo(function PositionChart({
  position,
  positionHistory,
  onClose,
}) {
  const [chartData, setChartData] = useState([]);
  const [activePeriod, setActivePeriod] = useState(TIME_PERIODS.MINUTE_5.value);
  const [activeMetrics, setActiveMetrics] = useState({
    pnl: true,
    totalYield: true,
  });

  const chartContainerRef = useRef(null);
  const chartContentRef = useRef(null);
  const exportWrapperRef = useRef(null);

  // Use position.pairDisplay if available, otherwise fall back to position.pair
  const displayPair = (position.pairDisplay || position.pair).trim();

  useEffect(() => {
    if (!positionHistory || positionHistory.length === 0) {
      setChartData([]);
      return;
    }
    try {
      const preparedData = prepareChartData(positionHistory);
      const groupedData = groupChartData(preparedData, activePeriod);

      // Keep valid items OR items explicitly added as null gaps
      const validData = groupedData
        .filter(
          (item) =>
            item &&
            typeof item.timestamp === 'number' &&
            !isNaN(item.timestamp) &&
            // Keep if it's a null gap (pnl is null) OR if original values are non-trivial
            (item.pnl === null ||
              Math.abs(item.pnl) > 1e-9 ||
              Math.abs(item.yield) > 1e-9 ||
              Math.abs(item.compounded) > 1e-9)
        )
        .map((item) => ({
          ...item,
          // Calculate totalYield, preserving null if yield or compounded is null
          totalYield:
            item.yield === null || item.compounded === null
              ? null
              : (item.yield || 0) + (item.compounded || 0),
        }));

      // Remove logs added for debugging
      // console.log("[PositionChart useEffect] Final chartData length:", validData.length);
      // console.log("[PositionChart useEffect] Final chartData sample (incl. nulls?):", validData.slice(0, 20));

      setChartData(validData);
    } catch (error) {
      console.error('Error processing chart data in useEffect:', error);
      setChartData([]);
    }
  }, [positionHistory, activePeriod]);

  const handleOverlayClick = useCallback(
    (e) => {
      // Close only if the click is directly on the overlay, not its children
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle export button click
  const handleExport = useCallback(() => {
    exportChartAsImage(
      exportWrapperRef,
      `${displayPair}-chart-${Date.now()}.png`
    );
  }, [position]);

  // Handle share button click
  const handleShare = useCallback(() => {
    shareCard(
      chartContainerRef,
      `${displayPair}-chart-${Date.now()}.png`,
      `${displayPair} Performance Chart`,
      `Check out my ${displayPair} position performance on DeFiTuna!`
    );
  }, [position]);

  if (!positionHistory) {
    return null;
  }

  return (
    <Portal>
      <div className={styles.chartOverlay} onClick={handleOverlayClick}>
        <div
          className={styles.chartContainer}
          onClick={(e) => e.stopPropagation()}
          ref={chartContainerRef}
        >
          <ChartHeader
            position={position}
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
            onClose={onClose}
            onExport={handleExport}
            onShare={handleShare}
          />

          <div className={styles.chartContent} ref={chartContentRef}>
            <ChartContent
              chartData={chartData}
              activeMetrics={activeMetrics}
              activePeriod={activePeriod}
            />
          </div>

          {/* Hidden wrapper for export that includes pair title */}
          <div
            className={styles.exportWrapper}
            ref={exportWrapperRef}
            data-export-content
          >
            <ChartHeader
              position={position}
              activePeriod={activePeriod}
              setActivePeriod={setActivePeriod}
              forExport={true}
            />
            <div className={styles.chartExportContent}>
              <ChartContent
                chartData={chartData}
                activeMetrics={activeMetrics}
                activePeriod={activePeriod}
              />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
});

PositionChart.displayName = 'PositionChart';

export { PositionChart };
