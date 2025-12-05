import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Common test setup function to prepare the testing environment
 */
export function setupPageTests() {
  // Mock global fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  );

  // Setup localStorage mock
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  return { localStorageMock };
}

/**
 * Mock Next.js components by setting up the necessary mocks
 */
export function mockNextComponents() {
  // Mock Next.js components
  jest.mock('next/link', () => {
    const MockLink = ({ children, href }) => (
      <a href={href} data-testid="next-link">
        {children}
      </a>
    );
    MockLink.displayName = 'MockLink';
    return MockLink;
  });

  jest.mock('next/head', () => {
    const MockHead = ({ children }) => (
      <div data-testid="head">{children}</div>
    );
    MockHead.displayName = 'MockHead';
    return {
      __esModule: true,
      default: MockHead,
    };
  });

  jest.mock('next/router', () => ({
    useRouter: jest.fn(() => ({
      query: {},
      isReady: true,
      push: jest.fn(),
      pathname: '/',
      asPath: '/',
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    })),
  }));
}

/**
 * Helper function to render a component and wait for it to finish loading
 * @param {JSX.Element} ui - The React component to render
 * @param {Object} options - Options for render
 * @returns {Object} The rendered component and additional utilities
 */
export async function renderWithAct(ui, options = {}) {
  const rendered = render(ui, options);
  await waitFor(() => {});
  return rendered;
}

/**
 * Creates mock data for pools
 * @returns {Array} Array of mock pool objects
 */
export function createMockPools() {
  return [
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
          yield_over_tvl: 0.05,
        },
        '7d': {
          volume: 3500000,
          fees: 1750,
          yield_over_tvl: 0.07,
        },
      },
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
          yield_over_tvl: 0.03,
        },
        '7d': {
          volume: 1750000,
          fees: 525,
          yield_over_tvl: 0.04,
        },
      },
    },
  ];
}

/**
 * Mock for common components
 */
export function mockCommonComponents() {
  jest.mock('../../../components/common/TimeframeSelector', () => {
    const MockTimeframeSelector = ({ timeframes, selected, onChange }) => (
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
    MockTimeframeSelector.displayName = 'MockTimeframeSelector';
    return MockTimeframeSelector;
  });

  jest.mock('../../../components/common/LoadingOverlay', () => {
    const MockLoadingOverlay = ({ loading, children }) => (
      <div data-testid="loading-overlay" data-loading={loading}>
        {loading ? <div>Loading...</div> : children}
      </div>
    );
    MockLoadingOverlay.displayName = 'MockLoadingOverlay';
    return MockLoadingOverlay;
  });
}

/**
 * Mock for pools components
 */
export function mockPoolComponents() {
  jest.mock('../../../components/pools/PoolCard', () => {
    const MockPoolCard = ({ pool, timeframe }) => (
      <div
        data-testid="pool-card"
        data-pool-address={pool.address}
        data-timeframe={timeframe}
      >
        {pool.tokenA?.symbol || 'Unknown'}/{pool.tokenB?.symbol || 'Unknown'}
      </div>
    );
    MockPoolCard.displayName = 'MockPoolCard';
    return MockPoolCard;
  });

  jest.mock('../../../components/pools/PoolMetrics', () => {
    const MockPoolMetrics = ({ poolId, timeframe }) => (
      <div
        data-testid="pool-metrics"
        data-pool-id={poolId}
        data-timeframe={timeframe}
      >
        Pool Metrics Component
      </div>
    );
    MockPoolMetrics.displayName = 'MockPoolMetrics';
    return MockPoolMetrics;
  });

  jest.mock('../../../components/pools/PoolFilters', () => {
    const MockPoolFilters = ({ filters, onFilterChange, filterOptions }) => (
      <div data-testid="pool-filters">
        <button
          data-testid="filter-button"
          onClick={() => onFilterChange({ ...filters, token: 'ETH' })}
        >
          Filter Tokens
        </button>
      </div>
    );
    MockPoolFilters.displayName = 'MockPoolFilters';
    return MockPoolFilters;
  });
}

/**
 * Mock for contexts
 */
export function mockContexts() {
  jest.mock('../../../contexts/ComparisonContext', () => ({
    useComparison: jest.fn(() => ({
      comparisonPools: [],
      isInComparison: jest.fn(() => false),
      addPoolToComparison: jest.fn(),
      removePoolFromComparison: jest.fn(),
      clearComparison: jest.fn(),
    })),
  }));
}

/**
 * Mock for hooks
 */
export function mockHooks() {
  jest.mock('../../../hooks/usePoolsData', () => {
    return jest.fn(() => ({
      pools: createMockPools(),
      loading: false,
      error: null,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc',
        token: '',
        minTvl: 0,
        timeframe: '24h',
      },
      filterOptions: {
        tokens: ['ETH', 'USDC', 'SOL', 'USDT'],
        tvlRanges: [
          { value: 0, label: 'Any TVL' },
          { value: 10000, label: '$10K+' },
        ],
      },
      applyFilters: jest.fn(),
    }));
  });

  jest.mock('../../../hooks/usePoolData', () => ({
    usePoolData: jest.fn((poolId) => {
      const pool = createMockPools().find(p => p.address === poolId);
      return {
        loading: false,
        error: null,
        data: pool || null,
        feeAPR: 10.5,
        volumeTVLRatio: 0.5,
        volatility: 'Medium',
      };
    }),
  }));
}

// Add a simple test to prevent the "no tests" error
describe('Test Setup', () => {
  it('exports utility functions for testing', () => {
    expect(typeof setupPageTests).toBe('function');
    expect(typeof mockNextComponents).toBe('function');
    expect(typeof renderWithAct).toBe('function');
    expect(typeof createMockPools).toBe('function');
  });
});