import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedWalletsDropdown } from '../../../components/pnl/SavedWalletsDropdown';
import { formatWalletAddress } from '../../../utils';

// Mock dependencies
jest.mock('../../../utils', () => ({
  formatWalletAddress: jest.fn(address => `${address.slice(0, 6)}...${address.slice(-4)}`)
}));

describe('SavedWalletsDropdown', () => {
  // Default props
  const defaultProps = {
    uniqueSavedWallets: ['wallet1', 'wallet2', 'wallet3'],
    activeWallets: ['wallet1'],
    onWalletChange: jest.fn(),
    toggleWalletActive: jest.fn(),
    onRemoveWallet: jest.fn(),
    onClearWallets: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dropdown with saved wallets', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Check that the dropdown container is rendered
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    // Check that all wallets are rendered
    defaultProps.uniqueSavedWallets.forEach(wallet => {
      expect(screen.getByText(formatWalletAddress(wallet))).toBeInTheDocument();
    });
    
    // Check that clear button is rendered
    expect(screen.getByRole('button', { name: /clear all wallets/i })).toBeInTheDocument();
  });

  it('highlights active wallets', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // The first wallet should have the active class (implementation-dependent)
    const walletItems = screen.getAllByRole('option');
    expect(walletItems[0]).toHaveAttribute('aria-selected', 'true');
    expect(walletItems[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('selects a wallet when clicking on it', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Click on the second wallet
    const walletText = screen.getByText(formatWalletAddress('wallet2'));
    fireEvent.click(walletText);
    
    expect(defaultProps.onWalletChange).toHaveBeenCalledWith('wallet2');
  });

  it('selects a wallet on keyboard navigation (Enter)', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Get the second wallet and press Enter
    const walletText = screen.getByText(formatWalletAddress('wallet2'));
    fireEvent.keyDown(walletText, { key: 'Enter' });
    
    expect(defaultProps.onWalletChange).toHaveBeenCalledWith('wallet2');
  });
  
  it('selects a wallet on keyboard navigation (Space)', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Get the second wallet and press Space
    const walletText = screen.getByText(formatWalletAddress('wallet2'));
    fireEvent.keyDown(walletText, { key: ' ' });
    
    expect(defaultProps.onWalletChange).toHaveBeenCalledWith('wallet2');
  });

  it('toggles wallet active status when clicking the activation button', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Get all activation buttons
    const activationButtons = screen.getAllByRole('button', { name: /(activate|deactivate) wallet/i });
    
    // Click the first button (deactivate wallet1)
    fireEvent.click(activationButtons[0]);
    expect(defaultProps.toggleWalletActive).toHaveBeenCalledWith('wallet1');
    
    // Click the second button (activate wallet2)
    fireEvent.click(activationButtons[1]);
    expect(defaultProps.toggleWalletActive).toHaveBeenCalledWith('wallet2');
  });

  it('removes a wallet when clicking the remove button', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Get all remove buttons
    const removeButtons = screen.getAllByRole('button', { name: /remove wallet/i });
    
    // Click the second button (remove wallet2)
    fireEvent.click(removeButtons[1]);
    expect(defaultProps.onRemoveWallet).toHaveBeenCalledWith('wallet2');
  });

  it('clears all wallets when clicking the clear button', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Click the clear button
    const clearButton = screen.getByRole('button', { name: /clear all wallets/i });
    fireEvent.click(clearButton);
    
    // Check that the click is properly stopped from propagating
    expect(defaultProps.onClearWallets).toHaveBeenCalled();
  });

  it('does not render the clear button when no wallets exist', () => {
    render(<SavedWalletsDropdown {...defaultProps} uniqueSavedWallets={[]} />);
    
    // Clear button should not be rendered
    expect(screen.queryByRole('button', { name: /clear all wallets/i })).not.toBeInTheDocument();
  });

  it('calls event handlers when buttons are clicked', () => {
    render(<SavedWalletsDropdown {...defaultProps} />);
    
    // Test remove wallet
    const removeButtons = screen.getAllByRole('button', { name: /remove wallet/i });
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemoveWallet).toHaveBeenCalledWith('wallet1');
    
    // Test toggle wallet active
    const activationButtons = screen.getAllByRole('button', { name: /(activate|deactivate) wallet/i });
    fireEvent.click(activationButtons[0]);
    expect(defaultProps.toggleWalletActive).toHaveBeenCalledWith('wallet1');
    
    // Test clear all
    const clearButton = screen.getByRole('button', { name: /clear all wallets/i });
    fireEvent.click(clearButton);
    expect(defaultProps.onClearWallets).toHaveBeenCalled();
  });
  
  it('prevents dropdown from closing when interacting with action buttons', () => {
    // Mock the parent component that would close the dropdown
    const onDropdownCloseSpy = jest.fn();
    const ParentComponent = () => {
      return (
        <div data-testid="parent" onClick={onDropdownCloseSpy}>
          <SavedWalletsDropdown {...defaultProps} />
        </div>
      );
    };
    
    render(<ParentComponent />);
    
    // Get buttons
    const removeButtons = screen.getAllByRole('button', { name: /remove wallet/i });
    const activationButtons = screen.getAllByRole('button', { name: /(activate|deactivate) wallet/i });
    const clearButton = screen.getByRole('button', { name: /clear all wallets/i });
    
    // Click buttons and verify parent click handler isn't triggered
    fireEvent.click(removeButtons[0]);
    fireEvent.click(activationButtons[0]);
    fireEvent.click(clearButton);
    
    // Parent handler should not be called if event propagation is stopped properly
    expect(onDropdownCloseSpy).not.toHaveBeenCalled();
  });
}); 