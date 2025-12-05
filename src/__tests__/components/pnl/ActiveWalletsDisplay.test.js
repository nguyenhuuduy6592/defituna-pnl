import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActiveWalletsDisplay } from '../../../components/pnl/ActiveWalletsDisplay';
import { formatWalletAddress, copyToClipboard } from '../../../utils';

// Mock the utility functions
jest.mock('../../../utils', () => ({
  formatWalletAddress: jest.fn(address => `formatted-${address}`),
  copyToClipboard: jest.fn(),
}));

// Mock styles
jest.mock('../../../components/pnl/WalletForm.module.scss', () => ({
  activeWallets: 'activeWallets-mock',
  walletChips: 'walletChips-mock',
  walletChip: 'walletChip-mock',
  removeChip: 'removeChip-mock',
}));

describe('ActiveWalletsDisplay Component', () => {
  const mockWallets = [
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdef1234567890abcdef1234567890abcdef12',
  ];

  const defaultProps = {
    activeWallets: mockWallets,
    toggleWalletActive: jest.fn(),
    handleChipKeyDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no wallets are provided', () => {
    const { container } = render(
      <ActiveWalletsDisplay
        {...defaultProps}
        activeWallets={[]}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when activeWallets is null or undefined', () => {
    const { container: container1 } = render(
      <ActiveWalletsDisplay
        {...defaultProps}
        activeWallets={null}
      />
    );

    expect(container1).toBeEmptyDOMElement();

    const { container: container2 } = render(
      <ActiveWalletsDisplay
        {...defaultProps}
        activeWallets={undefined}
      />
    );

    expect(container2).toBeEmptyDOMElement();
  });

  it('renders a heading with the correct wallet count', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('Active Wallets (2)');
  });

  it('renders a wallet chip for each wallet address', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    const wallets = screen.getAllByRole('button');
    // Each wallet has two buttons (text part for copying and remove button)
    expect(wallets.length).toBe(4);

    // Check that the formatted addresses are displayed
    expect(screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    expect(screen.getByText('formatted-0xabcdef1234567890abcdef1234567890abcdef12')).toBeInTheDocument();

    // Verify formatWalletAddress was called
    expect(formatWalletAddress).toHaveBeenCalledTimes(2);
    expect(formatWalletAddress).toHaveBeenCalledWith(mockWallets[0]);
    expect(formatWalletAddress).toHaveBeenCalledWith(mockWallets[1]);
  });

  it('calls toggleWalletActive when remove button is clicked', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    const removeButtons = screen.getAllByText('✕');
    fireEvent.click(removeButtons[0]);

    expect(defaultProps.toggleWalletActive).toHaveBeenCalledWith(mockWallets[0]);
  });

  it('copies the wallet address when clicking on the address', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    const addresses = [
      screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678'),
      screen.getByText('formatted-0xabcdef1234567890abcdef1234567890abcdef12'),
    ];

    fireEvent.click(addresses[0]);
    expect(copyToClipboard).toHaveBeenCalledWith(mockWallets[0]);

    fireEvent.click(addresses[1]);
    expect(copyToClipboard).toHaveBeenCalledWith(mockWallets[1]);
  });

  it('calls handleChipKeyDown when a keyboard event occurs on an address', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    const address = screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678');
    const keyDownEvent = { key: 'Enter' };

    fireEvent.keyDown(address, keyDownEvent);

    expect(defaultProps.handleChipKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Enter' }),
      mockWallets[0]
    );
  });

  it('adds correct accessibility attributes', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    // Check address span accessibility
    const address = screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678');
    expect(address).toHaveAttribute('role', 'button');
    expect(address).toHaveAttribute('tabIndex', '0');
    expect(address).toHaveAttribute('title', 'Copy to clipboard');
    expect(address).toHaveAttribute('aria-label', 'Copy wallet formatted-0x1234567890abcdef1234567890abcdef12345678');

    // Check remove button accessibility
    const removeButton = screen.getAllByText('✕')[0];
    expect(removeButton).toHaveAttribute('aria-label', 'Deactivate wallet formatted-0x1234567890abcdef1234567890abcdef12345678');
    expect(removeButton).toHaveAttribute('title', 'Deactivate this wallet');
  });

  it('applies correct CSS classes', () => {
    render(<ActiveWalletsDisplay {...defaultProps} />);

    // Check main container class
    const container = screen.getByRole('heading').parentElement;
    expect(container).toHaveClass('activeWallets-mock');

    // Check wallet chips container class
    const walletChipsContainer = screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678').parentElement.parentElement;
    expect(walletChipsContainer).toHaveClass('walletChips-mock');

    // Check wallet chip class
    const walletChip = screen.getByText('formatted-0x1234567890abcdef1234567890abcdef12345678').parentElement;
    expect(walletChip).toHaveClass('walletChip-mock');

    // Check remove button class
    const removeButton = screen.getAllByText('✕')[0];
    expect(removeButton).toHaveClass('removeChip-mock');
  });
});