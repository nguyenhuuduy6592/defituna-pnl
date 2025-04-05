import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PositionChart } from '../../../components/pnl/PositionChart';
import { prepareChartData, groupChartData } from '../../../utils';
import { exportChartAsImage, shareCard } from '../../../utils/export';

// Mock dependencies
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }) => <div data-testid={`line-${name?.replace(/\s/g, '-')?.replace(/\(/g, '')?.replace(/\)/g, '')}`}>{name}</div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="recharts-tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: ({ y, label }) => <div data-testid="reference-line" data-y={y}>{label?.value}</div>,
}));

jest.mock('../../../components/common/Portal', () => ({
  Portal: ({ children }) => <div data-testid="portal-container">{children}</div>,
}));

jest.mock('../../../components/common/Tooltip', () => ({
  Tooltip: ({ children }) => <div data-testid="tooltip-container">{children}</div>,
}));

jest.mock('../../../utils', () => ({
  prepareChartData: jest.fn(),
  groupChartData: jest.fn(),
  formatXAxisLabel: jest.fn(),
  CustomChartTooltip: () => <div data-testid="custom-tooltip"></div>,
  formatNumber: jest.fn(),
  TIME_PERIODS: {
    MINUTE_5: { value: '5m', label: '5 Minutes' },
    HOUR_1: { value: '1h', label: '1 Hour' },
    DAY_1: { value: '1d', label: '1 Day' },
  },
}));

jest.mock('../../../utils/export', () => ({
  exportChartAsImage: jest.fn(),
  shareCard: jest.fn(),
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

  it('exports the chart as an image when clicking export button', () => {
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
    expect(exportChartAsImage).toHaveBeenCalledTimes(1);
  });

  it('shares the chart when clicking share button', () => {
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
    expect(shareCard).toHaveBeenCalledTimes(1);
  });
}); 