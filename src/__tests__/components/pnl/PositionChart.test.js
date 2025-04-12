import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { PositionChart } from '@/components/pnl/PositionChart';
import { prepareChartData, groupChartData, TIME_PERIODS } from '@/utils';
import { exportChartAsImage, shareCard } from '@/utils/export';

// Mock dependencies
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name, dataKey }) => (
    <div 
      data-testid={`line-${dataKey}`} 
      data-name={name} 
    >
      {name}
    </div>
  ),
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="recharts-tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: ({ y, label }) => <div data-testid="reference-line" data-y={y}>{label?.value}</div>,
}));

jest.mock('@/components/common/Portal', () => ({
  Portal: ({ children }) => <div data-testid="portal-container">{children}</div>,
}));

jest.mock('@/components/common/Tooltip', () => ({
  Tooltip: ({ children, content }) => (
    <div data-testid="tooltip-container" data-content={content}>
      {children}
    </div>
  ),
}));

jest.mock('@/utils', () => {
  const originalModule = jest.requireActual('../../../utils');
  return {
    ...originalModule,
    prepareChartData: jest.fn(),
    groupChartData: jest.fn(),
    formatXAxisLabel: jest.fn(timestamp => 'formatted-date'),
    CustomChartTooltip: () => <div data-testid="custom-tooltip"></div>,
    formatNumber: jest.fn(num => `$${num.toFixed(2)}`),
    TIME_PERIODS: {
      MINUTE_5: { value: '5m', label: '5 Minutes' },
      HOUR_1: { value: '1h', label: '1 Hour' },
      DAY_1: { value: '1d', label: '1 Day' },
    },
  };
});

jest.mock('@/utils/export', () => ({
  exportChartAsImage: jest.fn().mockResolvedValue(true),
  shareCard: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-icons/bs', () => ({
  BsInfoCircle: () => <span data-testid="info-icon">Info</span>,
}));

jest.mock('react-icons/hi', () => ({
  HiDownload: () => <span data-testid="download-icon">Download</span>,
  HiShare: () => <span data-testid="share-icon">Share</span>,
}));

describe('PositionChart', () => {
  // Mock data
  const mockPosition = {
    pair: 'ETH/USDC',
    pairDisplay: 'ETH/USDC',
    pnl: { usd: 1000 },
    yield: { usd: 200 },
    compounded: { usd: 50 },
  };

  const mockHistoryData = [
    { timestamp: Date.now() - 1000 * 60 * 60 * 24, pnl: 800, yield: 150, compounded: 30 },
    { timestamp: Date.now() - 1000 * 60 * 60 * 12, pnl: 900, yield: 170, compounded: 40 },
    { timestamp: Date.now(), pnl: 1000, yield: 200, compounded: 50 },
  ];

  // Mock empty history data for edge case testing
  const mockEmptyHistoryData = [];

  // Mock invalid history data to test error handling
  const mockInvalidHistoryData = [
    { timestamp: NaN, pnl: 'invalid', yield: null },
    { timestamp: 'invalid', pnl: undefined, yield: undefined },
  ];

  // Mock negative PnL data to test styling
  const mockNegativePnLData = [
    { timestamp: Date.now() - 1000 * 60 * 60 * 24, pnl: -800, yield: 150, compounded: 30 },
    { timestamp: Date.now() - 1000 * 60 * 60 * 12, pnl: -900, yield: 170, compounded: 40 },
    { timestamp: Date.now(), pnl: -1000, yield: 200, compounded: 50 },
  ];

  // Mock callback
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    prepareChartData.mockImplementation(data => data || []);
    groupChartData.mockImplementation((data, period) => 
      data && data.length > 0 
        ? data.map(item => ({
            ...item,
            totalYield: (item.yield || 0) + (item.compounded || 0)
          }))
        : []
    );
    
    // Mock element getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    }));
    
    // Mock window methods for export/share
    global.URL.createObjectURL = jest.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('returns null when positionHistory is null', () => {
    const { container } = render(
      <PositionChart 
        position={mockPosition} 
        positionHistory={null} 
        onClose={mockOnClose} 
      />
    );
    
    // Component should return null
    expect(container.firstChild).toBeNull();
  });

  it('renders chart with position history data', () => {
    render(
      <PositionChart
        position={mockPosition}
        positionHistory={mockHistoryData}
        onClose={mockOnClose}
      />
    );

    // Check chart utility functions were called
    expect(prepareChartData).toHaveBeenCalledWith(mockHistoryData);
    expect(groupChartData).toHaveBeenCalled();
    
    // Get the main chart container (the one not inside exportWrapper)
    const mainChartContainer = screen.getByTestId('portal-container').querySelector(':scope > .chartOverlay > .chartContainer');
    expect(mainChartContainer).toBeInTheDocument();

    // Find the visible chart content div directly within the main container
    const visibleChartContent = mainChartContainer.querySelector(':scope > .chartContent');
    expect(visibleChartContent).toBeInTheDocument(); // Make sure we found it

    // Use 'within' to scope the search to the visible chart content div
    const visibleChart = within(visibleChartContent);

    // Check chart components are rendered within the visible chart
    expect(visibleChart.getByTestId('line-chart')).toBeInTheDocument();
    expect(visibleChart.getByTestId('line-pnl')).toBeInTheDocument();
    expect(visibleChart.getByTestId('line-totalYield')).toBeInTheDocument();

    // Check for other chart elements within the visible chart
    expect(visibleChart.getByTestId('reference-line')).toBeInTheDocument();
  });

  it('renders the NoChartData component when position history is empty', () => {
    prepareChartData.mockReturnValue([]);
    groupChartData.mockReturnValue([]);
    
    render(
      <PositionChart
        position={mockPosition}
        positionHistory={mockEmptyHistoryData}
        onClose={mockOnClose}
      />
    );
    
    // Check no data message is shown
    expect(screen.queryAllByText(/No displayable data available/i)[0]).toBeInTheDocument();
  });

  it('handles changing the time period', () => {
    render(
      <PositionChart
        position={mockPosition}
        positionHistory={mockHistoryData}
        onClose={mockOnClose}
      />
    );
    
    // Find period select dropdown
    const periodSelect = screen.getByLabelText('Select time period');
    
    // Change period to 1h
    fireEvent.change(periodSelect, { target: { value: '1h' } });
    
    // Check if groupChartData was called with new period
    expect(groupChartData).toHaveBeenCalledWith(expect.anything(), '1h');
    
    // Change period to 1d
    fireEvent.change(periodSelect, { target: { value: '1d' } });
    
    // Check if groupChartData was called with new period
    expect(groupChartData).toHaveBeenCalledWith(expect.anything(), '1d');
  });

  it('closes when clicking the close button', () => {
    render(
      <PositionChart 
        position={mockPosition} 
        positionHistory={mockHistoryData} 
        onClose={mockOnClose} 
      />
    );
    
    // Find the close button by its aria-label
    const closeButton = screen.getByLabelText('Close chart');
    fireEvent.click(closeButton);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('exports the chart as an image when clicking export button', async () => {
    render(
      <PositionChart 
        position={mockPosition} 
        positionHistory={mockHistoryData}
        onClose={mockOnClose} 
      />
    );
    
    // Find the export button by its aria-label
    const exportButton = screen.getByLabelText('Download ETH/USDC chart as PNG');
    fireEvent.click(exportButton);
    
    // Check if exportChartAsImage was called
    await waitFor(() => {
      expect(exportChartAsImage).toHaveBeenCalledTimes(1);
    });
  });

  it('shares the chart when clicking share button', async () => {
    render(
      <PositionChart 
        position={mockPosition} 
        positionHistory={mockHistoryData}
        onClose={mockOnClose} 
      />
    );
    
    // Find the share button by its aria-label
    const shareButton = screen.getByLabelText('Share ETH/USDC chart');
    fireEvent.click(shareButton);
    
    // Check if shareCard was called
    await waitFor(() => {
      expect(shareCard).toHaveBeenCalledTimes(1);
    });
  });
  
  it('gracefully handles invalid history data', () => {
    console.error = jest.fn(); // Mock console.error to prevent test output noise
    
    render(
      <PositionChart
        position={mockPosition}
        positionHistory={mockInvalidHistoryData}
        onClose={mockOnClose}
      />
    );
    
    // Should display the no data message when processing fails
    expect(screen.queryAllByText(/No displayable data available/i)[0]).toBeInTheDocument();
  });

  it('uses proper pairDisplay when available', () => {
    const mockPositionWithPairDisplay = {
      ...mockPosition,
      pairDisplay: 'Ethereum/USDC', // Custom display name
    };
    
    render(
      <PositionChart
        position={mockPositionWithPairDisplay}
        positionHistory={mockHistoryData}
        onClose={mockOnClose}
      />
    );
    
    // Should use the pairDisplay instead of pair
    expect(screen.queryAllByText(/Ethereum\/USDC History/i)[0]).toBeInTheDocument();
  });

  it('handles negative PnL data correctly', () => {
    // Setup mocks to return negative PnL data
    prepareChartData.mockReturnValue(mockNegativePnLData);
    groupChartData.mockReturnValue(mockNegativePnLData.map(item => ({
      ...item,
      totalYield: (item.yield || 0) + (item.compounded || 0)
    })));
    
    render(
      <PositionChart
        position={{...mockPosition, pnl: { usd: -1000 }}}
        positionHistory={mockNegativePnLData}
        onClose={mockOnClose}
      />
    );
    
    // Check that chart components are rendered
    expect(screen.queryAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.queryAllByTestId('line-pnl')[0]).toBeInTheDocument();
    expect(screen.queryAllByTestId('reference-line')[0]).toBeInTheDocument();
  });

  it('renders the info tooltip with correct content', () => {
    render(
      <PositionChart
        position={mockPosition}
        positionHistory={mockHistoryData}
        onClose={mockOnClose}
      />
    );
    
    // Find info icon
    const infoIcon = screen.getByTestId('info-icon');
    
    // Info tooltip container should exist and have content about historical data
    const tooltipContainer = screen.getByTestId('tooltip-container');
    expect(tooltipContainer).toBeInTheDocument();
    expect(tooltipContainer.getAttribute('data-content')).toContain('Historical data is stored locally');
  });
}); 