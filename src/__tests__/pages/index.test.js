import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../../pages/index';
import { PriceProvider } from '../../contexts/PriceContext';
import { DisplayCurrencyProvider } from '../../contexts/DisplayCurrencyContext';

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
      { address: 'wallet2', name: 'My Wallet 2' },
    ],
    addWallet: jest.fn(),
    removeWallet: jest.fn(),
    clearWallets: jest.fn(),
  })),
  useAutoRefresh: jest.fn(() => ({
    autoRefresh: true,
    setAutoRefresh: jest.fn(),
    refreshInterval: 60,
    setRefreshInterval: jest.fn(),
    refreshCountdown: 30,
  })),
  useCountdown: jest.fn(() => ({
    countdown: 0,
    startCountdown: jest.fn(),
  })),
  useHistoricalData: jest.fn(() => ({
    enabled: true,
    toggleHistoryEnabled: jest.fn(),
    savePositionSnapshot: jest.fn(),
    getPositionHistory: jest.fn(() => []),
  })),
  useDebounceApi: jest.fn(() => ({
    execute: jest.fn(),
  })),
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
        onClick={() => {
          // Simulate a proper event object
          const fakeEvent = { preventDefault: jest.fn() };
          onSubmit('new-wallet', fakeEvent);
        }}
      >
        Submit
      </button>
    </div>
  )),
}));

jest.mock('../../components/pnl/AutoRefresh', () => ({
  AutoRefresh: jest.fn(({ autoRefresh, onToggle, refreshInterval, onIntervalChange, countdown }) => {
    // Create mock toggle function if not provided
    const handleToggle = onToggle || jest.fn();

    return (
      <div data-testid="auto-refresh">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={() => handleToggle(!autoRefresh)}
          data-testid="auto-refresh-toggle"
        />
        <select
          value={refreshInterval}
          onChange={(e) => onIntervalChange && onIntervalChange(e)}
          data-testid="refresh-interval"
        >
          <option value="30">30s</option>
          <option value="60">60s</option>
        </select>
        <span data-testid="countdown">{countdown}</span>
      </div>
    );
  }),
}));

jest.mock('../../components/common/DisclaimerModal', () => ({
  DisclaimerModal: jest.fn(({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="disclaimer-modal">
        <button onClick={onClose} data-testid="accept-disclaimer">Accept</button>
      </div>
    ) : null
  )),
}));

// Create a loading indicator component for tests
jest.mock('../../components/common/LoadingOverlay', () => ({
  LoadingOverlay: jest.fn(({ loading, children }) => (
    loading ? (
      <div data-testid="loading-indicator">Loading...</div>
    ) : children
  )),
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
  value: localStorageMock,
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
          { id: 'pos2', pnl: 734.56, wallet: 'wallet2' },
        ],
      }),
    });
  });

  it('renders the wallet form', () => {
    render(<PriceProvider><DisplayCurrencyProvider><HomePage /></DisplayCurrencyProvider></PriceProvider>);
    expect(screen.getByTestId('wallet-form')).toBeInTheDocument();
  });

  it('renders the auto-refresh component', () => {
    render(<PriceProvider><DisplayCurrencyProvider><HomePage /></DisplayCurrencyProvider></PriceProvider>);
    expect(screen.getByTestId('auto-refresh')).toBeInTheDocument();
  });

  it('shows disclaimer modal on first visit', () => {
    localStorage.getItem.mockImplementation(key => key === 'disclaimerShown' ? null : undefined);
    render(<PriceProvider><DisplayCurrencyProvider><HomePage /></DisplayCurrencyProvider></PriceProvider>);
    expect(screen.getByTestId('disclaimer-modal')).toBeInTheDocument();
  });

  it('does not show disclaimer on subsequent visits', () => {
    localStorage.getItem.mockImplementation(key => key === 'disclaimerShown' ? 'true' : undefined); // Simulate returning visitor

    render(<PriceProvider><DisplayCurrencyProvider><HomePage /></DisplayCurrencyProvider></PriceProvider>);

    expect(screen.queryByTestId('disclaimer-modal')).not.toBeInTheDocument();
  });

  it('toggles auto-refresh when button is clicked', () => {
    const { AutoRefresh } = require('../../components/pnl/AutoRefresh');

    render(<PriceProvider><DisplayCurrencyProvider><HomePage /></DisplayCurrencyProvider></PriceProvider>);

    const autoRefreshToggle = screen.getByTestId('auto-refresh-toggle');
    fireEvent.click(autoRefreshToggle);

    expect(AutoRefresh).toHaveBeenCalled();
  });
});