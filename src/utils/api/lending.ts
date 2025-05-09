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
  depositedFunds: z.object({
    amount: z.string(),
    usdValue: z.number()
  }),
  borrowedFunds: z.object({
    amount: z.string(),
    usdValue: z.number()
  }),
  supplyLimit: z.object({
    amount: z.string(),
    usdValue: z.number()
  }),
  utilization: z.number(),
  supplyApy: z.number(),
  borrowApy: z.number()
});

export const tokenInfoSchema = z.object({
  mint: z.string().min(1),
  symbol: z.string().min(1),
  logo: z.string().min(1),
  decimals: z.number().int().min(0)
}).strict();

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
const API_BASE_URL = process.env.NEXT_PUBLIC_DEFITUNA_API_URL || 'https://api.defituna.com';

export const API_ENDPOINTS = {
  VAULTS: `${API_BASE_URL}/api/v1/vaults`,
  TOKEN_INFO: (mint: string) => `${API_BASE_URL}/api/v1/mints/${mint}`,
  PRICE_DATA: (mint: string) => `${API_BASE_URL}/api/v1/oracle-prices/${mint}`
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