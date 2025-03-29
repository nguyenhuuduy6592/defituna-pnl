// Utility functions for processing historical position data for charts

/**
 * Prepares historical position data for charting
 * @param {Array} positionHistory Array of position snapshots
 * @returns {Array} Processed data ready for charting
 */
export function prepareChartData(positionHistory) {
  if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
    return [];
  }

  return positionHistory.map(snapshot => {
    // Ensure timestamp is a number
    let timestamp;
    if (typeof snapshot.timestamp === 'number') {
      timestamp = snapshot.timestamp;
    } else if (typeof snapshot.timestamp === 'string') {
      timestamp = new Date(snapshot.timestamp).getTime();
    } else {
      timestamp = Date.now();
    }

    // Extract PnL
    let pnl = 0;
    if (typeof snapshot.pnl === 'number') {
      pnl = snapshot.pnl;
    } else if (snapshot.pnl?.usd) {
      pnl = parseFloat(snapshot.pnl.usd);
    } else if (snapshot.pnl?.value) {
      pnl = parseFloat(snapshot.pnl.value);
    }

    // Extract Yield
    let yieldValue = 0;
    if (snapshot.yield) {
      if (typeof snapshot.yield === 'number') {
        yieldValue = snapshot.yield;
      } else if (snapshot.yield.usd) {
        yieldValue = parseFloat(snapshot.yield.usd);
      } else if (snapshot.yield.value) {
        yieldValue = parseFloat(snapshot.yield.value);
      }
    } else {
      // Try individual yield components
      const yieldA = parseFloat(snapshot.yield_a?.usd || snapshot.yield_a?.value || 0);
      const yieldB = parseFloat(snapshot.yield_b?.usd || snapshot.yield_b?.value || 0);
      yieldValue = yieldA + yieldB;
    }

    return {
      timestamp,
      pnl,
      yield: yieldValue,
      // Additional metrics for tooltips
      compounded: (parseFloat(snapshot.compounded_yield_a?.usd || snapshot.compounded_yield_a?.value || 0) +
                  parseFloat(snapshot.compounded_yield_b?.usd || snapshot.compounded_yield_b?.value || 0)),
      debt: (parseFloat(snapshot.loan_funds_b?.usd || snapshot.loan_funds_b?.value || 0) -
             parseFloat(snapshot.current_loan_b?.usd || snapshot.current_loan_b?.value || 0)),
      state: snapshot.state
    };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Groups chart data by time period for better visualization
 * @param {Array} data Processed chart data
 * @param {string} period '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' | '1day' | '1week' | '1month'
 * @returns {Array} Grouped and averaged data
 */
export function groupChartData(data, period = '5min') {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const groups = new Map();
  
  data.forEach(entry => {
    if (!entry || typeof entry.timestamp !== 'number' || isNaN(entry.timestamp)) {
      return;
    }

    const date = new Date(entry.timestamp);
    if (isNaN(date.getTime())) {
      return;
    }

    let key;
    try {
      // Reset seconds and milliseconds
      date.setSeconds(0, 0);
      
      // Adjust minutes/hours based on period
      switch(period) {
        case '1min':
          break;
        case '5min':
          date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
          break;
        case '15min':
          date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
          break;
        case '30min':
          date.setMinutes(Math.floor(date.getMinutes() / 30) * 30);
          break;
        case '1hour':
          date.setMinutes(0);
          break;
        case '4hour':
          date.setMinutes(0);
          date.setHours(Math.floor(date.getHours() / 4) * 4);
          break;
        case '1day':
          date.setHours(0, 0, 0, 0);
          break;
        case '1week':
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - date.getDay() + 1);
          break;
        case '1month':
          date.setHours(0, 0, 0, 0);
          date.setDate(1);
          break;
        default:
          date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
      }
      key = date.getTime();
    } catch (error) {
      console.error('Error processing date:', error);
      return;
    }
    
    if (!groups.has(key)) {
      groups.set(key, {
        timestamp: key,
        count: 0,
        pnl: 0,
        yield: 0,
        compounded: 0,
        debt: 0
      });
    }
    
    const group = groups.get(key);
    group.count++;
    group.pnl += entry.pnl || 0;
    group.yield += entry.yield || 0;
    group.compounded += entry.compounded || 0;
    group.debt += entry.debt || 0;
  });

  // Calculate averages and format data
  return Array.from(groups.values())
    .map(group => ({
      timestamp: group.timestamp,
      pnl: group.pnl / group.count,
      yield: group.yield / group.count,
      compounded: group.compounded / group.count,
      debt: group.debt / group.count
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

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