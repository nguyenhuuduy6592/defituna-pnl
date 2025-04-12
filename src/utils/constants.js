/**
 * Application constants.
 * This module provides centralized constants for use throughout the application.
 * Constants are grouped by functionality.
 */

export const appTitle = 'Defituna PnL Viewer';

/**
 * Time period options for data fetching and display
 * @type {Object}
 */
export const TIME_PERIODS = {
  MINUTE_1: { value: '1min', label: '1 minute' },
  MINUTE_5: { value: '5min', label: '5 minutes' },
  MINUTE_15: { value: '15min', label: '15 minutes' },
  MINUTE_30: { value: '30min', label: '30 minutes' },
  HOUR_1: { value: '1hour', label: '1 hour' },
  HOUR_4: { value: '4hour', label: '4 hours' },
  DAY_1: { value: '1day', label: '1 day' },
  WEEK_1: { value: '1week', label: '1 week' },
  MONTH_1: { value: '1month', label: '1 month' }
};

/**
 * Auto-refresh interval options in seconds
 * These values should match the options in the UI dropdown
 * @type {Object}
 */
export const REFRESH_INTERVALS = {
  SECONDS: 1000,
  TEN_SECONDS: 10,
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  // Default refresh interval
  DEFAULT: 30,
  // Get the minimum allowed refresh interval
  getMinimum: () => process.env.NODE_ENV === 'development' ? 
    REFRESH_INTERVALS.TEN_SECONDS : 
    REFRESH_INTERVALS.THIRTY_SECONDS
};

/**
 * Default chart styling properties
 * @type {Object}
 */
export const CHART_STYLES = {
  grid: {
    stroke: '#cccccc',
    strokeDasharray: '2 4',
    vertical: true,
    horizontal: true,
    opacity: 0.8
  },
  axis: {
    stroke: '#666666',
    fontSize: 12,
    tickLine: { stroke: '#666666' },
    axisLine: { stroke: '#666666' },
    padding: { left: 10, right: 10 }
  }
};