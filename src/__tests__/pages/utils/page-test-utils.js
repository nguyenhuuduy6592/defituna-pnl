/**
 * Common utility functions and mocks for page testing
 */

import React from 'react';

/**
 * Creates a mock for the Next.js Link component
 * @returns {Function} Mock Link component
 */
export const createLinkMock = () => {
  return ({ children, href }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  );
};

/**
 * Creates a mock for the Next.js Head component
 * @returns {Function} Mock Head component
 */
export const createHeadMock = () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="head">{children}</div>,
  };
};

/**
 * Creates a mock for Next.js router
 * @param {Object} options - Mock router options
 * @param {Object} options.query - Query parameters
 * @param {boolean} options.isReady - Is router ready
 * @param {string} options.pathname - Current pathname
 * @param {Function} options.push - Router push function
 * @returns {Object} Mock router object
 */
export const createRouterMock = ({
  query = {},
  isReady = true,
  pathname = '/',
  push = jest.fn()
} = {}) => {
  return {
    query,
    isReady,
    pathname,
    push,
    asPath: pathname,
    events: {
      on: jest.fn(),
      off: jest.fn()
    }
  };
};

/**
 * Creates a mock for localStorage
 * @returns {Object} Mock localStorage object
 */
export const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    getAllItems: () => store
  };
};

/**
 * Creates a mock for TimeframeSelector component
 * @returns {Function} Mock TimeframeSelector component
 */
export const createTimeframeSelectorMock = () => {
  return function MockTimeframeSelector({ timeframes, selected, onChange }) {
    return (
      <div data-testid="timeframe-selector">
        {timeframes.map(timeframe => (
          <button 
            key={timeframe} 
            data-testid={`timeframe-${timeframe}`}
            className={selected === timeframe ? 'active' : ''}
            onClick={() => onChange(timeframe)}
          >
            {timeframe}
          </button>
        ))}
      </div>
    );
  };
};

/**
 * Creates a mock for fetch API
 * @param {Object} responseMap - Map of URL paths to mock responses
 * @returns {Function} Mock fetch function
 */
export const createFetchMock = (responseMap = {}) => {
  return jest.fn((url) => {
    const matchedPath = Object.keys(responseMap).find(path => url.includes(path));
    
    if (matchedPath) {
      const response = responseMap[matchedPath];
      if (response instanceof Error) {
        return Promise.reject(response);
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response)
      });
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' })
    });
  });
};

/**
 * Sets up all common mocks for page testing
 * @param {Object} options - Mock options
 */
export const setupPageTest = (options = {}) => {
  // Mock Next.js components
  jest.mock('next/link', () => createLinkMock());
  jest.mock('next/head', () => createHeadMock());
  
  // Setup localStorage mock
  const localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  // Setup fetch mock if provided in options
  if (options.fetchResponses) {
    global.fetch = createFetchMock(options.fetchResponses);
  }
  
  // Return any mocks that might need to be accessed in tests
  return {
    localStorage: localStorageMock
  };
};

/**
 * Standard mock data for pools
 */
export const mockPoolsData = [
  {
    address: 'pool1',
    tokenA: { symbol: 'ETH', logoURI: '/eth.png' },
    tokenB: { symbol: 'USDC', logoURI: '/usdc.png' },
    tvl_usdc: 1000000,
    fee_rate: 500,
    currentPrice: 1800,
    provider: 'orca',
    stats: {
      '24h': {
        volume: 500000,
        fees: 250,
        yield_over_tvl: 0.05
      },
      '7d': {
        volume: 3500000,
        fees: 1750,
        yield_over_tvl: 0.07
      }
    }
  },
  {
    address: 'pool2',
    tokenA: { symbol: 'SOL', logoURI: '/sol.png' },
    tokenB: { symbol: 'USDT', logoURI: '/usdt.png' },
    tvl_usdc: 500000,
    fee_rate: 300,
    currentPrice: 120,
    provider: 'raydium',
    stats: {
      '24h': {
        volume: 250000,
        fees: 75,
        yield_over_tvl: 0.03
      },
      '7d': {
        volume: 1750000,
        fees: 525,
        yield_over_tvl: 0.04
      }
    }
  }
]; 