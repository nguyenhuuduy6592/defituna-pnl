import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PnLCard } from '../../../components/pnl/PnLCard';
import { exportCardAsImage, shareCard } from '../../../utils/export';
import { getValueClass } from '../../../utils/styles';
import { getStateClass } from '../../../utils/positionUtils';

// Mock dependencies
jest.mock('../../../components/common/Portal', () => ({
  Portal: ({ children }) => <div data-testid="portal-container">{children}</div>
}));

jest.mock('../../../utils/export', () => ({
  exportCardAsImage: jest.fn(),
  shareCard: jest.fn()
}));

jest.mock('../../../utils/styles', () => ({
  getValueClass: jest.fn().mockReturnValue('positive')
}));

jest.mock('../../../utils/positionUtils', () => ({
  getStateClass: jest.fn().mockReturnValue('active')
}));

jest.mock('react-icons/hi', () => ({
  HiX: () => <span data-testid="close-icon">X</span>,
  HiDownload: () => <span data-testid="download-icon">Download</span>,
  HiShare: () => <span data-testid="share-icon">Share</span>
}));

jest.mock('react-icons/bs', () => ({
  BsCurrencyDollar: () => <span data-testid="currency-icon">$</span>,
  BsClock: () => <span data-testid="clock-icon">Clock</span>
}));

jest.mock('react-icons/fa', () => ({
  FaBalanceScale: () => <span data-testid="scale-icon">Scale</span>,
  FaCoins: () => <span data-testid="coins-icon">Coins</span>,
  FaSyncAlt: () => <span data-testid="sync-icon">Sync</span>,
  FaWallet: () => <span data-testid="wallet-icon">Wallet</span>,
  FaArrowsAltH: () => <span data-testid="arrows-h-icon">Arrows</span>,
  FaInfoCircle: () => <span data-testid="info-icon">Info</span>,
  FaCalendarCheck: () => <span data-testid="calendar-icon">Calendar</span>,
  FaExclamationTriangle: () => <span data-testid="warning-icon">Warning</span>,
  FaArrowsAltV: () => <span data-testid="arrows-v-icon">Arrows</span>
}));

describe('PnLCard', () => {
  // Mock position data
  const defaultPosition = {
    pair: 'ETH/USDC',
    pairDisplay: 'ETH/USDC',
    displayStatus: 'Active',
    displayPnlPercentage: 5.25,
    pnl: { usd: 1000 },
    yield: { usd: 200 },
    compounded: { usd: 50 },
    collateral: { usd: 5000 },
    leverage: 2,
    currentPrice: 1800,
    rangePrices: {
      lower: 1600,
      upper: 2000
    },
    liquidationPrice: {
      lower: 1400,
      upper: 2200
    },
    limitOrderPrices: {
      lower: 1500,
      upper: 2100
    },
    positionAddress: '0x123456',
    age: 30 // days
  };

  // Mock callbacks and utility functions
  const onClose = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders the card with correct position details', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Check that the modal has rendered with correct role
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Check title and pair display
    expect(screen.getByText('Position Details')).toBeInTheDocument();
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
    
    // Check status badge
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Check PnL display - get element with role status
    const pnlValue = screen.getByRole('status');
    expect(pnlValue).toBeInTheDocument();
    expect(pnlValue).toHaveTextContent('1.00K');
    
    // Check for the percentage - it's in a nested element
    const pnlContent = pnlValue.textContent;
    expect(pnlContent).toContain('5.25');
    expect(pnlContent).toContain('%');
    
    // Check financial details - using the actual formatting with K for thousands
    expect(screen.getByText(/Collateral/i)).toBeInTheDocument();
    expect(screen.getByText('$5.00K')).toBeInTheDocument();
    expect(screen.getByText(/Leverage/i)).toBeInTheDocument();
    expect(screen.getByText('2.00x')).toBeInTheDocument();
    
    // Check price information - using the actual formatting with K for thousands
    expect(screen.getByText(/Range/i)).toBeInTheDocument();
    expect(screen.getByText('$1.60K - $2.00K')).toBeInTheDocument();
    
    // Check action buttons using test ids
    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    expect(screen.getByTestId('share-icon')).toBeInTheDocument();
  });

  it('closes when clicking the close button', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Click the close button using test id
    fireEvent.click(screen.getByTestId('close-icon').closest('button'));
    
    // onClose should have been called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking outside the card', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Click the overlay (the dialog element itself)
    fireEvent.click(screen.getByRole('dialog'));
    
    // onClose should have been called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when pressing the escape key', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Simulate pressing escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // onClose should have been called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exports the card as an image when clicking the download button', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Find the download button by its container and icon
    const downloadButton = screen.getByTestId('download-icon').closest('button');
    fireEvent.click(downloadButton);
    
    // exportCardAsImage should have been called
    expect(exportCardAsImage).toHaveBeenCalledTimes(1);
    // Check that first argument is provided
    expect(exportCardAsImage.mock.calls[0][0]).toBeTruthy();
    // Check filename contains the pair
    expect(exportCardAsImage.mock.calls[0][1]).toContain('ETH/USDC');
  });

  it('shares the card when clicking the share button', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Find the share button by its container and icon
    const shareButton = screen.getByTestId('share-icon').closest('button');
    fireEvent.click(shareButton);
    
    // shareCard should have been called
    expect(shareCard).toHaveBeenCalledTimes(1);
    // Check that first argument is provided
    expect(shareCard.mock.calls[0][0]).toBeTruthy();
    // Check that the pair name is in the other arguments
    expect(shareCard.mock.calls[0][2]).toContain('ETH/USDC');
  });

  it('displays appropriate status for closed position', () => {
    const closedPosition = {
      ...defaultPosition,
      displayStatus: 'Closed',
      closedAt: Date.now()
    };
    
    getStateClass.mockReturnValue('closed');
    
    render(<PnLCard position={closedPosition} onClose={onClose} />);
    
    // Check status badge
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('handles missing or incomplete data gracefully', () => {
    const incompletePosition = {
      pair: 'ETH/USDC',
      pnl: { usd: 1000 },
      yield: { usd: 0 },
      compounded: { usd: 0 }
    };
    
    render(<PnLCard position={incompletePosition} onClose={onClose} />);
    
    // Check that pair is displayed (using fallback from pair if pairDisplay is missing)
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
  });

  it('applies correct CSS classes based on component status', () => {
    render(<PnLCard position={defaultPosition} onClose={onClose} />);
    
    // Check that getValueClass was called
    expect(getValueClass).toHaveBeenCalled();
    
    // Check that getStateClass was called
    expect(getStateClass).toHaveBeenCalled();
  });
}); 