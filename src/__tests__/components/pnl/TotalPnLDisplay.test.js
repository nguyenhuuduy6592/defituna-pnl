import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TotalPnLDisplay } from '../../../components/pnl/TotalPnLDisplay';

// Mock the styles module
jest.mock('../../../components/pnl/TotalPnLDisplay.module.scss', () => ({
  pnlHeader: 'pnlHeader',
  pnlGrid: 'pnlGrid',
  pnlItem: 'pnlItem',
  label: 'label',
}));

const renderWithProviders = (ui) => render(ui);

describe('TotalPnLDisplay Component', () => {
  it('renders with correct label', () => {
    renderWithProviders(<TotalPnLDisplay label="Total PnL" totalValue="123" />);
    expect(screen.getByText('Total PnL')).toBeInTheDocument();
  });

  it('renders the provided totalValue as HTML', () => {
    renderWithProviders(<TotalPnLDisplay label="Total PnL" totalValue="<span id='test-value'>$123.45</span>" />);
    const valueElement = screen.getByText('$123.45');
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveAttribute('id', 'test-value');
  });

  it('renders empty value if totalValue is empty', () => {
    renderWithProviders(<TotalPnLDisplay label="Total PnL" totalValue="" />);
    // Should still render the label, but no value text
    expect(screen.getByText('Total PnL')).toBeInTheDocument();
  });
});