import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolsPage from '../../../pages/pools/index';
import usePoolsData from '../../../hooks/usePoolsData';
import { useComparison } from '../../../contexts/ComparisonContext';

// Mock Next.js components
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="head">{children}</div>,
  };
});

jest.mock('next/link', () => {
  return ({ children, href }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock hooks
jest.mock('../../../hooks/usePoolsData');
jest.mock('../../../contexts/ComparisonContext');

// Mock components
jest.mock('../../../components/pools/PoolCard', () => {
  return function MockPoolCard({ pool, timeframe }) {
    return (
      <div 
        data-testid="pool-card" 
        data-pool-address={pool.address}
        data-timeframe={timeframe}
      >
        {pool.tokenA?.symbol || 'Unknown'}/{pool.tokenB?.symbol || 'Unknown'}
      </div>
    );
  };
});

jest.mock('../../../components/pools/PoolFilters', () => {
  return function MockPoolFilters({ filters, onFilterChange, filterOptions }) {
    return (
      <div data-testid="pool-filters">
        <button 
          data-testid="filter-button" 
          onClick={() => onFilterChange({ ...filters, token: 'ETH' })}
        >
          Filter Tokens
        </button>
      </div>
    );
  };
});

describe('Pools Page', () => {
  const mockPools = [
    {
      address: 'pool1',
      tokenA: { symbol: 'ETH' },
      tokenB: { symbol: 'USDC' },
      tvl_usdc: 1000000,
      fee_rate: 500,
    },
    {
      address: 'pool2',
      tokenA: { symbol: 'SOL' },
      tokenB: { symbol: 'USDT' },
      tvl_usdc: 500000,
      fee_rate: 300,
    },
  ];

  const mockFilterOptions = {
    tokens: ['ETH', 'USDC', 'SOL', 'USDT'],
    tvlRanges: [
      { value: 0, label: 'Any TVL' },
      { value: 10000, label: '$10K+' },
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    usePoolsData.mockReturnValue({
      pools: mockPools,
      loading: false,
      error: null,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc',
        token: '',
        minTvl: 0,
        timeframe: '24h'
      },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn()
    });
    
    useComparison.mockReturnValue({
      comparisonPools: []
    });
  });

  it('renders the page title and description', () => {
    render(<PoolsPage />);
    
    expect(screen.getByText('All Pools')).toBeInTheDocument();
    expect(
      screen.getByText('Explore and analyze all available liquidity pools on DeFiTuna')
    ).toBeInTheDocument();
  });

  it('renders pool cards when data is available', () => {
    render(<PoolsPage />);
    
    const poolCards = screen.getAllByTestId('pool-card');
    expect(poolCards).toHaveLength(2);
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
    expect(screen.getByText('SOL/USDT')).toBeInTheDocument();
  });

  it('shows loading state when loading', () => {
    usePoolsData.mockReturnValue({
      pools: [],
      loading: true,
      error: null,
      filters: { timeframe: '24h' },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn()
    });
    
    render(<PoolsPage />);
    
    expect(screen.getByText('Loading pools data...')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    usePoolsData.mockReturnValue({
      pools: [],
      loading: false,
      error: 'Failed to fetch pools',
      filters: { timeframe: '24h' },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn()
    });
    
    render(<PoolsPage />);
    
    expect(screen.getByText('Error: Failed to fetch pools')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows empty state when no pools match filters', () => {
    usePoolsData.mockReturnValue({
      pools: [],
      loading: false,
      error: null,
      filters: { timeframe: '24h' },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn()
    });
    
    render(<PoolsPage />);
    
    expect(screen.getByText('No pools found matching your filters.')).toBeInTheDocument();
  });

  it('renders compare link when pools are selected for comparison', () => {
    useComparison.mockReturnValue({
      comparisonPools: [{ address: 'pool1' }, { address: 'pool2' }]
    });
    
    render(<PoolsPage />);
    
    expect(screen.getByText('Compare Pools (2)')).toBeInTheDocument();
    expect(screen.getByText('Compare Pools (2)')).toHaveAttribute('href', '/pools/compare');
  });

  it('calls applyFilters when filter button is clicked', () => {
    const mockApplyFilters = jest.fn();
    usePoolsData.mockReturnValue({
      pools: mockPools,
      loading: false,
      error: null,
      filters: { timeframe: '24h' },
      filterOptions: mockFilterOptions,
      applyFilters: mockApplyFilters
    });
    
    render(<PoolsPage />);
    
    const filterButton = screen.getByTestId('filter-button');
    fireEvent.click(filterButton);
    
    expect(mockApplyFilters).toHaveBeenCalledWith({ timeframe: '24h', token: 'ETH' });
  });

  it('includes a link back to the PnL viewer', () => {
    render(<PoolsPage />);
    
    const homeLink = screen.getByText('Back to PnL Viewer');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
}); 