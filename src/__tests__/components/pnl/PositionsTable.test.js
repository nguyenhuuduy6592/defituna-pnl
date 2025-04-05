import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PositionsTable } from '../../../components/pnl/PositionsTable';
import { getValueClass, getStateClass, invertPairString, copyToClipboard } from '../../../utils';

// Mock dependencies
jest.mock('../../../components/pnl/ClusterBar', () => ({
  ClusterBar: ({ size, collateral }) => (
    <div data-testid="cluster-bar">
      Size: {size?.usd}, Collateral: {collateral?.usd}
    </div>
  )
}));

jest.mock('../../../components/pnl/PriceBar', () => ({
  PriceBar: ({ currentPrice }) => (
    <div data-testid="price-bar">
      Current Price: {currentPrice}
    </div>
  )
}));

jest.mock('../../../utils', () => ({
  formatNumber: (num) => num?.toLocaleString() || 'N/A',
  formatDuration: (days) => `${days} days`,
  formatWalletAddress: (addr) => addr?.substring(0, 6) + '...' + addr?.substring(addr.length - 4) || 'N/A',
  getValueClass: jest.fn((value) => value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'),
  getStateClass: jest.fn((status) => status?.toLowerCase() || 'unknown'),
  invertPairString: jest.fn((pair) => pair?.split('/').reverse().join('/') || pair),
  copyToClipboard: jest.fn()
}));

describe('PositionsTable', () => {
  // Mock data
  const mockPositions = [
    {
      pair: 'ETH/USDC',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      displayStatus: 'Active',
      age: 30,
      pnl: { usd: 1000 },
      displayPnlPercentage: 5.25,
      yield: { usd: 200 },
      size: { usd: 10000 },
      collateral: { usd: 5000 },
      debt: { usd: 5000 },
      interest: { usd: 100 },
      currentPrice: 1800,
      entryPrice: 1700,
      leverage: 2,
      liquidationPrice: {
        lower: 1400,
        upper: 2200
      },
      rangePrices: {
        lower: 1600,
        upper: 2000
      },
      limitOrderPrices: {
        lower: 1500,
        upper: 2100
      },
      positionAddress: '0x123456'
    },
    {
      pair: 'BTC/USDT',
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      displayStatus: 'Closed',
      age: 60,
      pnl: { usd: -500 },
      displayPnlPercentage: -2.5,
      yield: { usd: 100 },
      size: { usd: 20000 },
      collateral: { usd: 10000 },
      debt: { usd: 10000 },
      interest: { usd: 200 },
      currentPrice: 32000,
      entryPrice: 33000,
      leverage: 2,
      liquidationPrice: {
        lower: 28000,
        upper: 36000
      },
      rangePrices: {
        lower: 30000,
        upper: 34000
      },
      limitOrderPrices: {
        lower: 29000,
        upper: 35000
      },
      positionAddress: '0xabcdef'
    }
  ];

  // Mock callbacks
  const onSort = jest.fn();
  const isInverted = jest.fn().mockImplementation(pair => pair === 'ETH/USDC');
  const onPairInversion = jest.fn();
  const onShare = jest.fn();
  const onShowChart = jest.fn();

  // Default props
  const defaultProps = {
    positions: mockPositions,
    showWallet: true,
    historyEnabled: true,
    sortState: { field: 'pnl', direction: 'desc' },
    onSort,
    isInverted,
    onPairInversion,
    onShare,
    onShowChart
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the table with correct headers and position data', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check headers
    expect(screen.getByText('Pair ↕')).toBeInTheDocument();
    expect(screen.getByText('Wallet ↕')).toBeInTheDocument();
    expect(screen.getByText('Status ↕')).toBeInTheDocument();
    expect(screen.getByText('Age ↕')).toBeInTheDocument();
    expect(screen.getByText('PnL ↓')).toBeInTheDocument(); // Current sort field with direction
    expect(screen.getByText('Yield ↕')).toBeInTheDocument();
    expect(screen.getByText('Position Details ↕')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check position data
    const invertedPair = invertPairString('ETH/USDC');
    expect(screen.getByText(invertedPair, { exact: false })).toBeInTheDocument(); // First pair is inverted
    expect(screen.getByText('BTC/USDT', { exact: false })).toBeInTheDocument();
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('60 days')).toBeInTheDocument();
    
    expect(screen.getByText('$1,000', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('5.25', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$-500', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('-2.5', { exact: false })).toBeInTheDocument();
    
    // Use getAllByText for yield values since they appear multiple times
    const yieldValues = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'td' && content.includes('$200');
    });
    expect(yieldValues.length).toBeGreaterThan(0);
    
    const yieldValues2 = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'td' && content.includes('$100');
    });
    expect(yieldValues2.length).toBeGreaterThan(0);
    
    // Check cluster and price bars
    expect(screen.getAllByTestId('cluster-bar')).toHaveLength(2);
    expect(screen.getAllByTestId('price-bar')).toHaveLength(2);
    
    // Check action buttons
    expect(screen.getAllByText('Share')).toHaveLength(2);
    expect(screen.getAllByText('Chart')).toHaveLength(2);
  });

  it('displays wallet addresses if showWallet is true', () => {
    render(<PositionsTable {...defaultProps} showWallet={true} />);
    
    const firstWalletAddress = mockPositions[0].walletAddress;
    const formattedAddress = firstWalletAddress.substring(0, 6) + '...' + firstWalletAddress.substring(firstWalletAddress.length - 4);
    
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
  });

  it('hides wallet addresses if showWallet is false', () => {
    render(<PositionsTable {...defaultProps} showWallet={false} />);
    
    const firstWalletAddress = mockPositions[0].walletAddress;
    const formattedAddress = firstWalletAddress.substring(0, 6) + '...' + firstWalletAddress.substring(firstWalletAddress.length - 4);
    
    expect(screen.queryByText(formattedAddress)).not.toBeInTheDocument();
  });

  it('triggers sort callback when header is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Click on a sortable header
    fireEvent.click(screen.getByText('Pair ↕'));
    
    // Check if sort callback was called with the right field
    expect(onSort).toHaveBeenCalledWith('pair');
  });

  it('triggers pair inversion when pair cell is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on the first pair cell
    const pairCells = screen.getAllByRole('button').filter(el => 
      el.textContent.includes('USDC') || el.textContent.includes('ETH')
    );
    fireEvent.click(pairCells[0]);
    
    // Check if inversion callback was called with the right pair
    expect(onPairInversion).toHaveBeenCalledWith('ETH/USDC');
  });

  it('supports keyboard navigation for pair inversion', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find pair cell and trigger keyboard event
    const pairCells = screen.getAllByRole('button').filter(el => 
      el.textContent.includes('USDC') || el.textContent.includes('ETH')
    );
    fireEvent.keyDown(pairCells[0], { key: 'Enter' });
    
    // Check if inversion callback was called with the right pair
    expect(onPairInversion).toHaveBeenCalledWith('ETH/USDC');
    
    // Reset and try with space key
    onPairInversion.mockClear();
    fireEvent.keyDown(pairCells[0], { key: ' ' });
    expect(onPairInversion).toHaveBeenCalledWith('ETH/USDC');
  });

  it('displays correct leverage for each position', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check for leverage display using getAllByText since there are multiple instances
    const leverageTexts = screen.getAllByText((content, element) => {
      return content.includes('Leverage') && element.classList.contains('positionLeverage');
    });
    expect(leverageTexts.length).toBe(2);
  });

  it('copies wallet address when wallet cell is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on a wallet cell
    const walletCells = screen.getAllByRole('button').filter(el => 
      el.getAttribute('aria-label')?.includes('Copy wallet address')
    );
    fireEvent.click(walletCells[0]);
    
    // Check if copy function was called with the right address
    expect(copyToClipboard).toHaveBeenCalledWith(mockPositions[0].walletAddress);
  });

  it('supports keyboard navigation for copying wallet address', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find wallet cell and trigger keyboard event
    const walletCells = screen.getAllByRole('button').filter(el => 
      el.getAttribute('aria-label')?.includes('Copy wallet address')
    );
    fireEvent.keyDown(walletCells[0], { key: 'Enter' });
    
    // Check if copy function was called with the right address
    expect(copyToClipboard).toHaveBeenCalledWith(mockPositions[0].walletAddress);
    
    // Reset and try with space key
    copyToClipboard.mockClear();
    fireEvent.keyDown(walletCells[0], { key: ' ' });
    expect(copyToClipboard).toHaveBeenCalledWith(mockPositions[0].walletAddress);
  });

  it('applies correct CSS classes based on PnL values', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check that getValueClass was called for PnL values
    expect(getValueClass).toHaveBeenCalledWith(1000);
    expect(getValueClass).toHaveBeenCalledWith(-500);
    
    // Check that getValueClass was called for Yield values
    expect(getValueClass).toHaveBeenCalledWith(200);
    expect(getValueClass).toHaveBeenCalledWith(100);
  });

  it('applies correct CSS classes based on position status', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check that getStateClass was called with position statuses
    expect(getStateClass).toHaveBeenCalledWith('Active');
    expect(getStateClass).toHaveBeenCalledWith('Closed');
  });

  it('triggers share callback when share button is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on the first share button
    const shareButtons = screen.getAllByText('Share');
    fireEvent.click(shareButtons[0]);
    
    // Check if share callback was called with the right position
    expect(onShare).toHaveBeenCalledWith(mockPositions[0]);
  });

  it('triggers chart callback when chart button is clicked', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Find and click on the first chart button
    const chartButtons = screen.getAllByText('Chart');
    fireEvent.click(chartButtons[0]);
    
    // Check if chart callback was called with the right position
    expect(onShowChart).toHaveBeenCalledWith(mockPositions[0]);
  });

  it('hides chart buttons if history is disabled', () => {
    render(<PositionsTable {...defaultProps} historyEnabled={false} />);
    
    // Check that chart buttons are not rendered
    expect(screen.queryByText('Chart')).not.toBeInTheDocument();
  });

  it('renders a table with appropriate accessibility attributes', () => {
    render(<PositionsTable {...defaultProps} />);
    
    // Check that the table has an accessible label
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Position details');
    
    // Check sortable headers have appropriate roles
    const sortableHeaders = screen.getAllByRole('button').filter(el => 
      el.tagName.toLowerCase() === 'th'
    );
    expect(sortableHeaders.length).toBeGreaterThan(0);
    
    // Check sort headers have appropriate aria-sort attributes
    const pnlHeader = screen.getByText('PnL ↓');
    expect(pnlHeader).toHaveAttribute('aria-sort', 'desc');
  });
}); 