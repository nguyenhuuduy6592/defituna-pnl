/**
 * Application constants.
 * This module provides centralized constants for use throughout the application.
 * Constants are grouped by functionality.
 */

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
  MONTH_1: { value: '1month', label: '1 month' },
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
    opacity: 0.8,
  },
  axis: {
    stroke: '#666666',
    fontSize: 12,
    tickLine: { stroke: '#666666' },
    axisLine: { stroke: '#666666' },
    padding: { left: 10, right: 10 },
  },
};

export const KNOWN_TOKENS = {
  USDC: {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6,
    logo: '/images/tokens/usdc.png',
  },
  USDT: {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    decimals: 6,
    logo: '/images/tokens/usdt.png',
  },
  SOL: {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9,
    logo: '/images/tokens/sol.png',
  },
};

export const STABLE_TOKENS = [KNOWN_TOKENS.USDC.symbol, KNOWN_TOKENS.USDT.symbol];
