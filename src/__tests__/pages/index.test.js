import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../../pages/index';

// Mock hooks
jest.mock('../../hooks', () => ({
  useWallet: jest.fn(() => ({
    wallet: '',
    setWallet: jest.fn(),
    activeWallets: ['wallet1', 'wallet2'],
    setActiveWallets: jest.fn(),
    toggleWalletActive: jest.fn(),
    savedWallets: [
      { address: 'wallet1', name: 'My Wallet 1' },
      { address: 'wallet2', name: 'My Wallet 2' }
    ],
    addWallet: jest.fn(),
    removeWallet: jest.fn(),
    clearWallets: jest.fn()
  })),
  useAutoRefresh: jest.fn(() => ({
    autoRefresh: true,
    setAutoRefresh: jest.fn(),
    refreshInterval: 60,
    setRefreshInterval: jest.fn(),
    refreshCountdown: 30
  })),
  useCountdown: jest.fn(() => ({
    countdown: 0,
    startCountdown: jest.fn()
  })),
  useHistoricalData: jest.fn(() => ({
    enabled: true,
    toggleHistoryEnabled: jest.fn(),
    savePositionSnapshot: jest.fn(),
    getPositionHistory: jest.fn(() => [])
  })),
  useDebounceApi: jest.fn(() => ({
    execute: jest.fn()
  }))
}));

// Mock components
jest.mock('../../components/pnl/WalletForm', () => ({
  WalletForm: jest.fn(({ onSubmit }) => (
    <div data-testid="wallet-form">
      <input 
        data-testid="wallet-input" 
        placeholder="Enter wallet address"
      />
      <button 
        data-testid="submit-button" 
        onClick={() => onSubmit('new-wallet')}
      >
        Submit
      </button>
    </div>
  ))
}));

jest.mock('../../components/pnl/AutoRefresh', () => ({
  AutoRefresh: jest.fn(({ autoRefresh, onToggle, refreshInterval, onIntervalChange, countdown }) => (
    <div data-testid="auto-refresh">
      <input 
        type="checkbox" 
        checked={autoRefresh} 
        onChange={() => onToggle(!autoRefresh)}
        data-testid="auto-refresh-toggle"
      />
      <select 
        value={refreshInterval} 
        onChange={(e) => onIntervalChange(e)}
        data-testid="refresh-interval"
      >
        <option value="30">30s</option>
        <option value="60">60s</option>
      </select>
      <span data-testid="countdown">{countdown}</span>
    </div>
  ))
}));

jest.mock('../../components/pnl/PnLDisplay', () => ({
  PnLDisplay: jest.fn(({ data }) => (
    <div data-testid="pnl-display">
      {data ? (
        <>
          <span data-testid="total-pnl">Total PnL: ${data.totalPnL}</span>
          <div data-testid="positions-count">Positions: {data.positions.length}</div>
        </>
      ) : (
        <span>No data available</span>
      )}
    </div>
  ))
}));

jest.mock('../../components/common/DisclaimerModal', () => ({
  DisclaimerModal: jest.fn(({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="disclaimer-modal">
        <button onClick={onClose} data-testid="accept-disclaimer">Accept</button>
      </div>
    ) : null
  ))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        totalPnL: 1234.56,
        positions: [
          { id: 'pos1', pnl: 500, wallet: 'wallet1' },
          { id: 'pos2', pnl: 734.56, wallet: 'wallet2' }
        ]
      })
    });
  });

  it('renders the wallet form', () => {
    render(<HomePage />);
    expect(screen.getByTestId('wallet-form')).toBeInTheDocument();
  });

  it('renders the auto-refresh component', () => {
    render(<HomePage />);
    expect(screen.getByTestId('auto-refresh')).toBeInTheDocument();
  });

  it('shows disclaimer modal on first visit', () => {
    localStorage.getItem.mockReturnValueOnce(null); // Simulate first visit
    
    render(<HomePage />);
    
    expect(screen.getByTestId('disclaimer-modal')).toBeInTheDocument();
  });

  it('does not show disclaimer on subsequent visits', () => {
    localStorage.getItem.mockReturnValueOnce('true'); // Simulate returning visitor
    
    render(<HomePage />);
    
    expect(screen.queryByTestId('disclaimer-modal')).not.toBeInTheDocument();
  });

  it('renders loading state while fetching data', async () => {
    render(<HomePage />);
    
    // Since we're mocking a loading state, we should see a loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  it('renders error message when API fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API error'));
    
    render(<HomePage />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('renders PnL data when fetched successfully', async () => {
    render(<HomePage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('pnl-display')).toBeInTheDocument();
      expect(screen.getByTestId('total-pnl')).toHaveTextContent('Total PnL: $1234.56');
      expect(screen.getByTestId('positions-count')).toHaveTextContent('Positions: 2');
    });
  });

  it('toggles auto-refresh when button is clicked', () => {
    const { AutoRefresh } = require('../../components/pnl/AutoRefresh');
    
    render(<HomePage />);
    
    const autoRefreshToggle = screen.getByTestId('auto-refresh-toggle');
    fireEvent.click(autoRefreshToggle);
    
    expect(AutoRefresh).toHaveBeenCalled();
  });

  it('submits wallet form', async () => {
    const { WalletForm } = require('../../components/pnl/WalletForm');
    
    render(<HomePage />);
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    expect(WalletForm).toHaveBeenCalled();
    
    // Wait for fetch to be called with the new wallet
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('new-wallet')
      }));
    });
  });

  it('shows no data message when no wallets are active', () => {
    const { useWallet } = require('../../hooks');
    useWallet.mockReturnValueOnce({
      ...useWallet(),
      activeWallets: [] // No active wallets
    });
    
    render(<HomePage />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
}); 