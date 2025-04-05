import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletForm } from '../../../components/pnl/WalletForm';
import { copyToClipboard, showNotification } from '../../../utils/notifications';
import { isValidWalletAddress } from '../../../utils/validation';

// Mock dependencies
jest.mock('../../../utils/notifications', () => ({
  copyToClipboard: jest.fn(),
  showNotification: jest.fn()
}));

jest.mock('../../../utils/validation', () => ({
  isValidWalletAddress: jest.fn()
}));

// Mock formatWalletAddress since it's used in the component
jest.mock('../../../utils', () => ({
  formatWalletAddress: jest.fn(address => `${address.slice(0, 6)}...${address.slice(-4)}`)
}));

// Mock the sub-components
jest.mock('../../../components/pnl/SavedWalletsDropdown', () => {
  const MockSavedWalletsDropdown = ({ uniqueSavedWallets, activeWallets, onWalletChange, toggleWalletActive, onRemoveWallet }) => (
    <div data-testid="saved-wallets-dropdown">
      {uniqueSavedWallets.map(wallet => (
        <div key={wallet} data-testid={`saved-wallet-${wallet}`}>
          <button 
            onClick={() => onWalletChange(wallet)}
            data-testid={`select-wallet-${wallet}`}
          >
            Select
          </button>
          <button 
            onClick={() => toggleWalletActive(wallet)}
            data-testid={`toggle-wallet-${wallet}`}
          >
            Toggle
          </button>
          <button 
            onClick={() => onRemoveWallet(wallet)}
            data-testid={`remove-wallet-${wallet}`}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
  return MockSavedWalletsDropdown;
});

jest.mock('../../../components/pnl/ActiveWalletsDisplay', () => {
  const MockActiveWalletsDisplay = ({ activeWallets, toggleWalletActive, handleChipKeyDown }) => (
    activeWallets && activeWallets.length > 0 ? (
      <div data-testid="active-wallets-display">
        {activeWallets.map(wallet => (
          <div key={wallet} data-testid={`active-wallet-${wallet}`}>
            <span 
              data-testid={`wallet-chip-${wallet}`}
              onClick={() => copyToClipboard(wallet)}
              onKeyDown={(e) => handleChipKeyDown(e, wallet)}
              tabIndex={0}
              role="button"
            >
              {wallet}
            </span>
            <button 
              data-testid={`remove-active-wallet-${wallet}`}
              onClick={() => toggleWalletActive(wallet)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    ) : null
  );
  return MockActiveWalletsDisplay;
});

describe('WalletForm', () => {
  // Default props
  const defaultProps = {
    wallet: '',
    onWalletChange: jest.fn(),
    activeWallets: [],
    setActiveWallets: jest.fn(),
    toggleWalletActive: jest.fn(),
    onSubmit: jest.fn(),
    loading: false,
    countdown: 0,
    savedWallets: [],
    showDropdown: false,
    setShowDropdown: jest.fn(),
    onRemoveWallet: jest.fn(),
    onClearWallets: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isValidWalletAddress.mockImplementation(address => 
      /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{44}$/.test(address)
    );
  });

  // Helper to generate a valid wallet address for testing
  const validWallet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkm";

  it('renders without crashing', () => {
    render(<WalletForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter wallet address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fetch data/i })).toBeInTheDocument();
    // No active wallets, so ActiveWalletsDisplay should not render anything
    expect(screen.queryByTestId('active-wallets-display')).not.toBeInTheDocument();
  });

  it('shows submit button in different states', () => {
    // Loading state
    render(<WalletForm {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
    
    // Countdown state
    render(<WalletForm {...defaultProps} countdown={5} />);
    expect(screen.getByRole('button', { name: /wait 5 seconds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wait 5 seconds/i })).toBeDisabled();
    
    // Ready state
    render(<WalletForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /fetch data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fetch data/i })).not.toBeDisabled();
  });

  it('handles wallet input change', () => {
    render(<WalletForm {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter wallet address');
    
    fireEvent.change(input, { target: { value: 'test-wallet' } });
    
    expect(defaultProps.onWalletChange).toHaveBeenCalledWith('test-wallet');
  });

  it('shows dropdown when input is focused', () => {
    render(<WalletForm {...defaultProps} savedWallets={['wallet1', 'wallet2']} />);
    const input = screen.getByPlaceholderText('Enter wallet address');
    
    fireEvent.focus(input);
    
    expect(defaultProps.setShowDropdown).toHaveBeenCalledWith(true);
  });

  it('hides dropdown when input loses focus', () => {
    jest.useFakeTimers();
    render(<WalletForm {...defaultProps} />);
    const input = screen.getByPlaceholderText('Enter wallet address');
    
    fireEvent.blur(input);
    jest.advanceTimersByTime(200);
    
    expect(defaultProps.setShowDropdown).toHaveBeenCalledWith(false);
    jest.useRealTimers();
  });

  it('renders the dropdown when showDropdown is true and savedWallets exist', () => {
    render(
      <WalletForm 
        {...defaultProps} 
        showDropdown={true} 
        savedWallets={['wallet1', 'wallet2']} 
      />
    );
    
    expect(screen.getByTestId('saved-wallets-dropdown')).toBeInTheDocument();
  });

  it('does not render dropdown when showDropdown is false', () => {
    render(
      <WalletForm 
        {...defaultProps}
        showDropdown={false}
        savedWallets={['wallet1', 'wallet2']}
      />
    );
    
    expect(screen.queryByTestId('saved-wallets-dropdown')).not.toBeInTheDocument();
  });

  it('does not render dropdown when no savedWallets exist', () => {
    render(
      <WalletForm 
        {...defaultProps}
        showDropdown={true}
        savedWallets={[]}
      />
    );
    
    expect(screen.queryByTestId('saved-wallets-dropdown')).not.toBeInTheDocument();
  });

  it('renders ActiveWalletsDisplay when activeWallets exist', () => {
    render(
      <WalletForm 
        {...defaultProps}
        activeWallets={['activeWallet1', 'activeWallet2']}
      />
    );
    
    expect(screen.getByTestId('active-wallets-display')).toBeInTheDocument();
    expect(screen.getByTestId('active-wallet-activeWallet1')).toBeInTheDocument();
    expect(screen.getByTestId('active-wallet-activeWallet2')).toBeInTheDocument();
  });

  describe('form submission', () => {
    it('shows notification if no input and no active wallets', () => {
      const { container } = render(<WalletForm {...defaultProps} />);
      
      // Get the form element using querySelector instead of getByRole
      const form = container.querySelector('form');
      
      // Submit the form
      fireEvent.submit(form);
      
      expect(showNotification).toHaveBeenCalledWith('Please enter or select at least one wallet address', 'error');
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('validates wallet address if provided', () => {
      const { container } = render(
        <WalletForm 
          {...defaultProps}
          wallet="invalid-wallet"
        />
      );
      
      // Ensure validation will fail
      isValidWalletAddress.mockReturnValue(false);
      
      const form = container.querySelector('form');
      fireEvent.submit(form);
      
      expect(isValidWalletAddress).toHaveBeenCalledWith('invalid-wallet');
      expect(showNotification).toHaveBeenCalledWith('Invalid Solana wallet address format', 'error');
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('adds valid wallet to activeWallets and submits', () => {
      const { container } = render(
        <WalletForm 
          {...defaultProps}
          wallet={validWallet}
        />
      );
      
      // Ensure validation passes
      isValidWalletAddress.mockReturnValue(true);
      
      const form = container.querySelector('form');
      fireEvent.submit(form);
      
      expect(defaultProps.setActiveWallets).toHaveBeenCalledWith([validWallet]);
      expect(defaultProps.onSubmit).toHaveBeenCalled();
      expect(defaultProps.onWalletChange).toHaveBeenCalledWith('');
    });

    it('does not add duplicate wallet to activeWallets', () => {
      const { container } = render(
        <WalletForm 
          {...defaultProps}
          wallet={validWallet}
          activeWallets={[validWallet]}
        />
      );
      
      isValidWalletAddress.mockReturnValue(true);
      
      const form = container.querySelector('form');
      fireEvent.submit(form);
      
      // Should not update active wallets if wallet is already in the list
      expect(defaultProps.setActiveWallets).not.toHaveBeenCalled();
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it('submits if has active wallets even with no input', () => {
      const { container } = render(
        <WalletForm 
          {...defaultProps}
          activeWallets={[validWallet]}
        />
      );
      
      const form = container.querySelector('form');
      fireEvent.submit(form);
      
      expect(defaultProps.onSubmit).toHaveBeenCalled();
      expect(showNotification).not.toHaveBeenCalled();
    });
  });

  describe('handling keyboard accessibility', () => {
    it('copies wallet address when pressing Enter on wallet chip', () => {
      render(
        <WalletForm 
          {...defaultProps}
          activeWallets={['wallet1']}
        />
      );
      
      const walletChip = screen.getByTestId('wallet-chip-wallet1');
      fireEvent.keyDown(walletChip, { key: 'Enter' });
      
      expect(copyToClipboard).toHaveBeenCalledWith('wallet1');
    });

    it('copies wallet address when pressing Space on wallet chip', () => {
      render(
        <WalletForm 
          {...defaultProps}
          activeWallets={['wallet1']}
        />
      );
      
      const walletChip = screen.getByTestId('wallet-chip-wallet1');
      fireEvent.keyDown(walletChip, { key: ' ' });
      
      expect(copyToClipboard).toHaveBeenCalledWith('wallet1');
    });

    it('does not copy when pressing other keys on wallet chip', () => {
      render(
        <WalletForm 
          {...defaultProps}
          activeWallets={['wallet1']}
        />
      );
      
      const walletChip = screen.getByTestId('wallet-chip-wallet1');
      fireEvent.keyDown(walletChip, { key: 'Tab' });
      
      expect(copyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('integration with sub-components', () => {
    it('calls toggleWalletActive when remove button is clicked in ActiveWalletsDisplay', () => {
      render(
        <WalletForm 
          {...defaultProps}
          activeWallets={['wallet1']}
        />
      );
      
      const removeButton = screen.getByTestId('remove-active-wallet-wallet1');
      fireEvent.click(removeButton);
      
      expect(defaultProps.toggleWalletActive).toHaveBeenCalledWith('wallet1');
    });

    it('calls functions from SavedWalletsDropdown', () => {
      render(
        <WalletForm 
          {...defaultProps}
          showDropdown={true}
          savedWallets={['wallet1', 'wallet2']}
        />
      );
      
      const selectButton = screen.getByTestId('select-wallet-wallet1');
      fireEvent.click(selectButton);
      
      expect(defaultProps.onWalletChange).toHaveBeenCalledWith('wallet1');
      
      const toggleButton = screen.getByTestId('toggle-wallet-wallet2');
      fireEvent.click(toggleButton);
      
      expect(defaultProps.toggleWalletActive).toHaveBeenCalledWith('wallet2');
      
      const removeButton = screen.getByTestId('remove-wallet-wallet1');
      fireEvent.click(removeButton);
      
      expect(defaultProps.onRemoveWallet).toHaveBeenCalledWith('wallet1');
    });
  });
}); 