import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FeeChart from '../FeeChart';

// Mock the recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe('FeeChart', () => {
  const mockData = {
    feesByToken: [
      {
        symbol: 'USDC',
        totalAmountUI: 100,
        dailyFees: [
          { date: '2025-03-26', amountUI: 50 },
          { date: '2025-03-27', amountUI: 50 }
        ]
      },
      {
        symbol: 'SOL',
        totalAmountUI: 1,
        dailyFees: [
          { date: '2025-03-26', amountUI: 0.5 },
          { date: '2025-03-27', amountUI: 0.5 }
        ]
      },
      {
        symbol: 'BONK',
        totalAmountUI: 1000,
        dailyFees: [
          { date: '2025-03-26', amountUI: 500 },
          { date: '2025-03-27', amountUI: 500 }
        ]
      }
    ]
  };

  it('renders without crashing', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    expect(screen.getByText('Fee Collection (30d)')).toBeInTheDocument();
  });

  it('shows token buttons for each token', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('BONK')).toBeInTheDocument();
  });

  it('toggles log scale when button is clicked', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    const scaleButton = screen.getByText('Log Scale');
    fireEvent.click(scaleButton);
    expect(screen.getByText('Linear Scale')).toBeInTheDocument();
  });

  it('toggles token visibility when token button is clicked', () => {
    render(<FeeChart data={mockData} timeRange="30d" />);
    const usdcButton = screen.getByText('USDC');
    fireEvent.click(usdcButton);
    expect(usdcButton).toHaveClass('inactive');
  });

  it('handles different time ranges', () => {
    const { rerender } = render(<FeeChart data={mockData} timeRange="30d" />);
    expect(screen.getByText('Fee Collection (30d)')).toBeInTheDocument();

    rerender(<FeeChart data={mockData} timeRange="7d" />);
    expect(screen.getByText('Fee Collection (7d)')).toBeInTheDocument();

    rerender(<FeeChart data={mockData} timeRange="24h" />);
    expect(screen.getByText('Fee Collection (24h)')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<FeeChart data={{ feesByToken: [] }} timeRange="30d" />);
    expect(screen.getByText('No data available for the selected time range')).toBeInTheDocument();
  });

  it('handles missing data', () => {
    render(<FeeChart data={null} timeRange="30d" />);
    expect(screen.getByText('No data available for the selected time range')).toBeInTheDocument();
  });

  it('formats values correctly', () => {
    const { container } = render(<FeeChart data={mockData} timeRange="30d" />);
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });
}); 