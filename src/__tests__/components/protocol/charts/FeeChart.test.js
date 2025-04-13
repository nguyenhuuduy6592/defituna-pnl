import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import FeeChart from '../../../../components/protocol/charts/FeeChart.js';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

const mockData = {
  feesByToken: [
    {
      symbol: 'USDC',
      totalAmountUI: '1000',
      dailyFees: [
        { date: '2024-04-13', amountUI: '100' },
        { date: '2024-04-14', amountUI: '200' }
      ]
    },
    {
      symbol: 'SOL',
      totalAmountUI: '500',
      dailyFees: [
        { date: '2024-04-13', amountUI: '50' },
        { date: '2024-04-14', amountUI: '100' }
      ]
    }
  ]
};

describe('FeeChart Component', () => {
  beforeEach(() => {
    // Mock current date to match test data
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-04-14T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders chart with data', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText('Log Scale')).toBeInTheDocument();
  });

  it('renders no data message when data is empty', () => {
    render(<FeeChart data={{ feesByToken: [] }} timeRange="30d" />);
    expect(screen.getByText('No data available for the selected time range')).toBeInTheDocument();
  });

  it('renders no data message when data is null', () => {
    render(<FeeChart data={null} timeRange="30d" />);
    expect(screen.getByText('No data available for the selected time range')).toBeInTheDocument();
  });

  it('toggles log scale when button is clicked', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    const logScaleButton = screen.getByText('Log Scale');
    fireEvent.click(logScaleButton);
    expect(screen.getByText('Linear Scale')).toBeInTheDocument();
    fireEvent.click(logScaleButton);
    expect(screen.getByText('Log Scale')).toBeInTheDocument();
  });

  it('toggles token visibility when token button is clicked', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    const usdcButton = screen.getByText('USDC');
    fireEvent.click(usdcButton);
    expect(usdcButton).toHaveClass('inactive');
    fireEvent.click(usdcButton);
    expect(usdcButton).not.toHaveClass('inactive');
  });

  it('handles different time ranges', () => {
    const { rerender } = render(<FeeChart data={mockData} timeRange="30d" />);
    expect(screen.getByText('Fee Collection (30d)')).toBeInTheDocument();

    rerender(<FeeChart data={mockData} timeRange="7d" />);
    expect(screen.getByText('Fee Collection (7d)')).toBeInTheDocument();

    rerender(<FeeChart data={mockData} timeRange="24h" />);
    expect(screen.getByText('Fee Collection (24h)')).toBeInTheDocument();
  });

  it('handles missing token data gracefully', () => {
    const incompleteData = {
      feesByToken: [
        {
          symbol: 'USDC',
          totalAmountUI: '1000',
          // Missing dailyFees
        }
      ]
    };
    render(<FeeChart data={incompleteData} timeRange="30d" />);
    // Component should still render but with no data points
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('handles invalid date formats gracefully', () => {
    const invalidDateData = {
      feesByToken: [
        {
          symbol: 'USDC',
          totalAmountUI: '1000',
          dailyFees: [
            { date: 'invalid-date', amountUI: '100' }
          ]
        }
      ]
    };
    render(<FeeChart data={invalidDateData} timeRange="30d" />);
    // Component should still render but with no data points for invalid dates
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });
}); 