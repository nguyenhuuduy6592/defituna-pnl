import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../../hooks/useWallet';

// Mock localStorage
let localStorageMock = {};

beforeAll(() => {
  global.Storage.prototype.setItem = jest.fn((key, value) => {
    localStorageMock[key] = value;
  });
  global.Storage.prototype.getItem = jest.fn(
    (key) => localStorageMock[key] || null
  );
  global.Storage.prototype.removeItem = jest.fn((key) => {
    delete localStorageMock[key];
  });
  global.Storage.prototype.clear = jest.fn(() => {
    localStorageMock = {};
  });
});

beforeEach(() => {
  // Reset mocks and localStorage before each test
  localStorageMock = {};
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
});

afterEach(() => {
  // Restore console.error
  console.error.mockRestore();
});

describe('useWallet Hook', () => {
  describe('Initialization', () => {
    it('should initialize with default empty values when localStorage is empty', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.wallet).toBe('');
      expect(result.current.activeWallets).toEqual([]);
      expect(result.current.savedWallets).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('wallets');
      expect(localStorage.getItem).toHaveBeenCalledWith('activeWallets');
      // The hook DOES check lastWallet for backward compatibility even if activeWallets is null/missing
      expect(localStorage.getItem).toHaveBeenCalledWith('lastWallet');
    });

    it('should load valid savedWallets and activeWallets from localStorage', () => {
      const mockSaved = ['0x123', '0x456'];
      const mockActive = ['0x123'];
      localStorageMock['wallets'] = JSON.stringify(mockSaved);
      localStorageMock['activeWallets'] = JSON.stringify(mockActive);

      const { result } = renderHook(() => useWallet());

      expect(result.current.savedWallets).toEqual(mockSaved);
      expect(result.current.activeWallets).toEqual(mockActive);
      expect(result.current.wallet).toBe(''); // Wallet input remains empty on load unless using backward compat
      expect(localStorage.getItem).toHaveBeenCalledTimes(2); // wallets, activeWallets
    });

    it('should handle backward compatibility: load lastWallet if activeWallets is missing', () => {
      const mockSaved = ['0xabc', '0xdef'];
      const mockLast = '0xdef';
      localStorageMock['wallets'] = JSON.stringify(mockSaved);
      localStorageMock['lastWallet'] = mockLast;
      localStorageMock['activeWallets'] = null; // activeWallets is missing

      const { result } = renderHook(() => useWallet());

      expect(result.current.savedWallets).toEqual(mockSaved);
      expect(result.current.activeWallets).toEqual([mockLast]); // Should activate the lastWallet
      expect(result.current.wallet).toBe(''); // Input still empty
      expect(localStorage.getItem).toHaveBeenCalledTimes(3); // wallets, activeWallets, lastWallet
      expect(localStorage.getItem).toHaveBeenCalledWith('lastWallet');
    });

    it('should handle invalid JSON in localStorage for savedWallets', () => {
      localStorageMock['wallets'] = 'invalid-json';
      localStorageMock['activeWallets'] = JSON.stringify(['0x111']);

      const { result } = renderHook(() => useWallet());

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(result.current.savedWallets).toEqual([]); // Should reset to default
      expect(result.current.activeWallets).toEqual([]); // Should reset to default
      expect(result.current.wallet).toBe(''); // Should reset to default
    });

    it('should handle invalid JSON in localStorage for activeWallets', () => {
      localStorageMock['wallets'] = JSON.stringify(['0x222']);
      localStorageMock['activeWallets'] = 'invalid-json';

      const { result } = renderHook(() => useWallet());

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(result.current.savedWallets).toEqual([]); // Reset
      expect(result.current.activeWallets).toEqual([]); // Reset
      expect(result.current.wallet).toBe(''); // Reset
    });

    it('should handle error during localStorage.getItem', () => {
      // Mock getItem to throw an error for one of the calls
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'wallets') {
          throw new Error('Simulated storage error');
        }
        return null;
      });

      const { result } = renderHook(() => useWallet());

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading wallet data from localStorage:',
        expect.any(Error)
      );
      expect(result.current.savedWallets).toEqual([]);
      expect(result.current.activeWallets).toEqual([]);
      expect(result.current.wallet).toBe('');
    });
  });

  describe('State Updates & localStorage Persistence', () => {
    it('setWallet should update wallet state and save to localStorage', () => {
      const { result } = renderHook(() => useWallet());
      const newWallet = '0xabc';

      // Clear mocks *after* initial render/save
      jest.clearAllMocks();

      act(() => {
        result.current.setWallet(newWallet);
      });

      expect(result.current.wallet).toBe(newWallet);
      // Should save wallet, activeWallets, and savedWallets
      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'lastWallet',
        newWallet
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify(result.current.activeWallets)
      ); // Use current state from hook
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify(result.current.savedWallets)
      ); // Use current state from hook
    });

    it('setActiveWallets should update state and save to localStorage', () => {
      const { result } = renderHook(() => useWallet());
      const newActive = ['0x111', '0x222'];

      jest.clearAllMocks(); // Clear after initial render

      act(() => {
        result.current.setActiveWallets(newActive);
      });

      expect(result.current.activeWallets).toEqual(newActive);
      // Saves activeWallets, wallets. Removes lastWallet if wallet state is empty.
      expect(localStorage.setItem).toHaveBeenCalledTimes(2);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify(newActive)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify(result.current.savedWallets)
      );
      expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith('lastWallet');
    });

    it('addWallet should add a new wallet to savedWallets and save', () => {
      const { result } = renderHook(() => useWallet());
      const walletToAdd = '0x789';

      jest.clearAllMocks(); // Clear after initial render

      act(() => {
        result.current.addWallet(walletToAdd);
      });

      expect(result.current.savedWallets).toEqual([walletToAdd]);
      // Saves wallets, activeWallets. Removes lastWallet if wallet state is empty.
      expect(localStorage.setItem).toHaveBeenCalledTimes(2);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([walletToAdd])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify(result.current.activeWallets)
      );
      expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith('lastWallet');
    });

    it('addWallet should not add a duplicate wallet', () => {
      const existingWallet = '0x789';
      const { result } = renderHook(() => useWallet());

      // Add the wallet first
      act(() => {
        result.current.addWallet(existingWallet);
      });
      // Verify it was added
      expect(result.current.savedWallets).toEqual([existingWallet]);

      jest.clearAllMocks(); // Clear mocks after the first add

      // Try adding duplicate
      act(() => {
        result.current.addWallet(existingWallet);
      });

      expect(result.current.savedWallets).toEqual([existingWallet]); // State should remain unchanged
      // Save effect shouldn't trigger if state didn't change
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('removeWallet should remove from saved and active wallets, update primary, and save', () => {
      const wallet1 = '0xaaa';
      const wallet2 = '0xbbb';
      const { result } = renderHook(() => useWallet());

      // Setup: Add and activate both wallets
      act(() => {
        result.current.addWallet(wallet1);
      });
      act(() => {
        result.current.addWallet(wallet2);
      });
      act(() => {
        result.current.toggleWalletActive(wallet1);
      });
      act(() => {
        result.current.toggleWalletActive(wallet2);
      }); // wallet2 is now primary

      // Verify setup state before clearing mocks
      expect(result.current.wallet).toBe(wallet2);
      expect(result.current.savedWallets).toEqual([wallet1, wallet2]);
      expect(result.current.activeWallets).toEqual([wallet1, wallet2]);

      jest.clearAllMocks(); // Clear mocks after setup

      // Remove the primary active wallet
      act(() => {
        result.current.removeWallet(wallet2);
      });

      // Assert final state
      expect(result.current.savedWallets).toEqual([wallet1]);
      expect(result.current.activeWallets).toEqual([wallet1]);
      expect(result.current.wallet).toBe(wallet1); // Primary wallet updated

      // Assert save effect calls for this specific action
      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([wallet1])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify([wallet1])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('lastWallet', wallet1);
    });

    it('removeWallet should only remove from saved if not active', () => {
      const wallet1 = '0xaaa';
      const wallet2 = '0xbbb';
      const { result } = renderHook(() => useWallet());

      // Setup: Add both, activate only wallet1
      act(() => {
        result.current.addWallet(wallet1);
      });
      act(() => {
        result.current.addWallet(wallet2);
      });
      act(() => {
        result.current.toggleWalletActive(wallet1);
      }); // wallet1 is primary

      // Verify setup state
      expect(result.current.wallet).toBe(wallet1);
      expect(result.current.savedWallets).toEqual([wallet1, wallet2]);
      expect(result.current.activeWallets).toEqual([wallet1]);

      jest.clearAllMocks(); // Clear mocks after setup

      // Remove non-active wallet
      act(() => {
        result.current.removeWallet(wallet2);
      });

      // Assert final state
      expect(result.current.savedWallets).toEqual([wallet1]);
      expect(result.current.activeWallets).toEqual([wallet1]); // Active unchanged
      expect(result.current.wallet).toBe(wallet1); // Primary unchanged

      // Assert save effect calls for this action
      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([wallet1])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify([wallet1])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('lastWallet', wallet1);
    });

    it('toggleWalletActive should activate an inactive wallet, update primary, and save', () => {
      const wallet1 = '0xccc';
      const { result } = renderHook(() => useWallet());
      // Add but don't activate initially
      act(() => {
        result.current.addWallet(wallet1);
      });
      expect(result.current.activeWallets).toEqual([]);
      expect(result.current.wallet).toBe('');

      jest.clearAllMocks(); // Clear after setup

      act(() => {
        result.current.toggleWalletActive(wallet1);
      });

      expect(result.current.activeWallets).toEqual([wallet1]);
      expect(result.current.wallet).toBe(wallet1); // Should become primary

      // Assert save calls
      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify([wallet1])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('lastWallet', wallet1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([wallet1])
      ); // Saved wallets state
    });

    it('toggleWalletActive should deactivate an active wallet, update primary, and save', () => {
      const wallet1 = '0xccc';
      const wallet2 = '0xddd';
      const { result } = renderHook(() => useWallet());

      // Setup: Add and activate both
      act(() => {
        result.current.addWallet(wallet1);
      });
      act(() => {
        result.current.addWallet(wallet2);
      });
      act(() => {
        result.current.toggleWalletActive(wallet1);
      });
      act(() => {
        result.current.toggleWalletActive(wallet2);
      }); // wallet2 is primary
      expect(result.current.wallet).toBe(wallet2);

      jest.clearAllMocks(); // Clear after setup

      // Deactivate primary
      act(() => {
        result.current.toggleWalletActive(wallet2);
      });

      expect(result.current.activeWallets).toEqual([wallet1]);
      expect(result.current.wallet).toBe(wallet1); // wallet1 becomes primary

      // Assert save calls
      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify([wallet1])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('lastWallet', wallet1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([wallet1, wallet2])
      ); // saved wallets remain
    });

    it('toggleWalletActive should clear primary wallet if last active wallet is deactivated', () => {
      const wallet1 = '0xeee';
      const { result } = renderHook(() => useWallet());

      // Setup: Add and activate wallet1
      act(() => {
        result.current.addWallet(wallet1);
      });
      act(() => {
        result.current.toggleWalletActive(wallet1);
      });
      expect(result.current.wallet).toBe(wallet1);

      jest.clearAllMocks(); // Clear after setup

      // Deactivate the only active wallet
      act(() => {
        result.current.toggleWalletActive(wallet1);
      });

      expect(result.current.activeWallets).toEqual([]);
      expect(result.current.wallet).toBe(''); // Primary cleared

      // Assert save effect calls
      // The useEffect triggers setItem for wallets, activeWallets, and checks lastWallet
      // Since lastWallet becomes empty, removeItem is called instead of setItem for it.
      expect(localStorage.setItem).toHaveBeenCalledTimes(2); // Saves empty active, saved
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify([])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([wallet1])
      ); // Saved remains
      expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith('lastWallet');
    });

    it('clearWallets should clear all state and localStorage items', () => {
      const { result } = renderHook(() => useWallet());

      // Setup: Add some wallets
      act(() => {
        result.current.addWallet('0x1');
      });
      act(() => {
        result.current.addWallet('0x2');
      });
      act(() => {
        result.current.toggleWalletActive('0x1');
      });
      // Verify setup state is not empty
      expect(result.current.savedWallets).toEqual(['0x1', '0x2']);
      expect(result.current.activeWallets).toEqual(['0x1']);
      expect(result.current.wallet).toBe('0x1');

      jest.clearAllMocks(); // Clear after setup

      act(() => {
        result.current.clearWallets();
      });

      // Assert final state
      expect(result.current.wallet).toBe('');
      expect(result.current.activeWallets).toEqual([]);
      expect(result.current.savedWallets).toEqual([]);

      // Assert save effect calls
      // The useEffect triggers setItem for wallets, activeWallets, and checks lastWallet
      // Since lastWallet becomes empty, removeItem is called instead of setItem for it.
      expect(localStorage.setItem).toHaveBeenCalledTimes(2); // Saves empty wallets, activeWallets
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'wallets',
        JSON.stringify([])
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeWallets',
        JSON.stringify([])
      );
      expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith('lastWallet');
    });
  });

  describe('Error Handling', () => {
    it('should log an error if localStorage.setItem fails during save', () => {
      // Render hook first to allow initial useEffect saves to run (or fail)
      const { result } = renderHook(() => useWallet());
      const walletToAdd = '0xErrorWallet';

      // Mock setItem to throw an error *after* initial setup
      const setItemError = new Error('Simulated setItem error');
      const setItemMock = jest.spyOn(Storage.prototype, 'setItem');
      setItemMock.mockImplementation(() => {
        throw setItemError;
      });

      // Clear console mock *after* initial render potentially logged errors
      console.error.mockClear();
      // Clear setItem mock calls from initial render too
      setItemMock.mockClear();

      // Act: Trigger a state change that causes a save attempt
      act(() => {
        result.current.addWallet(walletToAdd);
      });

      // Assert state updated correctly despite save error
      expect(result.current.savedWallets).toEqual([walletToAdd]);

      // Assert console.error was called exactly once *for this action*
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Error saving wallet data to localStorage:',
        setItemError
      );
      // Assert the failing call to setItem happened once (it throws on the first attempt)
      expect(setItemMock).toHaveBeenCalledTimes(1);
    });
  });
});
