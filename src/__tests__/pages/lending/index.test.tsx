import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LendingPage from '@/pages/lending';
import { useLendingPools } from '@/hooks/useLendingPools';

// Mock the useLendingPools hook
jest.mock('@/hooks/useLendingPools');

const mockVaults = [
  {
    address: '0x123',
    mint: '0x123token',
    depositedFunds: {
      amount: '1000000000000000000',
      usdValue: 1000000
    },
    borrowedFunds: {
      amount: '750000000000000000',
      usdValue: 750000
    },
    supplyLimit: {
      amount: '2000000000000000000',
      usdValue: 2000000
    },
    utilization: 75,
    supplyApy: 5.5,
    borrowApy: 8.5,
    borrowedShares: '750000000000000000',
    depositedShares: '1000000000000000000',
    pythOracleFeedId: 'price_feed_1',
    pythOraclePriceUpdate: '1234567890'
  },
  {
    address: '0x456',
    mint: '0x456token',
    depositedFunds: {
      amount: '2000000000000000000',
      usdValue: 2000000
    },
    borrowedFunds: {
      amount: '1600000000000000000',
      usdValue: 1600000
    },
    supplyLimit: {
      amount: '3000000000000000000',
      usdValue: 3000000
    },
    utilization: 80,
    supplyApy: 6.5,
    borrowApy: 9.5,
    borrowedShares: '1600000000000000000',
    depositedShares: '2000000000000000000',
    pythOracleFeedId: 'price_feed_2',
    pythOraclePriceUpdate: '1234567891'
  }
];

const mockFilterOptions = {
  tokens: [
    { mint: '0x123', symbol: 'TEST1', name: 'Test Token 1', icon: 'test1.png' },
    { mint: '0x456', symbol: 'TEST2', name: 'Test Token 2', icon: 'test2.png' }
  ],
  tvlRanges: [
    { value: 0, label: 'All' },
    { value: 100000, label: '$100k+' }
  ],
  utilizationRanges: [
    { value: 0, label: 'All' },
    { value: 50, label: '50%+' }
  ],
  supplyApyRanges: [
    { value: 0, label: 'All' },
    { value: 5, label: '5%+' }
  ],
  borrowApyRanges: [
    { value: 0, label: 'All' },
    { value: 7, label: '7%+' }
  ]
};

describe('LendingPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the page title and TVL correctly', () => {
    (useLendingPools as jest.Mock).mockReturnValue({
      vaults: mockVaults,
      loading: false,
      error: null,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc'
      },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn(),
      refresh: jest.fn()
    });

    render(<LendingPage />);

    // Check page title
    expect(screen.getByText('Lending Pools')).toBeInTheDocument();

    // Check TVL display (sum of all vault TVLs: 1,000,000 + 2,000,000 = 3,000,000)
    expect(screen.getByText('Total Value Locked: $3,000,000')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    (useLendingPools as jest.Mock).mockReturnValue({
      vaults: [],
      loading: true,
      error: null,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc'
      },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn(),
      refresh: jest.fn()
    });

    render(<LendingPage />);
    expect(screen.getByText('Loading lending pools...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to load lending pools';
    (useLendingPools as jest.Mock).mockReturnValue({
      vaults: [],
      loading: false,
      error: errorMessage,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc'
      },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn(),
      refresh: jest.fn()
    });

    render(<LendingPage />);
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    (useLendingPools as jest.Mock).mockReturnValue({
      vaults: [],
      loading: false,
      error: null,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc'
      },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn(),
      refresh: jest.fn()
    });

    render(<LendingPage />);
    expect(screen.getByText('No lending pools available at the moment.')).toBeInTheDocument();
  });

  it('renders navigation links correctly', () => {
    (useLendingPools as jest.Mock).mockReturnValue({
      vaults: mockVaults,
      loading: false,
      error: null,
      filters: {
        sortBy: 'tvl',
        sortOrder: 'desc'
      },
      filterOptions: mockFilterOptions,
      applyFilters: jest.fn(),
      refresh: jest.fn()
    });

    render(<LendingPage />);
    expect(screen.getByText('Back to PnL Viewer')).toBeInTheDocument();
  });
}); 