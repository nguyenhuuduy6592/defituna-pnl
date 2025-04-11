import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import PoolsPage from '@/pages/pools';
import { ComparisonProvider } from '@/contexts/ComparisonContext';

// Mocks
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
    pathname: '/pools',
    isReady: true,
  }),
}));

// Simple mock for next/link that renders an anchor with href and test-id
jest.mock('next/link', () => {
  return ({ children, href }) => (
    <a href={href} data-testid={`link-to-${href}`}>{children}</a>
  );
});

// Mock components
jest.mock('@/components/common/LoadingOverlay', () => ({
  __esModule: true,
  default: ({ isLoading }) => (
    isLoading ? <div data-testid="loading-indicator">Loading...</div> : null
  ),
}));

// Mock usePoolsData
jest.mock('@/hooks/usePoolsData', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: null,
    pools: [
      {
        address: 'pool1',
        tokenA: { symbol: 'ETH', logoURI: '/eth.png' },
        tokenB: { symbol: 'USDC', logoURI: '/usdc.png' },
        tvl_usdc: 1000000,
        fee_rate: 500,
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
    ],
    filters: { 
      search: '', 
      provider: null, 
      minTvl: 0, 
      sortBy: 'tvl', 
      sortOrder: 'desc', 
      timeframe: '24h'
    },
    filterOptions: {
      providers: ['orca', 'raydium'],
      timeframes: ['24h', '7d', '30d'],
      sortOptions: ['tvl', 'volume', 'yield']
    },
    applyFilters: jest.fn(),
  }),
}));

// Update PoolCard mock to use the simple next/link mock
jest.mock('@/components/pools/PoolCard', () => {
  const MockedLink = require('next/link'); // Get the mocked Link
  return {
    __esModule: true,
    default: ({ pool }) => (
      <div data-testid={`pool-card-${pool.address}`} className="pool-card-container">
        {/* Use the mocked Link component */}
        <MockedLink href={`/pools/${pool.address}`}>
          <div>{pool.tokenA.symbol}/{pool.tokenB.symbol}</div>
          <div>TVL: ${(pool.tvl_usdc / 1000000).toFixed(2)}M</div>
        </MockedLink>
      </div>
    ),
  };
});

describe('Pools Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the pools list', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <PoolsPage />
        </ComparisonProvider>
      );
    });

    expect(screen.getByText('All Pools')).toBeInTheDocument();
    expect(screen.getByTestId('pool-card-pool1')).toBeInTheDocument();
    expect(screen.getByTestId('pool-card-pool2')).toBeInTheDocument();
  });

  it('renders correct link for pool detail navigation', async () => {
    await act(async () => {
      render(
        <ComparisonProvider>
          <PoolsPage />
        </ComparisonProvider>
      );
    });
    
    // Find the link using the test ID set in the mock
    const poolLink = screen.getByTestId('link-to-/pools/pool1');
    expect(poolLink).toBeInTheDocument();
    expect(poolLink).toHaveAttribute('href', '/pools/pool1');
  });
}); 