import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolDetailPage from '../../../pages/pools/[address]';
import { useRouter } from 'next/router';
import { usePoolData } from '../../../hooks/usePoolData';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock the usePoolData hook
jest.mock('../../../hooks/usePoolData', () => ({
  usePoolData: jest.fn()
}));

// Mock the Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock the PoolMetrics component
jest.mock('../../../components/pools/PoolMetrics', () => {
  return function MockPoolMetrics({ poolId, timeframe }) {
    return (
      <div 
        data-testid="pool-metrics" 
        data-pool-id={poolId}
        data-timeframe={timeframe}
      >
        Pool Metrics Component
      </div>
    );
  };
});

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

describe('Pool Detail Page', () => {
  const mockPool = {
    address: 'pool123',
    tokenA: { symbol: 'ETH', logoURI: '/eth.png' },
    tokenB: { symbol: 'USDC', logoURI: '/usdc.png' },
    tvl_usdc: 1000000,
    fee_rate: 500,
    currentPrice: 1800,
    provider: 'orca'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    useRouter.mockReturnValue({
      query: { address: 'pool123' },
      isReady: true
    });
    
    // Mock pool data
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: mockPool
    });
  });
  
  it('renders the pool detail page with correct title and token pair', () => {
    render(<PoolDetailPage />);
    
    expect(screen.getByText('ETH/USDC Pool')).toBeInTheDocument();
  });
  
  it('renders timeframe selector', () => {
    render(<PoolDetailPage />);
    
    expect(screen.getByTestId('timeframe-selector')).toBeInTheDocument();
  });
  
  it('renders pool metrics component with correct props', () => {
    render(<PoolDetailPage />);
    
    const metricsComponent = screen.getByTestId('pool-metrics');
    expect(metricsComponent).toBeInTheDocument();
    expect(metricsComponent).toHaveAttribute('data-pool-id', 'pool123');
    expect(metricsComponent).toHaveAttribute('data-timeframe', '24h'); // Default timeframe
  });
  
  it('renders loading state when router is not ready', () => {
    useRouter.mockReturnValue({
      query: {},
      isReady: false
    });
    
    render(<PoolDetailPage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('renders loading state when pool data is loading', () => {
    usePoolData.mockReturnValue({
      loading: true,
      error: null,
      data: null
    });
    
    render(<PoolDetailPage />);
    
    expect(screen.getByText('Loading pool data...')).toBeInTheDocument();
  });
  
  it('renders error state when pool data fails to load', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: 'Failed to load pool data',
      data: null
    });
    
    render(<PoolDetailPage />);
    
    expect(screen.getByText('Error: Failed to load pool data')).toBeInTheDocument();
  });
  
  it('renders not found message when pool cannot be found', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: 'Pool not found',
      data: null
    });
    
    render(<PoolDetailPage />);
    
    expect(screen.getByText('Error: Pool not found')).toBeInTheDocument();
  });
  
  it('includes a link back to all pools', () => {
    render(<PoolDetailPage />);
    
    const backLink = screen.getByText('Back to All Pools');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/pools');
  });
  
  it('shows provider information', () => {
    render(<PoolDetailPage />);
    
    expect(screen.getByText(/Provider:/)).toBeInTheDocument();
    expect(screen.getByText(/Orca/i)).toBeInTheDocument();
  });
}); 