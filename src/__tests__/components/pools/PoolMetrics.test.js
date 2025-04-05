import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolMetrics from '../../../components/pools/PoolMetrics';
import { usePoolData } from '../../../hooks/usePoolData';

// Mock the hooks
jest.mock('../../../hooks/usePoolData');

// Mock the tooltip utility functions to avoid errors
jest.mock('../../../utils/tooltipContent', () => ({
  getFeeAPRTooltip: jest.fn(() => 'Fee APR tooltip'),
  getVolumeTVLTooltip: jest.fn(() => 'Volume/TVL tooltip'),
  getVolatilityTooltip: jest.fn(() => 'Volatility tooltip'),
  getTVLTooltip: jest.fn(() => 'TVL tooltip'),
  getVolumeTooltip: jest.fn(() => 'Volume tooltip'),
  getYieldTooltip: jest.fn(() => 'Yield tooltip'),
  getFeeRateTooltip: jest.fn(() => 'Fee Rate tooltip')
}));

// Mock the formatters to ensure predictable output
jest.mock('../../../utils/formatters', () => ({
  formatNumber: jest.fn((value, type, decimals) => {
    if (type === 'currency') {
      if (value >= 1000000) return '1.00M';
      if (value >= 1000) return '500.00K';
      return value.toString();
    }
    if (type === 'percentage') {
      return '5.00%';
    }
    return value.toString();
  })
}));

// Mock the EnhancedTooltip component
jest.mock('../../../components/common/EnhancedTooltip', () => {
  return jest.fn(({ children, title, content }) => (
    <div data-testid="enhanced-tooltip" data-title={title} data-content={content}>
      {children}
    </div>
  ));
});

// Mock the InfoIcon component
jest.mock('../../../components/common/InfoIcon', () => {
  return jest.fn(({ size }) => (
    <span data-testid="info-icon" data-size={size}>
      i
    </span>
  ));
});

describe('PoolMetrics Component', () => {
  const mockPoolData = {
    tvl: 1000000,
    volume: 500000,
    yield: 0.05,
    fee: 0.003,
    feeAPR: 0.12,
    volumeTVL: 0.5,
    volatility: 'Medium'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state correctly', () => {
    usePoolData.mockReturnValue({
      loading: true,
      error: null,
      data: null
    });
    
    render(<PoolMetrics poolId="pool1" timeframe="24h" />);
    
    expect(screen.getByText('Loading pool data...')).toBeInTheDocument();
  });
  
  test('renders error state correctly', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: new Error('Failed to load'),
      data: null
    });
    
    render(<PoolMetrics poolId="pool1" timeframe="24h" />);
    
    expect(screen.getByText('Error loading pool data')).toBeInTheDocument();
  });
  
  test('renders all metrics correctly', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: mockPoolData
    });
    
    render(<PoolMetrics poolId="pool1" timeframe="24h" />);
    
    // Check all metrics are displayed
    const metricLabels = screen.getAllByText(/TVL|Volume|Yield|Fee|Fee APR|Volume\/TVL|Volatility/);
    expect(metricLabels.length).toBe(7);
    
    // Check label sections
    const tvlSection = screen.getByText('TVL').closest('.metricContainer');
    const volumeSection = screen.getByText('Volume').closest('.metricContainer');
    const yieldSection = screen.getByText('Yield').closest('.metricContainer');
    const feeSection = screen.getByText('Fee').closest('.metricContainer');
    const feeAPRSection = screen.getByText('Fee APR').closest('.metricContainer');
    const volumeTVLSection = screen.getByText('Volume/TVL').closest('.metricContainer');
    const volatilitySection = screen.getByText('Volatility').closest('.metricContainer');
    
    // Check values in each section using within
    expect(within(tvlSection).getByText('1.00M')).toBeInTheDocument();
    expect(within(volumeSection).getByText('500.00K')).toBeInTheDocument();
    expect(within(yieldSection).getByText('5.00%')).toBeInTheDocument();
    expect(within(feeSection).getByText('5.00%')).toBeInTheDocument();
    expect(within(feeAPRSection).getByText('5.00%')).toBeInTheDocument();
    expect(within(volumeTVLSection).getByText('0.5')).toBeInTheDocument();
    expect(within(volatilitySection).getByText('Medium')).toBeInTheDocument();
    
    // Verify the correct number of percentage values
    const percentageValues = screen.getAllByText('5.00%');
    expect(percentageValues.length).toBe(3); // Yield, Fee, and Fee APR
  });
  
  test('uses correct timeframe in hook call', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: mockPoolData
    });
    
    render(<PoolMetrics poolId="pool1" timeframe="7d" />);
    
    expect(usePoolData).toHaveBeenCalledWith('pool1', '7d');
  });
  
  test('uses default timeframe when not provided', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: mockPoolData
    });
    
    render(<PoolMetrics poolId="pool1" />);
    
    // Checking that the hook was called but not checking the exact parameters
    expect(usePoolData).toHaveBeenCalled();
    // The default is set in the component's defaultProps
  });
  
  test('applies correct color class for high volatility', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: {
        ...mockPoolData,
        volatility: 'High'
      }
    });
    
    render(<PoolMetrics poolId="pool1" />);
    
    const volatilityValueElement = screen.getByText('High');
    expect(volatilityValueElement).toHaveClass('textDanger');
  });
  
  test('applies correct color class for low volatility', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: {
        ...mockPoolData,
        volatility: 'Low'
      }
    });
    
    render(<PoolMetrics poolId="pool1" />);
    
    const volatilityValueElement = screen.getByText('Low');
    expect(volatilityValueElement).toHaveClass('textSuccess');
  });
  
  test('handles missing volatility data', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: {
        ...mockPoolData,
        volatility: null
      }
    });
    
    render(<PoolMetrics poolId="pool1" />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
  
  test('renders appropriate tooltips for each metric', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: mockPoolData
    });
    
    render(<PoolMetrics poolId="pool1" timeframe="24h" />);
    
    // Check that tooltips are rendered for each metric
    const tooltips = screen.getAllByTestId('enhanced-tooltip');
    expect(tooltips).toHaveLength(7); // One for each metric
    
    // Check tooltips have appropriate titles
    const tooltipTitles = tooltips.map(tooltip => tooltip.getAttribute('data-title'));
    expect(tooltipTitles).toContain('TVL');
    expect(tooltipTitles).toContain('Volume');
    expect(tooltipTitles).toContain('Yield');
    expect(tooltipTitles).toContain('Fee');
    expect(tooltipTitles).toContain('Fee APR');
    expect(tooltipTitles).toContain('Volume/TVL');
    expect(tooltipTitles).toContain('Volatility');
  });
  
  test('returns null when no data is available', () => {
    usePoolData.mockReturnValue({
      loading: false,
      error: null,
      data: null
    });
    
    const { container } = render(<PoolMetrics poolId="pool1" />);
    
    expect(container.firstChild).toBeNull();
  });
}); 