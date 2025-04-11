import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolComparisonPage from '@/pages/pools/compare';
import { useComparison } from '@/contexts/ComparisonContext';
import * as formatters from '@/utils/formatters'; // Import all formatters

// Mock Next.js components
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }) => <>{children}</>,
  };
});
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, className }) => <a href={href} className={className} data-testid={`link-to-${href}`}>{children}</a>,
  };
});

// Mock context hook
jest.mock('@/contexts/ComparisonContext');

// Mock PoolMetrics component
jest.mock('@/components/pools/PoolMetrics', () => {
  return {
    __esModule: true,
    default: ({ poolAddress, timeframe }) => (
      <div data-testid={`pool-metrics-${poolAddress}-${timeframe}`}>Metrics for {poolAddress} ({timeframe})</div>
    ),
  };
});

// Helper function to create mock pool data
// Note: fee_rate in API is basis points (e.g., 5 = 0.05%)
const createMockPool = (id, symbolA, symbolB, tvl, vol24, fee24, yield24, feeRate = 5) => ({
  address: id,
  tokenA: { symbol: symbolA },
  tokenB: { symbol: symbolB },
  tvl_usdc: tvl,
  stats: { 
    '24h': { volume: vol24, fees: fee24, yield_over_tvl: yield24 },
    '7d': { volume: vol24 * 6, fees: fee24 * 6, yield_over_tvl: yield24 * 0.9 }, // Mock different data
    '30d': { volume: vol24 * 25, fees: fee24 * 25, yield_over_tvl: yield24 * 0.8 },
   },
  fee_rate: feeRate, // Use basis points directly
  protocol_fee_rate: 0, // Assume 0 for simplicity
});


describe('PoolComparisonPage (/pools/compare)', () => {
  const mockRemovePool = jest.fn();
  const mockClearComparison = jest.fn();
  const mockPool1 = createMockPool('pool1', 'SOL', 'USDC', 1000000, 50000, 50, 0.0005, 5); // 0.05% fee rate
  const mockPool2 = createMockPool('pool2', 'ETH', 'USDT', 2000000, 100000, 100, 0.0004, 10); // 0.10% fee rate

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock state with pools
    useComparison.mockReturnValue({
      comparisonPools: [mockPool1, mockPool2],
      removePoolFromComparison: mockRemovePool,
      clearComparison: mockClearComparison,
    });
  });

  it('renders the page title and heading', () => {
    render(<PoolComparisonPage />);
    // Title is set in <Head> which is mocked, so we can't directly assert document.title
    expect(screen.getByRole('heading', { name: /Pool Comparison/i })).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<PoolComparisonPage />);
    expect(screen.getByTestId('link-to-/pools')).toHaveTextContent('← Back to Pools');
    expect(screen.getByTestId('link-to-/')).toHaveTextContent('Home');
  });

  it('renders the empty state when no pools are selected', () => {
    useComparison.mockReturnValueOnce({ comparisonPools: [], removePoolFromComparison: mockRemovePool, clearComparison: mockClearComparison });
    render(<PoolComparisonPage />);
    expect(screen.getByText(/No pools selected for comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/pools page/i).closest('a')).toHaveAttribute('href', '/pools');
    expect(screen.getByRole('button', { name: /Clear All/i })).toBeDisabled(); // Clear button disabled
  });

  it("renders the timeframe selector with default selection ('24h')", () => {
    render(<PoolComparisonPage />);
    const button24h = screen.getByRole('button', { name: '24h' });
    const button7d = screen.getByRole('button', { name: '7d' });
    const button30d = screen.getByRole('button', { name: '30d' });
    expect(button24h).toHaveClass('active');
    expect(button7d).not.toHaveClass('active');
    expect(button30d).not.toHaveClass('active');
  });

  it('changes the displayed metrics when timeframe is changed', () => {
    // Using a simple check by looking for the timeframe in the metric label
    render(<PoolComparisonPage />);
    expect(screen.getByText(/Volume \(24h\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Volume \(7d\)/i)).not.toBeInTheDocument();

    const button7d = screen.getByRole('button', { name: '7d' });
    fireEvent.click(button7d);

    expect(button7d).toHaveClass('active');
    expect(screen.queryByText(/Volume \(24h\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Volume \(7d\)/i)).toBeInTheDocument(); 
  });

  it('renders the comparison grid with pool headers when pools exist', () => {
    render(<PoolComparisonPage />);
    expect(screen.getByText('SOL/USDC')).toBeInTheDocument();
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByLabelText(`Remove SOL/USDC from comparison`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Remove ETH/USDT from comparison`)).toBeInTheDocument();
  });

  it('calls removePoolFromComparison when a remove button is clicked', () => {
    render(<PoolComparisonPage />);
    const removeButtonPool1 = screen.getByLabelText(`Remove SOL/USDC from comparison`);
    fireEvent.click(removeButtonPool1);
    expect(mockRemovePool).toHaveBeenCalledWith('pool1');
    expect(mockRemovePool).toHaveBeenCalledTimes(1);
  });

  it('calls clearComparison when the Clear All button is clicked', () => {
    render(<PoolComparisonPage />);
    const clearButton = screen.getByRole('button', { name: /Clear All/i });
    expect(clearButton).toBeEnabled();
    fireEvent.click(clearButton);
    expect(mockClearComparison).toHaveBeenCalledTimes(1);
  });

  it('renders basic metrics labels', () => {
    render(<PoolComparisonPage />);
    expect(screen.getByText('TVL')).toBeInTheDocument();
    expect(screen.getByText(/Volume \(24h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fees \(24h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Yield \(24h\)/i)).toBeInTheDocument();
    expect(screen.getByText('Fee Rate')).toBeInTheDocument();
  });
  
  it('renders basic metrics values correctly formatted', () => {
    render(<PoolComparisonPage />);
    
    // Find the row containing the 'Fee Rate' label
    const feeRateLabel = screen.getByText('Fee Rate');
    const feeRateRow = feeRateLabel.closest('.comparisonRow'); // Find the parent row
    expect(feeRateRow).toBeInTheDocument(); // Ensure the row was found

    // Within that row, find all pool columns using querySelectorAll as role/name wasn't found
    const poolColumns = feeRateRow.querySelectorAll('.poolColumn'); // Use querySelectorAll based on class
    expect(poolColumns.length).toBeGreaterThanOrEqual(2); // Ensure we have columns for our pools

    // Spot check pool1's 24h Volume (using getAllByText as volume might appear elsewhere)
    expect(screen.getAllByText(formatters.formatFee(mockPool1.stats['24h'].volume || 0, true))[0]).toBeInTheDocument();
    // Spot check pool2's TVL
    expect(screen.getByText(formatters.formatFee(mockPool2.tvl_usdc, true))).toBeInTheDocument();
    
    // Spot check pool1's Fee Rate (formatted) within its specific column
    const pool1FeeRateValue = within(poolColumns[0]).getByText(formatters.formatPercentage(mockPool1.fee_rate / 10000));
    expect(pool1FeeRateValue).toBeInTheDocument(); 

    // Spot check pool2's Fee Rate (formatted) within its specific column
    const pool2FeeRateValue = within(poolColumns[1]).getByText(formatters.formatPercentage(mockPool2.fee_rate / 10000));
    expect(pool2FeeRateValue).toBeInTheDocument();
  });

  it('renders PoolMetrics component for each pool with correct props', () => {
    render(<PoolComparisonPage />);
    expect(screen.getByTestId('pool-metrics-pool1-24h')).toBeInTheDocument();
    expect(screen.getByTestId('pool-metrics-pool2-24h')).toBeInTheDocument();

    // Change timeframe and check again
    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    expect(screen.getByTestId('pool-metrics-pool1-7d')).toBeInTheDocument();
    expect(screen.getByTestId('pool-metrics-pool2-7d')).toBeInTheDocument();
  });

  it('renders View Pool Details link for each pool', () => {
    render(<PoolComparisonPage />);
    expect(screen.getByTestId('link-to-/pools/pool1')).toHaveTextContent('View Pool Details');
    expect(screen.getByTestId('link-to-/pools/pool2')).toHaveTextContent('View Pool Details');
  });
}); 