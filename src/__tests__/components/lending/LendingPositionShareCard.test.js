import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LendingPositionShareCard } from '../../../components/lending/LendingPositionShareCard';

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
    funds_amount: 100,
    funds_usd_value: 200,
    earned_amount: 10,
    earned_usd_value: 20,
    vaultSymbol: 'TUNA',
    supplyApy: 3.5,
  };

  it('renders nothing if no position', () => {
    const { container } = render(<LendingPositionShareCard position={null} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders card with correct data', () => {
    render(<LendingPositionShareCard position={basePosition} onClose={jest.fn()} />);
    expect(screen.getByText('TUNA Position Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Vault:')).toBeInTheDocument();
    expect(screen.getByText('Wallet:')).toBeInTheDocument();
    expect(screen.getByText('Funds:')).toBeInTheDocument();
    expect(screen.getByText('Supply APY:')).toBeInTheDocument();
    expect(screen.getByText('Earned:')).toBeInTheDocument();
    expect(screen.getByText(/TUNA \(short:vault1\)/)).toBeInTheDocument();
    expect(screen.getByText('short:auth1')).toBeInTheDocument();
    expect(screen.getByText('100 ($200)')).toBeInTheDocument();
    expect(screen.getByText('3.50%')).toBeInTheDocument();
    expect(screen.getByText('10 ($20)')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<LendingPositionShareCard position={basePosition} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls exportCardAsImage when Download PNG is clicked', () => {
    render(<LendingPositionShareCard position={basePosition} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTitle(/download as png/i));
    expect(mockExportCardAsImage).toHaveBeenCalled();
  });

  it('calls shareCard when Share is clicked', () => {
    render(<LendingPositionShareCard position={basePosition} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTitle(/share this snapshot/i));
    expect(mockShareCard).toHaveBeenCalled();
  });

  it('calls copyToClipboard when Copy Text is clicked', () => {
    render(<LendingPositionShareCard position={basePosition} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTitle(/copy details as text/i));
    expect(mockCopyToClipboard).toHaveBeenCalled();
  });
}); 