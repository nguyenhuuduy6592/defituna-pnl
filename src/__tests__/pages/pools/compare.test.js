import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock the TimeframeSelector component
jest.mock('../../../components/common/TimeframeSelector', () => {
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
});

describe('Compare Pools Page', () => {
  const mockPools = [
    {
      address: 'pool1',
      tokenA: { symbol: 'ETH' },
      tokenB: { symbol: 'USDC' },
      tvl_usdc: 1000000,
      fee_rate: 500,
      provider: 'orca'
    },
    {
      address: 'pool2',
      tokenA: { symbol: 'SOL' },
      tokenB: { symbol: 'USDT' },
      tvl_usdc: 500000,
      fee_rate: 300,
      provider: 'raydium'
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
}); 