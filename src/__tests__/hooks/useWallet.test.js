import { renderHook, act } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';
import { initializeDB, getData, saveData, STORE_NAMES } from '@/utils/indexedDB';

// Mock indexedDB functions
jest.mock('@/utils/indexedDB', () => ({
  initializeDB: jest.fn(),
  getData: jest.fn(),
  saveData: jest.fn(),
  STORE_NAMES: {
    WALLETS: 'wallets'
  }
}));

describe('useWallet Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful DB initialization
    initializeDB.mockResolvedValue({});
  });

  it('should initialize with empty values', async () => {
    getData.mockResolvedValueOnce({ value: [] }); // savedWallets
    getData.mockResolvedValueOnce({ value: [] }); // activeWallets
    getData.mockResolvedValueOnce({ value: null }); // lastWallet

    const { result } = renderHook(() => useWallet());

    // Wait for useEffect to complete
    await act(async () => {});

    expect(result.current.wallet).toBe('');
    expect(result.current.savedWallets).toEqual([]);
    expect(result.current.activeWallets).toEqual([]);
  });

  it('should load existing data from IndexedDB', async () => {
    getData.mockResolvedValueOnce({ value: ['wallet1', 'wallet2'] }); // savedWallets
    getData.mockResolvedValueOnce({ value: ['wallet1'] }); // activeWallets
    getData.mockResolvedValueOnce({ value: 'wallet1' }); // lastWallet

    const { result } = renderHook(() => useWallet());

    await act(async () => {});

    expect(result.current.savedWallets).toEqual(['wallet1', 'wallet2']);
    expect(result.current.activeWallets).toEqual(['wallet1']);
  });

  it('should handle IndexedDB initialization failure', async () => {
    initializeDB.mockRejectedValueOnce(new Error('DB init failed'));
    console.error = jest.fn(); // Mock console.error

    const { result } = renderHook(() => useWallet());

    await act(async () => {});

    expect(result.current.savedWallets).toEqual([]);
    expect(result.current.activeWallets).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should add wallet to savedWallets', async () => {
    // Setup initial state
    getData.mockResolvedValueOnce({ value: [] }); // Initial savedWallets
    getData.mockResolvedValueOnce({ value: [] }); // Initial activeWallets
    getData.mockResolvedValueOnce({ value: null }); // Initial lastWallet

    const { result } = renderHook(() => useWallet());
    
    // Wait for initial data load
    await act(async () => {
      await Promise.resolve();
    });

    // Clear previous saveData calls from initialization
    saveData.mockClear();

    // Add wallet
    await act(async () => {
      result.current.addWallet('newWallet');
      // Wait for effects to complete
      await Promise.resolve();
    });

    // Verify state was updated
    expect(result.current.savedWallets).toEqual(['newWallet']);
    
    // Verify that at least one saveData call included the new wallet
    expect(saveData.mock.calls.some(call => 
      call[1] === STORE_NAMES.WALLETS && 
      call[2].key === 'wallets' &&
      Array.isArray(call[2].value) &&
      call[2].value.includes('newWallet')
    )).toBe(true);
  });

  it('should prevent duplicate wallets in savedWallets', async () => {
    getData.mockResolvedValueOnce({ value: ['existingWallet'] }); // Initial savedWallets
    getData.mockResolvedValueOnce({ value: [] }); // Initial activeWallets
    getData.mockResolvedValueOnce({ value: null }); // Initial lastWallet

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {});

    act(() => {
      result.current.addWallet('existingWallet');
    });

    expect(result.current.savedWallets).toEqual(['existingWallet']);
  });

  it('should toggle wallet active status', async () => {
    getData.mockResolvedValueOnce({ value: ['wallet1'] }); // savedWallets
    getData.mockResolvedValueOnce({ value: [] }); // activeWallets
    getData.mockResolvedValueOnce({ value: null }); // lastWallet

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {});

    act(() => {
      result.current.toggleWalletActive('wallet1');
    });

    expect(result.current.activeWallets).toEqual(['wallet1']);
    expect(result.current.wallet).toBe('wallet1');

    act(() => {
      result.current.toggleWalletActive('wallet1');
    });

    expect(result.current.activeWallets).toEqual([]);
    expect(result.current.wallet).toBe('');
  });

  it('should remove wallet and update related states', async () => {
    getData.mockResolvedValueOnce({ value: ['wallet1', 'wallet2'] }); // savedWallets
    getData.mockResolvedValueOnce({ value: ['wallet1'] }); // activeWallets
    getData.mockResolvedValueOnce({ value: 'wallet1' }); // lastWallet

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {});

    act(() => {
      result.current.removeWallet('wallet1');
    });

    expect(result.current.savedWallets).toEqual(['wallet2']);
    expect(result.current.activeWallets).toEqual([]);
    expect(result.current.wallet).toBe('');
  });

  it('should clear all wallet data', async () => {
    getData.mockResolvedValueOnce({ value: ['wallet1', 'wallet2'] }); // savedWallets
    getData.mockResolvedValueOnce({ value: ['wallet1'] }); // activeWallets
    getData.mockResolvedValueOnce({ value: 'wallet1' }); // lastWallet

    const { result } = renderHook(() => useWallet());
    
    await act(async () => {});

    act(() => {
      result.current.clearWallets();
    });

    expect(result.current.savedWallets).toEqual([]);
    expect(result.current.activeWallets).toEqual([]);
    expect(result.current.wallet).toBe('');
  });
});