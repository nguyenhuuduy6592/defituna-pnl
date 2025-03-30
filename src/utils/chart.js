// Utility functions for processing historical position data for charts

import React from 'react'; // Needed for JSX in CustomChartTooltip
import { TIME_PERIODS } from './constants';
import { formatNumber } from './formatters';
import styles from '../components/pnl/PositionChart.module.scss'; // Need styles for tooltip

/**
 * Prepares historical position data for charting
 * @param {Array} positionHistory Array of position snapshots
 * @returns {Array} Processed data ready for charting
 */
export const prepareChartData = (positionHistory) => {
  if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
    return [];
  }

  return positionHistory.map(snapshot => {
    let timestamp;
    if (typeof snapshot.timestamp === 'number') {
      timestamp = snapshot.timestamp;
    } else if (typeof snapshot.timestamp === 'string') {
      timestamp = new Date(snapshot.timestamp).getTime();
    } else {
      timestamp = Date.now(); // Fallback, should ideally not happen
    }

    const getSafeFloat = (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    
    // Extract PnL and Yield safely
    const pnl = getSafeFloat(snapshot.pnl?.usd ?? snapshot.pnl?.value ?? snapshot.pnl ?? 0);
    let yieldValue = getSafeFloat(snapshot.yield?.usd ?? snapshot.yield?.value ?? snapshot.yield ?? 0);
    
    // If yield is zero or missing, try summing yield_a and yield_b
    if (yieldValue === 0 && (snapshot.yield_a || snapshot.yield_b)) {
       const yieldA = getSafeFloat(snapshot.yield_a?.usd ?? snapshot.yield_a?.value ?? snapshot.yield_a ?? 0);
       const yieldB = getSafeFloat(snapshot.yield_b?.usd ?? snapshot.yield_b?.value ?? snapshot.yield_b ?? 0);
       yieldValue = yieldA + yieldB;
    }

    return {
      timestamp,
      pnl,
      yield: yieldValue,
      // Add other potentially useful values if needed, ensuring they are numbers
      compounded: getSafeFloat(snapshot.compounded?.usd ?? snapshot.compounded ?? 0),
      // Add other fields if necessary, e.g., size, collateral
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Groups chart data by time period using the latest entry in each period.
 * @param {Array} data Processed chart data (sorted by timestamp ASC)
 * @param {string} period Value from TIME_PERIODS (e.g., '5min', '1hour')
 * @returns {Array} Grouped data, using the last data point within each interval.
 */
export const groupChartData = (data, period = TIME_PERIODS.MINUTE_5.value) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const groups = new Map();
  
  data.forEach(entry => {
    if (!entry || typeof entry.timestamp !== 'number' || isNaN(entry.timestamp)) {
      return; // Skip invalid entries
    }

    const date = new Date(entry.timestamp);
    if (isNaN(date.getTime())) {
      return; // Skip invalid dates
    }

    let keyTimestamp;
    try {
      // Create a mutable copy for manipulation
      const intervalDate = new Date(date.getTime()); 
      intervalDate.setSeconds(0, 0); // Normalize seconds/ms

      // Determine the start of the interval based on the period
      switch(period) {
        case TIME_PERIODS.MINUTE_1.value:
          break; // Key is the start of the minute
        case TIME_PERIODS.MINUTE_5.value:
          intervalDate.setMinutes(Math.floor(intervalDate.getMinutes() / 5) * 5);
          break;
        case TIME_PERIODS.MINUTE_15.value:
          intervalDate.setMinutes(Math.floor(intervalDate.getMinutes() / 15) * 15);
          break;
        case TIME_PERIODS.MINUTE_30.value:
          intervalDate.setMinutes(Math.floor(intervalDate.getMinutes() / 30) * 30);
          break;
        case TIME_PERIODS.HOUR_1.value:
          intervalDate.setMinutes(0);
          break;
        case TIME_PERIODS.HOUR_4.value:
          intervalDate.setMinutes(0);
          intervalDate.setHours(Math.floor(intervalDate.getHours() / 4) * 4);
          break;
        case TIME_PERIODS.DAY_1.value:
          intervalDate.setHours(0, 0, 0, 0);
          break;
        case TIME_PERIODS.WEEK_1.value:
          intervalDate.setHours(0, 0, 0, 0);
          // Adjust to the start of the week (e.g., Sunday or Monday depending on locale)
          intervalDate.setDate(intervalDate.getDate() - intervalDate.getDay()); 
          break;
        case TIME_PERIODS.MONTH_1.value:
          intervalDate.setHours(0, 0, 0, 0);
          intervalDate.setDate(1);
          break;
        default:
          // Default to 5 minutes if period is unrecognized
          intervalDate.setMinutes(Math.floor(intervalDate.getMinutes() / 5) * 5);
      }
      keyTimestamp = intervalDate.getTime();
    } catch (error) {
      console.error('Error calculating interval key:', error, entry.timestamp);
      return; // Skip if key calculation fails
    }
    
    // Store the *latest* entry for each interval key
    groups.set(keyTimestamp, { ...entry, timestamp: keyTimestamp }); // Use keyTimestamp for grouping

  });

  // Convert map values back to an array and sort by timestamp
  return Array.from(groups.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Formats the X-axis timestamp label based on the data range and selected period.
 * @param {number} timestamp - The timestamp value for the tick.
 * @param {Array} allData - The complete (ungrouped or grouped) chart data array.
 * @param {string} period - The currently selected time period value.
 * @returns {string} The formatted date/time string.
 */
export const formatXAxisLabel = (timestamp, allData = [], period = TIME_PERIODS.MINUTE_5.value) => {
  if (!timestamp || isNaN(timestamp) || allData.length === 0) return '';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const firstTimestamp = allData[0]?.timestamp;
    const lastTimestamp = allData[allData.length - 1]?.timestamp;

    // Determine if the data spans more than one day
    let spansMultipleDays = false;
    if (firstTimestamp && lastTimestamp) {
      const startDate = new Date(firstTimestamp);
      const endDate = new Date(lastTimestamp);
      // Check if years, months, or days are different
      spansMultipleDays = startDate.getFullYear() !== endDate.getFullYear() ||
                          startDate.getMonth() !== endDate.getMonth() ||
                          startDate.getDate() !== endDate.getDate();
    }

    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const dateOptionsShort = { month: 'short', day: 'numeric' };
    const dateOptionsFull = { year: 'numeric', month: 'short', day: 'numeric' };

    // Always show date if multiple days are spanned
    if (spansMultipleDays) {
      switch (period) {
        case TIME_PERIODS.DAY_1.value:
        case TIME_PERIODS.WEEK_1.value:
        case TIME_PERIODS.MONTH_1.value:
          // For longer periods spanning multiple days, just show the date
          return date.toLocaleDateString(undefined, dateOptionsShort);
        default:
          // For shorter periods spanning multiple days, show date and time
          return `${date.toLocaleDateString(undefined, dateOptionsShort)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
      }
    } else {
      // If data is within a single day, primarily show time
      switch (period) {
        case TIME_PERIODS.DAY_1.value:
        case TIME_PERIODS.WEEK_1.value:
        case TIME_PERIODS.MONTH_1.value:
           // Even on the same day, for long periods, showing date might be useful
           return date.toLocaleDateString(undefined, dateOptionsShort);
        default:
          // For shorter periods within the same day, just show time
          return date.toLocaleTimeString(undefined, timeOptions);
      }
    }
  } catch (error) {
    console.error('Error formatting X axis label:', error, timestamp);
    return ''; // Return empty string on error
  }
};

/**
 * Custom Tooltip component for the Recharts LineChart.
 * @param {object} props - Props passed by Recharts.
 * @param {boolean} props.active - Whether the tooltip is active.
 * @param {Array} props.payload - The data payload for the hovered point.
 * @param {number} props.label - The timestamp label for the hovered point.
 * @returns {JSX.Element|null} The rendered tooltip or null.
 */
export const CustomChartTooltip = React.memo(function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>
        {new Date(label).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)} 
        </p>
      ))}
    </div>
  );
});

export const getGridStyling = () => ({
  stroke: '#cccccc',  // Darker grid color for better contrast
  strokeDasharray: '2 4',  // Adjusted dash pattern
  vertical: true,
  horizontal: true,
  opacity: 0.8
});

export const getAxisStyling = () => ({
  stroke: '#666666',
  fontSize: 12,
  tickLine: { stroke: '#666666' },  // Darker tick lines
  axisLine: { stroke: '#666666' },  // Darker axis lines
  padding: { left: 10, right: 10 }  // Add padding for better readability
});

export const calculateYAxisDomain = (data = [], metrics = {}) => {
  if (!Array.isArray(data) || data.length === 0) return [0, 0];

  const values = [];
  data.forEach(item => {
    if (!item) return;
    if (metrics.pnl && typeof item.pnl === 'number') values.push(item.pnl);
    if (metrics.yield && typeof item.yield === 'number') values.push(item.yield);
  });

  if (values.length === 0) return [0, 0];

  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate nice round numbers for the domain
  const range = max - min || 1; // Prevent division by zero
  const step = Math.pow(10, Math.floor(Math.log10(range))) / 2;
  
  const paddedMin = Math.floor(min / step) * step;
  const paddedMax = Math.ceil(max / step) * step;
  
  return [paddedMin, paddedMax];
};

export const getYAxisTicks = (min = 0, max = 0) => {
  if (typeof min !== 'number' || typeof max !== 'number' || min === max) {
    return [0];
  }

  const range = max - min;
  if (range === 0) return [min];

  const targetTickCount = 8;
  const roughStep = range / targetTickCount;
  
  // Round to a nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;
  
  let step;
  if (normalizedStep < 1.5) step = magnitude;
  else if (normalizedStep < 3) step = 2 * magnitude;
  else if (normalizedStep < 7.5) step = 5 * magnitude;
  else step = 10 * magnitude;
  
  const ticks = [];
  let tick = Math.ceil(min / step) * step;
  while (tick <= max) {
    ticks.push(tick);
    tick += step;
  }
  
  return ticks.length > 0 ? ticks : [0];
};