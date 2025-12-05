import { getFirstTransactionTimestamp } from 'src/utils/solanaUtils';

describe('getFirstTransactionTimestamp', () => {
  const address = 'testAddress';
  const endpoint = 'https://api.mainnet-beta.solana.com';

  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns the oldest blockTime from transactions', async () => {
    (global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          { blockTime: 2000 },
          { blockTime: 1000 },
          { blockTime: 3000 },
        ],
      }),
    });
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBe(1000);
  });

  it('returns null if no transactions', async () => {
    (global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ result: [] }),
    });
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBeNull();
  });

  it('ignores transactions with missing blockTime', async () => {
    (global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          { blockTime: null },
          { },
          { blockTime: 1234 },
        ],
      }),
    });
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBe(1234);
  });

  it('returns null if all blockTimes are missing', async () => {
    (global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          { blockTime: null },
          { },
        ],
      }),
    });
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBeNull();
  });

  it('returns null on HTTP error', async () => {
    (global.fetch).mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error', text: async () => 'fail' });
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBeNull();
  });

  it('returns null on RPC error', async () => {
    (global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: 'RPC fail' } }),
    });
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch).mockRejectedValue(new Error('network fail'));
    const ts = await getFirstTransactionTimestamp(address);
    expect(ts).toBeNull();
  });
});