import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LendingPositionsDisplay } from '../../../components/pnl/LendingPositionsDisplay';
import { DisplayCurrencyProvider } from '../../../contexts/DisplayCurrencyContext';
import { PriceProvider } from '../../../contexts/PriceContext';

const mockCopyToClipboard = jest.fn();
const mockFormatWalletAddress = (addr) => `short:${addr}`;
const mockFormatFee = (v) => `$${v}`;
const mockFormatNumber = (v) => v;
const mockFormatDuration = (v) => `${v}s`;

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  copyToClipboard: (...args) => mockCopyToClipboard(...args),
  formatWalletAddress: (addr) => mockFormatWalletAddress(addr),
  formatFee: (v) => mockFormatFee(v),
  formatNumber: (v) => mockFormatNumber(v),
  formatDuration: (v) => mockFormatDuration(v),
}));

jest.mock('../../../components/common/LoadingOverlay', () => ({
  LoadingOverlay: ({ loading, children }) => loading ? <div>Loading...</div> : <>{children}</>
}));

jest.mock('../../../components/common/Tooltip', () => ({
  Tooltip: ({ content, children }) => <span data-testid="tooltip">{children}{content}</span>
}));

describe('LendingPositionsDisplay', () => {
  const basePosition = {
    vault: 'vault1',
    authority: 'auth1',
    wallet: 'wallet1',
    funds_amount: 100,
    funds_usd_value: 200,
    earned_amount: 10,
    earned_usd_value: 20,
    age: 123,
  };

  const vaultDetails = {
    vault1: {
      mint: 'mint1',
      deposited_funds: { usd: 1000 },
      borrowed_funds: { usd: 500 },
      supply_apy: 0.05,
      borrow_apy: 0.1,
      utilization: 0.5,
    }
  };
  const mintDetails = {
    mint1: { symbol: 'TUNA', logo: 'logo.png' }
  };

  // Add helper to wrap with providers
  const renderWithProviders = (ui) =>
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>{ui}</PriceProvider>
      </DisplayCurrencyProvider>
    );

  it('renders loading state', () => {
    renderWithProviders(
      <LendingPositionsDisplay data={null} loading={true} getVaultDetails={jest.fn()} getMintDetails={jest.fn()} onShare={jest.fn()} />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state if no positions', () => {
    renderWithProviders(
      <LendingPositionsDisplay data={{ positions: [] }} loading={false} getVaultDetails={jest.fn()} getMintDetails={jest.fn()} onShare={jest.fn()} />
    );
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  it('renders a lending position row with correct data and handles copy', async () => {
    const getVaultDetails = jest.fn().mockResolvedValue(vaultDetails.vault1);
    const getMintDetails = jest.fn().mockResolvedValue(mintDetails.mint1);
    renderWithProviders(
      <LendingPositionsDisplay
        data={{ positions: [basePosition] }}
        loading={false}
        getVaultDetails={getVaultDetails}
        getMintDetails={getMintDetails}
        onShare={jest.fn()}
      />
    );
    await waitFor(() => expect(getVaultDetails).toHaveBeenCalled());
    // Vault cell: should show short:vault1 (not TUNA) in the main table cell
    const vaultCells = screen.getAllByText(/short:vault1/);
    expect(vaultCells.length).toBeGreaterThan(0);
    expect(vaultCells[0]).toBeInTheDocument();
    expect(screen.getByText('short:auth1')).toBeInTheDocument();
    expect(screen.getByText('123s')).toBeInTheDocument();
    // Copy wallet
    fireEvent.click(screen.getByText('short:auth1'));
    expect(mockCopyToClipboard).toHaveBeenCalledWith('auth1');
  });

  it('calls onShare when share button is clicked', async () => {
    const getVaultDetails = jest.fn().mockResolvedValue(vaultDetails.vault1);
    const getMintDetails = jest.fn().mockResolvedValue(mintDetails.mint1);
    const onShare = jest.fn();
    renderWithProviders(
      <LendingPositionsDisplay
        data={{ positions: [basePosition] }}
        loading={false}
        getVaultDetails={getVaultDetails}
        getMintDetails={getMintDetails}
        onShare={onShare}
      />
    );
    await waitFor(() => expect(getVaultDetails).toHaveBeenCalled());
    // The share button has title 'Share position'
    fireEvent.click(screen.getByTitle('Share position'));
    expect(onShare).toHaveBeenCalled();
  });
}); 