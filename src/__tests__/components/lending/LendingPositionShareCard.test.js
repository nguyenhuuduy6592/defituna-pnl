import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LendingPositionShareCard } from '../../../components/lending/LendingPositionShareCard';
import { PriceProvider } from '../../../contexts/PriceContext';
import { DisplayCurrencyProvider } from '../../../contexts/DisplayCurrencyContext';

jest.mock('../../../components/common/Portal', () => ({
  Portal: ({ children }) => <div data-testid="portal-mock">{children}</div>
}));

const mockCopyToClipboard = jest.fn();
const mockExportCardAsImage = jest.fn();
const mockShareCard = jest.fn();

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  copyToClipboard: (...args) => mockCopyToClipboard(...args),
  exportCardAsImage: (...args) => mockExportCardAsImage(...args),
  shareCard: (...args) => mockShareCard(...args),
  formatWalletAddress: (addr) => `short:${addr}`,
  formatFee: (v) => `$${v}`,
  formatNumber: (v) => v,
}));

describe('LendingPositionShareCard', () => {
  const basePosition = {
    vault: 'vault1',
    authority: 'auth1',
    wallet: 'wallet1',
    funds: {
      amount: 100,
      usd: 200,
    },
    earned: {
      amount: 10,
      usd: 20,
    },
    vaultSymbol: 'TUNA',
    supplyApy: 3.5,
  };

  const mockWalletAddress = 'testWalletAddress';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if no position', () => {
    const { container } = render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={null} walletAddress={mockWalletAddress} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders card with correct data', () => {
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={basePosition} walletAddress={mockWalletAddress} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    expect(screen.getByText('TUNA Position Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Vault:')).toBeInTheDocument();
    expect(screen.getByText('Wallet:')).toBeInTheDocument();
    expect(screen.getByText('Funds:')).toBeInTheDocument();
    expect(screen.getByText('Supply APY:')).toBeInTheDocument();
    expect(screen.getByText('Earned:')).toBeInTheDocument();
    expect(screen.getByText(/TUNA \(short:vault1\)/)).toBeInTheDocument();
    expect(screen.getByText('short:auth1')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('3.50%')).toBeInTheDocument();
    expect(screen.getByText('$20')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={basePosition} walletAddress={mockWalletAddress} onClose={onClose} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls exportCardAsImage when Download PNG is clicked', () => {
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={basePosition} walletAddress={mockWalletAddress} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    fireEvent.click(screen.getByTitle(/download as png/i));
    expect(mockExportCardAsImage).toHaveBeenCalled();
  });

  it('calls shareCard when Share is clicked', () => {
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={basePosition} walletAddress={mockWalletAddress} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    fireEvent.click(screen.getByTitle(/share this snapshot/i));
    expect(mockShareCard).toHaveBeenCalled();
  });

  it('calls copyToClipboard when Copy Text is clicked', () => {
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={basePosition} walletAddress={mockWalletAddress} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    const copyButton = screen.getByRole('button', { name: /Copy Text/i });
    fireEvent.click(copyButton);
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('calls copyToClipboard with the correct text when Copy Text is clicked', () => {
    render(
      <DisplayCurrencyProvider>
        <PriceProvider>
          <LendingPositionShareCard position={basePosition} walletAddress={mockWalletAddress} />
        </PriceProvider>
      </DisplayCurrencyProvider>
    );
    const copyButton = screen.getByRole('button', { name: /Copy Text/i });
    fireEvent.click(copyButton);

    const expectedText = `DeFiTuna Lending Position:\nVault: TUNA (short:vault1)\nWallet: short:auth1\nFunds: $200\nSupply APY: 3.50%\nEarned: $20`;
    expect(mockCopyToClipboard).toHaveBeenCalledWith(expectedText);
  });
}); 