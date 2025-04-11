import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/pages/index';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

// Mock IndexedDB utility functions
jest.mock('@/utils/indexedDB', () => ({
  initializeDB: jest.fn().mockResolvedValue({}),
  getData: jest.fn(),
  saveData: jest.fn().mockResolvedValue(true),
  STORE_NAMES: {
    SETTINGS: 'settings'
  }
}));

// Mock hooks
jest.mock('@/hooks', () => ({
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
    refreshCountdown: 30,
    error: null
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
jest.mock('@/components/pnl/WalletForm', () => ({
  WalletForm: jest.fn(({ onSubmit }) => (
    <div data-testid="wallet-form">
      <input 
        data-testid="wallet-input" 
        placeholder="Enter wallet address"
      />
      <button 
        data-testid="submit-button" 
        onClick={() => {
          const fakeEvent = { preventDefault: jest.fn() };
          onSubmit('new-wallet', fakeEvent);
        }}
      >
        Submit
      </button>
    </div>
  ))
}));

jest.mock('@/components/pnl/AutoRefresh', () => ({
  AutoRefresh: jest.fn(({ autoRefresh, setAutoRefresh, refreshInterval, onIntervalChange, autoRefreshCountdown, loading, historyEnabled, onHistoryToggle }) => {
    return (
      <div data-testid="auto-refresh">
        <input 
          type="checkbox" 
          checked={autoRefresh} 
          onChange={() => setAutoRefresh(!autoRefresh)}
          data-testid="auto-refresh-toggle"
        />
        <select 
          value={refreshInterval} 
          onChange={(e) => onIntervalChange && onIntervalChange(e)}
          data-testid="refresh-interval"
        >
          <option value="30">30s</option>
          <option value="60">60s</option>
          <option value="300">5m</option>
        </select>
        <span data-testid="countdown">{autoRefreshCountdown}</span>
        <div data-testid="history-toggle">
          <input
            type="checkbox"
            checked={historyEnabled}
            onChange={() => onHistoryToggle && onHistoryToggle(!historyEnabled)}
          />
        </div>
        {loading && <span data-testid="loading-status">Refreshing data...</span>}
      </div>
    );
  })
}));

jest.mock('@/components/pnl/PnLDisplay', () => ({
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

jest.mock('@/components/common/DisclaimerModal', () => ({
  DisclaimerModal: jest.fn(({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="disclaimer-modal">
        <button onClick={onClose} data-testid="accept-disclaimer">Accept</button>
      </div>
    ) : null
  ))
}));

// Create a loading indicator component for tests
jest.mock('@/components/common/LoadingOverlay', () => ({
  LoadingOverlay: jest.fn(({ loading, children }) => (
    loading ? (
      <div data-testid="loading-indicator">Loading...</div>
    ) : children
  ))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

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

    // Reset IndexedDB mock
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'disclaimerShown') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
  });

  it('renders the wallet form', async () => {
    await act(async () => {
      render(<HomePage />);
    });
    expect(screen.getByTestId('wallet-form')).toBeInTheDocument();
  });

  it('renders the auto-refresh component', async () => {
    await act(async () => {
      render(<HomePage />);
    });
    expect(screen.getByTestId('auto-refresh')).toBeInTheDocument();
  });

  it('shows disclaimer modal on first visit', async () => {
    // Mock IndexedDB to return null for disclaimer (not shown before)
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'disclaimerShown') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      render(<HomePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('disclaimer-modal')).toBeInTheDocument();
    });
  });

  it('does not show disclaimer on subsequent visits', async () => {
    // Mock IndexedDB to return true for disclaimer (already shown)
    getData.mockImplementation((db, storeName, key) => {
      if (key === 'disclaimerShown') {
        return Promise.resolve({ value: true });
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      render(<HomePage />);
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('disclaimer-modal')).not.toBeInTheDocument();
    });
  });

  it('toggles auto-refresh when button is clicked', async () => {
    const mockSetAutoRefresh = jest.fn();
    const { useAutoRefresh } = require('@/hooks');
    
    useAutoRefresh.mockImplementation(() => ({
      autoRefresh: false,
      setAutoRefresh: mockSetAutoRefresh,
      refreshInterval: 60,
      setRefreshInterval: jest.fn(),
      refreshCountdown: 30,
      error: null
    }));
    
    await act(async () => {
      render(<HomePage />);
    });
    
    const autoRefreshToggle = screen.getByTestId('auto-refresh-toggle');
    
    await act(async () => {
      fireEvent.click(autoRefreshToggle);
    });
    
    expect(mockSetAutoRefresh).toHaveBeenCalledWith(true);
  });

  it('shows PnL display component', async () => {
    await act(async () => {
      render(<HomePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('pnl-display')).toBeInTheDocument();
    });
  });
});