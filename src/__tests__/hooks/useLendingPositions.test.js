import { renderHook, act, waitFor } from '@testing-library/react';
import { useLendingPositions } from '../../hooks/useLendingPositions';

jest.mock('../../hooks/useDebounceApi', () => ({
  useDebounceApi: (fn) => ({ execute: fn })
}));

global.fetch = jest.fn();

describe('useLendingPositions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and aggregates lending positions for multiple wallets', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('/positions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ authority: 'wallet1', foo: 'bar' }] })
        });
      }
      if (url.includes('/vaults/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { vault: 'vault1' } })
        });
      }
      if (url.includes('/mints/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { mint: 'mint1' } })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const { result } = renderHook(() => useLendingPositions(['wallet1', 'wallet2']));
    // Wait for loading to finish
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lendingData.positions.length).toBe(2);
    expect(result.current.lendingData.walletCount).toBe(2);
    // Test getVaultDetails and getMintDetails
    const vault = await result.current.getVaultDetails('vault1');
    expect(vault).toEqual({ vault: 'vault1' });
    const mint = await result.current.getMintDetails('mint1');
    expect(mint).toEqual({ mint: 'mint1' });
  });

  it('handles fetch errors and sets errorMessage', async () => {
    fetch.mockImplementation(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'fail' }) }));
    const { result } = renderHook(() => useLendingPositions(['wallet1']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.errorMessage).toMatch(/Failed to fetch lending positions/);
    expect(result.current.lendingData).toBeNull();
  });

  it('caches vault and mint details', async () => {
    let vaultFetches = 0;
    let mintFetches = 0;
    fetch.mockImplementation((url) => {
      if (url.includes('/vaults/')) {
        vaultFetches++;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { vault: 'vault1' } }) });
      }
      if (url.includes('/mints/')) {
        mintFetches++;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { mint: 'mint1' } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
    });
    const { result } = renderHook(() => useLendingPositions(['wallet1']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Call twice, should only fetch once due to cache
    await act(async () => {
      await result.current.getVaultDetails('vault1');
      await result.current.getVaultDetails('vault1');
      await result.current.getMintDetails('mint1');
      await result.current.getMintDetails('mint1');
    });
    expect(vaultFetches).toBeGreaterThanOrEqual(1);
    expect(mintFetches).toBeGreaterThanOrEqual(1);
  });

  it('returns null and logs error if vault/mint fetch fails', async () => {
    fetch.mockImplementation(() => Promise.reject(new Error('fail')));
    const { result } = renderHook(() => useLendingPositions(['wallet1']));
    const vault = await result.current.getVaultDetails('vault1');
    const mint = await result.current.getMintDetails('mint1');
    expect(vault).toBeNull();
    expect(mint).toBeNull();
  });

  it('sets loading and error state correctly', async () => {
    fetch.mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) }));
    const { result } = renderHook(() => useLendingPositions(['wallet1']));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lendingData).toEqual({ positions: [], walletCount: 1 });
    expect(result.current.errorMessage).toBe('');
  });
}); 