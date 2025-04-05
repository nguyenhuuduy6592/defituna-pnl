import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PositionsList } from '../../../components/pnl/PositionsList';
import { 
  useHistoricalData, 
  useSortState, 
  useInvertedPairs 
} from '../../../hooks';

// Mock dependencies
jest.mock('../../../components/pnl/PnLCard', () => ({
  PnLCard: ({ position, onClose }) => (
    <div data-testid="pnl-card" onClick={onClose}>
      <div data-testid="pnl-card-pair">{position.pairDisplay}</div>
      <div data-testid="pnl-card-percentage">{position.displayPnlPercentage}</div>
    </div>
  )
}));

jest.mock('../../../components/pnl/PositionChart', () => ({
  PositionChart: ({ position, positionHistory, onClose }) => (
    <div data-testid="position-chart" onClick={onClose}>
      <div data-testid="chart-pair">{position.pair}</div>
      <div data-testid="chart-history-length">{positionHistory ? positionHistory.length : 0}</div>
    </div>
  )
}));

jest.mock('../../../components/pnl/PositionsTable', () => ({
  PositionsTable: ({ 
    positions, 
    showWallet, 
    historyEnabled, 
    sortState, 
    onSort, 
    isInverted, 
    onPairInversion, 
    onShare, 
    onShowChart 
  }) => (
    <div data-testid="positions-table">
      <div data-testid="position-count">{positions.length}</div>
      <div data-testid="show-wallet">{showWallet.toString()}</div>
      <div data-testid="history-enabled">{historyEnabled.toString()}</div>
      <div data-testid="sort-field">{sortState.field}</div>
      <div data-testid="sort-direction">{sortState.direction}</div>
      <button 
        data-testid="sort-button" 
        onClick={() => onSort('pnl')}
      >
        Sort
      </button>
      <button 
        data-testid="invert-button" 
        onClick={() => onPairInversion('ETH/USDC')}
      >
        Invert
      </button>
      {positions.map((position, index) => (
        <div key={index} data-testid={`position-${index}`}>
          <div data-testid={`position-${index}-pair`}>{position.pair}</div>
          <div data-testid={`position-${index}-status`}>{position.displayStatus}</div>
          <button 
            data-testid={`share-${index}`} 
            onClick={() => onShare(position)}
          >
            Share
          </button>
          <button 
            data-testid={`chart-${index}`} 
            onClick={() => onShowChart(position)}
          >
            Chart
          </button>
        </div>
      ))}
    </div>
  )
}));

jest.mock('../../../hooks', () => ({
  useHistoricalData: jest.fn(),
  useSortState: jest.fn(),
  useInvertedPairs: jest.fn()
}));

describe('PositionsList', () => {
  // Mock position data
  const mockPositions = [
    {
      pair: 'ETH/USDC',
      positionAddress: '0x123',
      pnl: { bps: 500 },
      age: 10
    },
    {
      pair: 'BTC/USDT',
      positionAddress: '0x456',
      pnl: { bps: -200 },
      age: 5
    }
  ];

  // Setup hooks mock returns
  beforeEach(() => {
    // Mock useSortState hook
    useSortState.mockImplementation((initialField, initialDirection) => ({
      sortState: { 
        field: initialField, 
        direction: initialDirection 
      },
      handleSort: jest.fn((field) => {})
    }));

    // Mock useInvertedPairs hook
    useInvertedPairs.mockImplementation(() => ({
      invertedPairs: new Set(),
      handlePairInversion: jest.fn(),
      isInverted: jest.fn((pair) => false)
    }));

    // Mock useHistoricalData hook
    useHistoricalData.mockImplementation(() => ({
      getPositionHistory: jest.fn(async () => ([
        { timestamp: 1, value: 100 },
        { timestamp: 2, value: 150 }
      ]))
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders NoPositions component when no positions are provided', () => {
    render(<PositionsList positions={[]} />);
    
    expect(screen.getByRole('status')).toHaveTextContent('No positions found');
  });

  it('renders PositionsTable when positions are provided', () => {
    render(<PositionsList positions={mockPositions} />);
    
    expect(screen.getByTestId('positions-table')).toBeInTheDocument();
    expect(screen.getByTestId('position-count')).toHaveTextContent('2');
  });

  it('passes correct props to PositionsTable', () => {
    render(<PositionsList 
      positions={mockPositions} 
      showWallet={true}
      historyEnabled={true}
    />);
    
    expect(screen.getByTestId('show-wallet')).toHaveTextContent('true');
    expect(screen.getByTestId('history-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('sort-field')).toHaveTextContent('age');
    expect(screen.getByTestId('sort-direction')).toHaveTextContent('desc');
  });

  it('processes positions correctly with sort and status', () => {
    render(<PositionsList positions={mockPositions} />);
    
    // Check position status is calculated
    expect(screen.getByTestId('position-0-status')).toBeInTheDocument();
    expect(screen.getByTestId('position-1-status')).toBeInTheDocument();
  });

  it('shows PnLCard when share button is clicked', () => {
    render(<PositionsList positions={mockPositions} />);
    
    // Initially, PnLCard should not be visible
    expect(screen.queryByTestId('pnl-card')).not.toBeInTheDocument();
    
    // Click the share button for the first position
    fireEvent.click(screen.getByTestId('share-0'));
    
    // PnLCard should now be visible
    expect(screen.getByTestId('pnl-card')).toBeInTheDocument();
    
    // Check that the correct position data is passed
    expect(screen.getByTestId('pnl-card-pair')).toHaveTextContent('ETH/USDC');
    
    // Close the card
    fireEvent.click(screen.getByTestId('pnl-card'));
    
    // Card should no longer be visible
    expect(screen.queryByTestId('pnl-card')).not.toBeInTheDocument();
  });

  it('shows PositionChart when chart button is clicked', async () => {
    render(<PositionsList positions={mockPositions} />);
    
    // Initially, PositionChart should not be visible
    expect(screen.queryByTestId('position-chart')).not.toBeInTheDocument();
    
    // Click the chart button for the first position
    fireEvent.click(screen.getByTestId('chart-0'));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      // PositionChart should now be visible
      expect(screen.getByTestId('position-chart')).toBeInTheDocument();
      
      // Check that the correct position and history data is passed
      expect(screen.getByTestId('chart-pair')).toHaveTextContent('ETH/USDC');
      expect(screen.getByTestId('chart-history-length')).toHaveTextContent('2');
    });
    
    // Close the chart
    fireEvent.click(screen.getByTestId('position-chart'));
    
    // Chart should no longer be visible
    expect(screen.queryByTestId('position-chart')).not.toBeInTheDocument();
  });

  it('handles sorting when sort button is clicked', () => {
    const mockHandleSort = jest.fn();
    useSortState.mockImplementation(() => ({
      sortState: { field: 'age', direction: 'desc' },
      handleSort: mockHandleSort
    }));
    
    render(<PositionsList positions={mockPositions} />);
    
    // Click the sort button
    fireEvent.click(screen.getByTestId('sort-button'));
    
    // The handleSort function should be called with the correct field
    expect(mockHandleSort).toHaveBeenCalledWith('pnl');
  });

  it('handles pair inversion when invert button is clicked', () => {
    const mockHandlePairInversion = jest.fn();
    useInvertedPairs.mockImplementation(() => ({
      invertedPairs: new Set(),
      handlePairInversion: mockHandlePairInversion,
      isInverted: jest.fn((pair) => false)
    }));
    
    render(<PositionsList positions={mockPositions} />);
    
    // Click the invert button
    fireEvent.click(screen.getByTestId('invert-button'));
    
    // The handlePairInversion function should be called with the correct pair
    expect(mockHandlePairInversion).toHaveBeenCalledWith('ETH/USDC');
  });
}); 