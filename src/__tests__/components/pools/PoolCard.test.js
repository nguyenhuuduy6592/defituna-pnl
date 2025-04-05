import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolCard from '../../../components/pools/PoolCard';
import { usePoolData } from '../../../hooks/usePoolData';

// Mock the Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return (
      <a href={href} data-testid="next-link">
        {children}
      </a>
    );
  };
});

// Mock the usePoolData hook
jest.mock('../../../hooks/usePoolData', () => ({
  usePoolData: jest.fn()
}));

// Mock the CompareButton component
jest.mock('../../../components/pools/CompareButton', () => {
  return function MockCompareButton({ pool }) {
    return <div data-testid="compare-button" data-pool-address={pool.address}>Compare Button</div>;
  };
});

// Mock the InfoIcon component
jest.mock('../../../components/common/InfoIcon', () => {
  return function MockInfoIcon({ content, position }) {
    return <span data-testid="info-icon" data-content={content} data-position={position}>ℹ️</span>;
  };
});

describe('PoolCard Component', () => {
  const mockPool = {
    address: '0xpool123',
    token_a_mint: '0xtoken_a',
    token_b_mint: '0xtoken_b',
    tokenA: { symbol: 'ETH', logoURI: '/eth.png' },
    tokenB: { symbol: 'USDC', logoURI: '/usdc.png' },
    tvl_usdc: 1000000,
    fee_rate: 500, // 0.05% (500 / 10000)
    currentPrice: 1800,
    stats: {
      '24h': {
        volume: 500000,
        fees: 250,
        yield_over_tvl: 0.05 // 5%
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the derived metrics from usePoolData
    usePoolData.mockReturnValue({
      feeAPR: 12.5,
      volumeTVLRatio: 0.5,
      loading: false
    });
  });

  it('renders the pool card with correct token pair', () => {
    render(<PoolCard pool={mockPool} />);
    
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('renders price information when available', () => {
    render(<PoolCard pool={mockPool} />);
    
    // Match the formatted price (may vary based on formatter)
    expect(screen.getByText(/1 ETH = 1/)).toBeInTheDocument();
  });

  it('renders formatted TVL value', () => {
    render(<PoolCard pool={mockPool} />);
    
    expect(screen.getByText('TVL')).toBeInTheDocument();
    // Match the correct formatting from the component
    expect(screen.getByText('$1.00M')).toBeInTheDocument();
  });

  it('renders formatted volume value for the default timeframe', () => {
    render(<PoolCard pool={mockPool} />);
    
    expect(screen.getByText('Volume')).toBeInTheDocument();
    // Match the correct formatting from the component
    expect(screen.getByText('$500.00K')).toBeInTheDocument();
  });

  it('renders fee rate correctly', () => {
    render(<PoolCard pool={mockPool} />);
    
    // Find the container for the Fee section
    const feeSection = screen.getByText('Fee').closest('.metric');
    
    // Within that container, find the value
    expect(within(feeSection).getByText('5.00%')).toBeInTheDocument();
  });

  it('renders derived metrics from usePoolData', () => {
    render(<PoolCard pool={mockPool} />);
    
    expect(screen.getByText('Fee APR')).toBeInTheDocument();
    expect(screen.getByText('12.50%')).toBeInTheDocument();
    
    expect(screen.getByText('Volume/TVL')).toBeInTheDocument();
    expect(screen.getByText('0.50')).toBeInTheDocument();
  });

  it('displays loading state for derived metrics', () => {
    // Mock loading state
    usePoolData.mockReturnValue({
      feeAPR: 0,
      volumeTVLRatio: 0,
      loading: true
    });
    
    render(<PoolCard pool={mockPool} />);
    
    // Use getAllByText because there might be multiple elements with this text
    expect(screen.getAllByText('...')).toHaveLength(2);
  });

  it('includes the CompareButton component', () => {
    render(<PoolCard pool={mockPool} />);
    
    const compareButton = screen.getByTestId('compare-button');
    expect(compareButton).toBeInTheDocument();
    expect(compareButton).toHaveAttribute('data-pool-address', mockPool.address);
  });

  it('includes a link to the pool detail page', () => {
    render(<PoolCard pool={mockPool} />);
    
    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('href', `/pools/${mockPool.address}`);
  });

  it('handles missing token symbols by using address placeholders', () => {
    const poolWithoutSymbols = {
      ...mockPool,
      tokenA: undefined,
      tokenB: undefined
    };
    
    render(<PoolCard pool={poolWithoutSymbols} />);
    
    // The token pair section contains the symbols
    const tokenPair = screen.getByText('/').closest('.tokenPair');
    
    // Within that container, check for "Unknown" tokens
    const unknownTokens = within(tokenPair).getAllByText('Unknown');
    expect(unknownTokens).toHaveLength(2);
  });

  it('renders info icons for metrics with tooltips', () => {
    render(<PoolCard pool={mockPool} />);
    
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  it('renders pool card correctly with different timeframe', () => {
    const poolWithTimeframes = {
      ...mockPool,
      stats: {
        '24h': { volume: 500000, fees: 250, yield_over_tvl: 0.05 },
        '7d': { volume: 3500000, fees: 1750, yield_over_tvl: 0.07 }
      }
    };
    
    render(<PoolCard pool={poolWithTimeframes} timeframe="7d" />);
    
    // Should display 7d stats (using the expected format from the component)
    expect(screen.getByText('$3.50M')).toBeInTheDocument();
  });
}); 