import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PnLDisplay } from '../../../components/pnl/PnLDisplay';
import { DisplayCurrencyProvider } from '../../../contexts/DisplayCurrencyContext';
import { PriceProvider } from '../../../contexts/PriceContext';

// Mock the child components to isolate testing to just the PnLDisplay component
jest.mock('../../../components/pnl/PositionsList', () => ({
  PositionsList: ({ positions, showWallet, historyEnabled }) => (
    <div data-testid="positions-list" data-positions={JSON.stringify(positions)} data-showwallet={showWallet.toString()} data-historyenabled={historyEnabled.toString()}>
      Positions List Mock
    </div>
  )
}));

jest.mock('../../../components/pnl/DonationFooter', () => ({
  DonationFooter: ({ visible }) => (
    <div data-testid="donation-footer" data-visible={visible.toString()}>
      Donation Footer Mock
    </div>
  )
}));

jest.mock('../../../components/pnl/TotalPnLDisplay', () => ({
  TotalPnLDisplay: ({ label, totalValue }) => (
    <div data-testid={`total-pnl-${label.replace(/\s+/g, '-').toLowerCase()}`} data-label={label} data-totalvalue={totalValue}>
      {label}: {totalValue}
    </div>
  )
}));

jest.mock('../../../components/common/LoadingOverlay', () => ({
  LoadingOverlay: ({ loading, children }) => (
    <div data-testid="loading-overlay" data-loading={loading.toString()}>
      {children}
    </div>
  )
}));

jest.mock('../../../components/pnl/hooks/usePositionAges', () => ({
  usePositionAges: (positions) => positions.map(pos => ({ ...pos, age: '30 days' }))
}));

// Mock styles
jest.mock('../../../components/pnl/PnLDisplay.module.scss', () => ({
  pnlContainer: 'pnlContainer-mock',
  cardRow: 'cardRow-mock'
}));

// Clean up after each test
afterEach(cleanup);

// Add helper to wrap with providers
const renderWithProviders = (ui) =>
  render(
    <DisplayCurrencyProvider>
      <PriceProvider>{ui}</PriceProvider>
    </DisplayCurrencyProvider>
  );

describe('PnLDisplay Component', () => {
  const mockData = {
    totalPnL: 1000,
    positions: [
      { id: '1', yield: { usd: 200 }, compounded: { usd: 50 } },
      { id: '2', yield: { usd: 300 }, compounded: { usd: 100 } }
    ],
    walletCount: 2
  };

  it('renders LoadingOverlay with loading state true', () => {
    renderWithProviders(<PnLDisplay data={mockData} loading={true} />);
    const loadingOverlay = screen.getByTestId('loading-overlay');
    expect(loadingOverlay).toHaveAttribute('data-loading', 'true');
  });
  
  it('renders LoadingOverlay with loading state false', () => {
    renderWithProviders(<PnLDisplay data={mockData} loading={false} />);
    const loadingOverlay = screen.getByTestId('loading-overlay');
    expect(loadingOverlay).toHaveAttribute('data-loading', 'false');
  });

  it('renders three TotalPnLDisplay components with correct data', () => {
    renderWithProviders(<PnLDisplay data={mockData} />);
    
    const totalPnL = screen.getByTestId('total-pnl-total-pnl');
    const totalYield = screen.getByTestId('total-pnl-total-yield');
    const totalCompounded = screen.getByTestId('total-pnl-total-compounded');
    
    expect(totalPnL).toHaveAttribute('data-label', 'Total PnL');
    expect(totalPnL).toHaveAttribute('data-totalvalue', '1000');
    
    expect(totalYield).toHaveAttribute('data-label', 'Total Yield');
    expect(totalYield).toHaveAttribute('data-totalvalue', '500');
    
    expect(totalCompounded).toHaveAttribute('data-label', 'Total Compounded');
    expect(totalCompounded).toHaveAttribute('data-totalvalue', '150');
  });

  it('renders PositionsList with correct props', () => {
    renderWithProviders(<PnLDisplay data={mockData} historyEnabled={true} />);
    
    const positionsList = screen.getByTestId('positions-list');
    expect(positionsList).toHaveAttribute('data-showwallet', 'true');
    expect(positionsList).toHaveAttribute('data-historyenabled', 'true');
    
    // Verify positions are passed with age data
    const passedPositions = JSON.parse(positionsList.getAttribute('data-positions'));
    expect(passedPositions).toHaveLength(2);
    expect(passedPositions[0]).toHaveProperty('age', '30 days');
  });

  it('renders DonationFooter with visibility true when positions exist', () => {
    renderWithProviders(<PnLDisplay data={mockData} />);
    const donationFooter = screen.getByTestId('donation-footer');
    expect(donationFooter).toHaveAttribute('data-visible', 'true');
  });
  
  it('renders DonationFooter with visibility false when no positions exist', () => {
    renderWithProviders(<PnLDisplay data={{ ...mockData, positions: [] }} />);
    const donationFooter = screen.getByTestId('donation-footer');
    expect(donationFooter).toHaveAttribute('data-visible', 'false');
  });

  it('calculates total yield and compounded correctly when some positions have missing values', () => {
    const dataWithMissingValues = {
      totalPnL: 1000,
      positions: [
        { id: '1', yield: { usd: 200 } }, // Missing compounded
        { id: '2', compounded: { usd: 100 } }, // Missing yield
        { id: '3' } // Missing both
      ],
      walletCount: 3
    };
    
    renderWithProviders(<PnLDisplay data={dataWithMissingValues} />);
    
    const totalYield = screen.getByTestId('total-pnl-total-yield');
    const totalCompounded = screen.getByTestId('total-pnl-total-compounded');
    
    expect(totalYield).toHaveAttribute('data-totalvalue', '200');
    expect(totalCompounded).toHaveAttribute('data-totalvalue', '100');
  });
}); 