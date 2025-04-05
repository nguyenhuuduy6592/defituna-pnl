import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import ComparePoolsPage from '../../../pages/pools/compare';
import { useComparison } from '../../../contexts/ComparisonContext';
import { usePoolData } from '../../../hooks/usePoolData';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock the hooks
jest.mock('../../../contexts/ComparisonContext');
jest.mock('../../../hooks/usePoolData');

// Mock components
jest.mock('../../../components/common/LoadingOverlay', () => ({
  __esModule: true,
  default: ({ isLoading }) => (
    isLoading ? <div data-testid="loading-indicator">Loading...</div> : null
  ),
}));

jest.mock('../../../components/pools/PoolComparisonTable', () => ({
  __esModule: true,
  default: ({ pools }) => (
    <div data-testid="pool-comparison-table">
      <div>Comparing {pools.length} pools</div>
      {pools.map(pool => (
        <div key={pool.address} data-testid={`pool-row-${pool.address}`}>
          {pool.tokenA.symbol}/{pool.tokenB.symbol}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../../../components/pools/PoolDropdown', () => ({
  __esModule: true,
  default: ({ pools, selectedPools, onSelectPool }) => (
    <div data-testid="pool-dropdown">
      <select 
        data-testid="pool-select"
        onChange={(e) => onSelectPool(e.target.value)}
      >
        <option value="">Select a pool</option>
        {pools
          .filter(p => !selectedPools.includes(p.address))
          .map(pool => (
            <option key={pool.address} value={pool.address}>
              {pool.tokenA.symbol}/{pool.tokenB.symbol}
            </option>
          ))}
      </select>
    </div>
  ),
}));

jest.mock('../../../components/common/TimeframeSelector', () => ({
  __esModule: true,
  default: ({ timeframes, selected, onChange }) => (
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
  ),
}));

describe('Compare Pools Page', () => {
  const mockPools = [
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
  ];
  
  const mockRemovePoolFromComparison = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useComparison hook
    useComparison.mockReturnValue({
      comparisonPools: mockPools,
      removePoolFromComparison: mockRemovePoolFromComparison,
      clearComparison: jest.fn()
    });
    
    // Mock usePoolData hook
    usePoolData.mockImplementation((poolId) => {
      const pool = mockPools.find(p => p.address === poolId);
      return {
        loading: false,
        error: null,
        data: pool || null,
        feeAPR: 10.5,
        volumeTVLRatio: 0.5,
        volatility: 'Medium'
      };
    });
  });
  
  it('renders the page title and description', () => {
    render(<ComparePoolsPage />);
    
    expect(screen.getByText('Compare Pools')).toBeInTheDocument();
    expect(
      screen.getByText(/Compare key metrics across selected pools/i)
    ).toBeInTheDocument();
  });
  
  it('renders the timeframe selector', () => {
    render(<ComparePoolsPage />);
    
    expect(screen.getByTestId('timeframe-selector')).toBeInTheDocument();
  });
  
  it('renders all pools in comparison', () => {
    render(<ComparePoolsPage />);
    
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
    expect(screen.getByText('SOL/USDT')).toBeInTheDocument();
  });
  
  it('renders comparison table with metrics', () => {
    render(<ComparePoolsPage />);
    
    // Check for table headers
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('TVL')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('Fee')).toBeInTheDocument();
    expect(screen.getByText('Fee APR')).toBeInTheDocument();
    expect(screen.getByText('Vol/TVL')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
  });
  
  it('calls removePoolFromComparison when remove button is clicked', () => {
    render(<ComparePoolsPage />);
    
    // Find remove buttons
    const removeButtons = screen.getAllByText('Remove');
    
    // Click the first remove button
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemovePoolFromComparison).toHaveBeenCalledWith('pool1');
  });
  
  it('shows empty state when no pools are in comparison', () => {
    useComparison.mockReturnValueOnce({
      comparisonPools: [],
      removePoolFromComparison: mockRemovePoolFromComparison,
      clearComparison: jest.fn()
    });
    
    render(<ComparePoolsPage />);
    
    expect(screen.getByText('No pools selected for comparison')).toBeInTheDocument();
    expect(screen.getByText('Go to Pools')).toBeInTheDocument();
  });
  
  it('renders "Clear All" button when pools are in comparison', () => {
    render(<ComparePoolsPage />);
    
    const clearButton = screen.getByText('Clear All');
    expect(clearButton).toBeInTheDocument();
  });
  
  it('calls clearComparison when "Clear All" button is clicked', () => {
    const mockClearComparison = jest.fn();
    useComparison.mockReturnValueOnce({
      comparisonPools: mockPools,
      removePoolFromComparison: mockRemovePoolFromComparison,
      clearComparison: mockClearComparison
    });
    
    render(<ComparePoolsPage />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    expect(mockClearComparison).toHaveBeenCalled();
  });
  
  it('includes a link back to all pools', () => {
    render(<ComparePoolsPage />);
    
    const backLink = screen.getByText('Back to All Pools');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/pools');
  });
  
  it('renders provider information for each pool', () => {
    render(<ComparePoolsPage />);
    
    expect(screen.getByText('orca')).toBeInTheDocument();
    expect(screen.getByText('raydium')).toBeInTheDocument();
  });

  it('renders the pool comparison page', async () => {
    await act(async () => {
      render(<ComparePoolsPage />);
    });

    expect(screen.getByText('Compare Pools')).toBeInTheDocument();
    expect(screen.getByTestId('pool-comparison-table')).toBeInTheDocument();
    expect(screen.getByText('Comparing 2 pools')).toBeInTheDocument();
    expect(screen.getByTestId('pool-row-pool1')).toBeInTheDocument();
    expect(screen.getByTestId('pool-row-pool2')).toBeInTheDocument();
  });

  it('allows changing timeframe', async () => {
    await act(async () => {
      render(<ComparePoolsPage />);
    });
    
    // Change to 7d timeframe
    const timeframe7d = screen.getByTestId('timeframe-7d');
    
    await act(async () => {
      fireEvent.click(timeframe7d);
    });
    
    // This test would need to verify state changes or effects of timeframe change
    // For this mock setup, we can just verify the click event works
    expect(timeframe7d).toHaveClass('active');
  });

  it.skip('allows adding a new pool to compare', async () => {
    // This would require a more complex mock setup
    // We need to add a third pool to the mockPools and simulate selection
  });

  it.skip('allows removing a pool from comparison', async () => {
    // This would require a more complex mock setup
  });

  it.skip('redirects to pools page if no pools selected', async () => {
    // This would require a more complex mock setup
  });

  it.skip('shows loading indicator when pool data is loading', async () => {
    // This would require a more complex mock setup
  });

  it.skip('shows error message when loading pools fails', async () => {
    // This would require a more complex mock setup
  });
}); 