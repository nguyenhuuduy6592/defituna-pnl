import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TotalPnLDisplay } from '../../../components/pnl/TotalPnLDisplay';
import { formatValue, getValueClass } from '../../../utils';

// Mock the utils functions
jest.mock('../../../utils', () => ({
  formatValue: jest.fn(value => value.toFixed(2)),
  getValueClass: jest.fn(value => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  })
}));

// Mock the styles module
jest.mock('../../../components/pnl/TotalPnLDisplay.module.scss', () => ({
  pnlHeader: 'pnlHeader',
  pnlGrid: 'pnlGrid',
  pnlItem: 'pnlItem',
  label: 'label',
  value: 'value',
  positive: 'positive',
  negative: 'negative',
  neutral: 'neutral'
}));

describe('TotalPnLDisplay Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    formatValue.mockClear();
    getValueClass.mockClear();
  });

  it('renders with correct label', () => {
    render(<TotalPnLDisplay label="Total PnL" totalValue={100} />);
    
    expect(screen.getByText('Total PnL')).toBeInTheDocument();
  });

  it('displays positive value correctly', () => {
    render(<TotalPnLDisplay label="Total PnL" totalValue={100} />);
    
    expect(formatValue).toHaveBeenCalledWith(100);
    expect(getValueClass).toHaveBeenCalledWith(100);
    
    const valueElement = screen.getByText('$100.00');
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveClass('positive');
  });

  it('displays negative value correctly', () => {
    render(<TotalPnLDisplay label="Total PnL" totalValue={-50} />);
    
    expect(formatValue).toHaveBeenCalledWith(-50);
    expect(getValueClass).toHaveBeenCalledWith(-50);
    
    const valueElement = screen.getByText('$-50.00');
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveClass('negative');
  });

  it('displays zero value correctly', () => {
    render(<TotalPnLDisplay label="Total PnL" totalValue={0} />);
    
    expect(formatValue).toHaveBeenCalledWith(0);
    expect(getValueClass).toHaveBeenCalledWith(0);
    
    const valueElement = screen.getByText('$0.00');
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveClass('neutral');
  });

  it('handles non-numeric totalValue by defaulting to 0', () => {
    render(<TotalPnLDisplay label="Total PnL" totalValue={undefined} />);
    
    expect(formatValue).toHaveBeenCalledWith(0);
    expect(getValueClass).toHaveBeenCalledWith(0);
    
    const valueElement = screen.getByText('$0.00');
    expect(valueElement).toBeInTheDocument();
  });

  it('sets the correct ARIA label', () => {
    render(<TotalPnLDisplay label="Total PnL" totalValue={100} />);
    
    const valueElement = screen.getByText('$100.00');
    expect(valueElement).toHaveAttribute('aria-label', 'Total PnL: 100.00 dollars');
  });

  it('memoizes formatting to prevent unnecessary recalculations', () => {
    const { rerender } = render(<TotalPnLDisplay label="Total PnL" totalValue={100} />);
    
    expect(formatValue).toHaveBeenCalledTimes(1);
    expect(getValueClass).toHaveBeenCalledTimes(1);
    
    // Rerender with same value should not call formatting functions again
    formatValue.mockClear();
    getValueClass.mockClear();
    
    rerender(<TotalPnLDisplay label="Total PnL" totalValue={100} />);
    
    expect(formatValue).not.toHaveBeenCalled();
    expect(getValueClass).not.toHaveBeenCalled();
    
    // Rerender with different value should call formatting functions
    rerender(<TotalPnLDisplay label="Total PnL" totalValue={200} />);
    
    expect(formatValue).toHaveBeenCalledWith(200);
    expect(getValueClass).toHaveBeenCalledWith(200);
  });
}); 