import { VaultData, PriceData, TokenInfo } from '@/utils/api/lending';

export const mockVaultData: VaultData = {
  address: 'mock-vault-address',
  mint: 'mock-token-mint',
  depositedFunds: {
    amount: '1000',
    usdValue: 1000
  },
  borrowedFunds: {
    amount: '500',
    usdValue: 500
  },
  supplyLimit: {
    amount: '2000',
    usdValue: 2000
  },
  utilization: 50,
  supplyApy: 5.5,
  borrowApy: 8.5,
  borrowedShares: '500',
  depositedShares: '1000',
  pythOracleFeedId: 'mock-oracle-feed',
  pythOraclePriceUpdate: '2024-03-20T00:00:00Z'
};

export const mockPriceData: PriceData = {
  mint: 'mock-token-mint',
  price: 1.23,
  decimals: 9,
  timestamp: Date.now()
};

export const mockTokenInfo: TokenInfo = {
  mint: 'mock-token-mint',
  symbol: 'MOCK',
  decimals: 9,
  logo: 'https://example.com/mock.png'
};

export function setupFetchMock() {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/vaults')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{
              address: mockVaultData.address,
              mint: mockVaultData.mint,
              deposited_funds: {
                amount: mockVaultData.depositedFunds.amount,
                usd: mockVaultData.depositedFunds.usdValue
              },
              borrowed_funds: {
                amount: mockVaultData.borrowedFunds.amount,
                usd: mockVaultData.borrowedFunds.usdValue
              },
              supply_limit: {
                amount: mockVaultData.supplyLimit.amount,
                usd: mockVaultData.supplyLimit.usdValue
              },
              utilization: mockVaultData.utilization,
              supply_apy: mockVaultData.supplyApy,
              borrow_apy: mockVaultData.borrowApy,
              borrowed_shares: mockVaultData.borrowedShares,
              deposited_shares: mockVaultData.depositedShares,
              pyth_oracle_feed_id: mockVaultData.pythOracleFeedId,
              pyth_oracle_price_update: mockVaultData.pythOraclePriceUpdate
            }]
          })
        });
      }
      if (url.includes('/price-data')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              mint: mockPriceData.mint,
              price: mockPriceData.price,
              decimals: mockPriceData.decimals,
              timestamp: mockPriceData.timestamp
            }
          })
        });
      }
      if (url.includes('/token-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              mint: mockTokenInfo.mint,
              symbol: mockTokenInfo.symbol,
              decimals: mockTokenInfo.decimals,
              logo: mockTokenInfo.logo
            }
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });
}

describe('lending-api test setup', () => {
  it('exports mock data and setup function', () => {
    expect(mockVaultData).toBeDefined();
    expect(mockPriceData).toBeDefined();
    expect(mockTokenInfo).toBeDefined();
    expect(setupFetchMock).toBeDefined();
  });
}); 