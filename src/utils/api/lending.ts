import { z } from 'zod';

// Types
export interface VaultData {
  address: string;
  mint: string;
  depositedFunds: {
    amount: string;
    usdValue: number;
  };
  borrowedFunds: {
    amount: string;
    usdValue: number;
  };
  supplyLimit: {
    amount: string;
    usdValue: number;
  };
  utilization: number;
  supplyApy: number;
  borrowApy: number;
  borrowedShares: string;
  depositedShares: string;
  pythOracleFeedId: string;
  pythOraclePriceUpdate: string;
}

export interface TokenInfo {
  mint: string;
  symbol: string;
  logo: string;
  decimals: number;
}

export interface PriceData {
  mint: string;
  price: number;
  decimals: number;
  timestamp: number;
}

// Validation schemas
export const vaultDataSchema = z.object({
  address: z.string(),
  mint: z.string(),
  deposited_funds: z.object({
    amount: z.string(),
    usd: z.number()
  }),
  borrowed_funds: z.object({
    amount: z.string(),
    usd: z.number()
  }),
  supply_limit: z.object({
    amount: z.string(),
    usd: z.number()
  }),
  utilization: z.number(),
  supply_apy: z.number(),
  borrow_apy: z.number(),
  borrowed_shares: z.string(),
  deposited_shares: z.string(),
  pyth_oracle_feed_id: z.string(),
  pyth_oracle_price_update: z.string()
});

export const vaultsResponseSchema = z.object({
  data: z.array(vaultDataSchema)
});

export const tokenInfoSchema = z.object({
  mint: z.string().min(1),
  symbol: z.string().min(1),
  logo: z.string().min(1),
  decimals: z.number().int().min(0)
}).required().strict();

export const tokenInfoResponseSchema = z.object({
  data: z.object({
    mint: z.string().min(1),
    symbol: z.string().min(1),
    logo: z.string().min(1),
    decimals: z.number().int().min(0)
  }).required().strict()
}).required().strict();

export const priceDataSchema = z.object({
  mint: z.string().min(1),
  price: z.number().min(0),
  decimals: z.number().int().min(0),
  timestamp: z.number().int().min(0)
}).strict();

// Cache TTLs in milliseconds
export const CACHE_TTL = {
  VAULTS: 30 * 1000, // 30 seconds
  TOKEN_METADATA: 24 * 60 * 60 * 1000, // 1 day
  PRICE_DATA: 2 * 60 * 1000 // 2 minutes
};

// API endpoints
const API_BASE_URL = process.env.DEFITUNA_API_URL || 'https://api.defituna.com/api/v1';

export const API_ENDPOINTS = {
  VAULTS: `${API_BASE_URL}/vaults`,
  TOKEN_INFO: (mint: string) => `${API_BASE_URL}/mints/${mint}`,
  PRICE_DATA: (mint: string) => `${API_BASE_URL}/oracle-prices/${mint}`
};

// Helper functions
export async function fetchWithValidation<T>(
  url: string,
  schema: z.ZodSchema<T>,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return schema.parse(data);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedData<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Transform API response to our internal format
export function transformVaultData(apiVault: z.infer<typeof vaultDataSchema>): VaultData {
  return {
    address: apiVault.address,
    mint: apiVault.mint,
    depositedFunds: {
      amount: apiVault.deposited_funds.amount,
      usdValue: apiVault.deposited_funds.usd
    },
    borrowedFunds: {
      amount: apiVault.borrowed_funds.amount,
      usdValue: apiVault.borrowed_funds.usd
    },
    supplyLimit: {
      amount: apiVault.supply_limit.amount,
      usdValue: apiVault.supply_limit.usd
    },
    utilization: apiVault.utilization,
    supplyApy: apiVault.supply_apy,
    borrowApy: apiVault.borrow_apy,
    borrowedShares: apiVault.borrowed_shares,
    depositedShares: apiVault.deposited_shares,
    pythOracleFeedId: apiVault.pyth_oracle_feed_id,
    pythOraclePriceUpdate: apiVault.pyth_oracle_price_update
  };
} 