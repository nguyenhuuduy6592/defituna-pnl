import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolDetailPage from '@/pages/pools/[address]';
import { useRouter } from 'next/router';
import usePoolsData from '@/hooks/usePoolsData';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock the usePoolsData hook (the one actually used by the component)
jest.mock('@/hooks/usePoolsData', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock the PoolMetrics component
jest.mock('@/components/pools/PoolMetrics', () => {
  // Mock needs to accept poolAddress prop
  return function MockPoolMetrics({ poolAddress, timeframe }) {
    return (
      <div 
        data-testid="pool-metrics" 
        data-pool-address={poolAddress} // Use poolAddress prop
        data-timeframe={timeframe}
      >
        Pool Metrics Component Mock
      </div>
    );
  };
});

describe('Pool Detail Page', () => {
  const mockPool = {
    address: 'pool123',
    tokenA: { symbol: 'ETH', logoURI: '/eth.png' },
    tokenB: { symbol: 'USDC', logoURI: '/usdc.png' },
    token_a_mint: 'mintA',
    token_b_mint: 'mintB',
    tvl_usdc: 1000000,
    fee_rate: 500,
    protocol_fee_rate: 100,
    currentPrice: 1800,
    provider: 'Orca',
    liquidity: '123456789',
    sqrt_price: '987654321',
    stats: {
      '24h': { volume: 50000, fees: 25, yield_over_tvl: 0.0005 },
      '7d': { volume: 350000, fees: 175, yield_over_tvl: 0.0035 },
      '30d': { volume: 1500000, fees: 750, yield_over_tvl: 0.015 },
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock router (ready with address)
    useRouter.mockReturnValue({
      query: { address: 'pool123' },
      isReady: true
    });
    
    // Default mock pools data (successful load)
    usePoolsData.mockReturnValue({
      pools: [mockPool],
      loading: false,
      error: null
    });
  });
  
  it('renders the pool detail page header and token pair', () => {
    render(<PoolDetailPage />);
    
    // Check for the main heading
    expect(screen.getByRole('heading', { name: /Pool Details/i })).toBeInTheDocument();
    
    // Check for token symbols rendering
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });
  
  it('renders timeframe selector buttons', () => {
    render(<PoolDetailPage />);
    
    // Check for the timeframe buttons rendered by the component itself
    expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument();
    
    // Check default selection
    expect(screen.getByRole('button', { name: '24h' })).toHaveClass('active');
  });
  
  it('renders pool metrics component with correct props', () => {
    render(<PoolDetailPage />);
    
    const metricsComponent = screen.getByTestId('pool-metrics');
    expect(metricsComponent).toBeInTheDocument();
    // Prop name is poolAddress in the mock
    expect(metricsComponent).toHaveAttribute('data-pool-address', 'pool123');
    expect(metricsComponent).toHaveAttribute('data-timeframe', '24h'); // Default timeframe
  });
  
  it('updates pool metrics timeframe on button click', () => {
    render(<PoolDetailPage />);
    
    const button7d = screen.getByRole('button', { name: '7d' });
    fireEvent.click(button7d);
    
    const metricsComponent = screen.getByTestId('pool-metrics');
    expect(metricsComponent).toHaveAttribute('data-timeframe', '7d');
    expect(button7d).toHaveClass('active');
    expect(screen.getByRole('button', { name: '24h' })).not.toHaveClass('active');
  });
  
  it('renders loading state when router is not ready', () => {
    useRouter.mockReturnValue({
      query: {}, // No address yet
      isReady: false
    });
    // Need to mock usePoolsData as well, even if router isn't ready
    usePoolsData.mockReturnValue({ pools: null, loading: true, error: null });
    
    render(<PoolDetailPage />);
    
    // Component renders specific message when address is missing
    expect(screen.getByText('No pool address provided')).toBeInTheDocument();
  });
  
  it('renders loading state when pools data is loading', () => {
    // Keep router ready, but make pools data load
    usePoolsData.mockReturnValue({
      pools: null,
      loading: true,
      error: null
    });
    
    render(<PoolDetailPage />);
    
    // Component renders its internal loading state
    expect(screen.getByText('Loading pool data...')).toBeInTheDocument();
  });
  
  it('renders error state when pools data fails to load', () => {
    // Keep router ready, but make pools data return an error
    usePoolsData.mockReturnValue({
      pools: null,
      loading: false,
      error: 'Network Error fetching pools' 
    });
    
    render(<PoolDetailPage />);
    
    // Component renders the error received from the hook
    expect(screen.getByText('Network Error fetching pools')).toBeInTheDocument();
  });
  
  it('renders not found message when pool cannot be found in data', () => {
    // Keep router ready, return empty pools array
    usePoolsData.mockReturnValue({
      pools: [], // Pool 'pool123' won't be found
      loading: false,
      error: null
    });
    
    render(<PoolDetailPage />);
    
    // Component throws and catches an error internally, displaying this message
    expect(screen.getByText('Pool not found')).toBeInTheDocument();
  });
  
  it('includes links back to all pools and home', () => {
    render(<PoolDetailPage />);
    
    const backToPoolsButton = screen.getByRole('button', { name: '← Back to Pools' });
    expect(backToPoolsButton).toBeInTheDocument();
    // Check the parent anchor link's href
    const backLink = backToPoolsButton.closest('a');
    expect(backLink).toHaveAttribute('href', '/pools');

    const homeButton = screen.getByRole('button', { name: 'Home' });
    expect(homeButton).toBeInTheDocument();
    const homeLink = homeButton.closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });
  
  it('shows provider information', () => {
    render(<PoolDetailPage />);
    
    // Check the text rendered by the component
    expect(screen.getByText(/provided by/i)).toBeInTheDocument();
    // Check the provider name within its span
    const providerSpan = screen.getByText('Orca');
    expect(providerSpan).toBeInTheDocument();
    expect(providerSpan.tagName).toBe('SPAN');
  });

  it('displays formatted stats like TVL, Volume, Fees, Yield, Fee Rate', () => {
    render(<PoolDetailPage />);

    // Check for formatted values based on mockPool and timeframe '24h'
    expect(screen.getByText('TVL')).toBeInTheDocument();
    expect(screen.getByText('$1.00M')).toBeInTheDocument(); // From mockPool.tvl_usdc

    expect(screen.getByText('Volume (24h)')).toBeInTheDocument();
    expect(screen.getByText('$50.00K')).toBeInTheDocument(); // From mockPool.stats['24h'].volume (Corrected: Uppercase K)

    expect(screen.getByText('Fees (24h)')).toBeInTheDocument();
    // Note: formatFee adds $, formatNumber doesn't. The component uses formatFee for fees.
    expect(screen.getByText('$25.00')).toBeInTheDocument(); // From mockPool.stats['24h'].fees (Corrected: Added $)

    expect(screen.getByText('Yield (24h)')).toBeInTheDocument();
    expect(screen.getByText('0.05%')).toBeInTheDocument(); // From mockPool.stats['24h'].yield_over_tvl

    expect(screen.getByText('Fee Rate')).toBeInTheDocument();
    expect(screen.getByText('5.00%')).toBeInTheDocument(); // From mockPool.fee_rate / 10000
  });

  it('displays technical details like Liquidity, Sqrt Price, Protocol Fee', () => {
    render(<PoolDetailPage />);

    expect(screen.getByText('Liquidity')).toBeInTheDocument();
    expect(screen.getByText('123.46M')).toBeInTheDocument(); // From mockPool.liquidity (Corrected: Abbreviated)

    expect(screen.getByText('Sqrt Price')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument(); // From mockPool.sqrt_price

    expect(screen.getByText('Protocol Fee')).toBeInTheDocument();
    expect(screen.getByText('1.00%')).toBeInTheDocument(); // From mockPool.protocol_fee_rate / 10000
  });
}); 