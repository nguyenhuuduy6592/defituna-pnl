# DeFiTuna PnL Viewer

A web application for tracking and analyzing your DeFiTuna positions on Solana. This tool provides real-time PnL (Profit and Loss) tracking and position management features.

## Features

- 📊 Real-time PnL tracking for DeFiTuna positions
- 👛 Support for multiple wallet addresses
- 🔄 Auto-refresh functionality to keep data current
- ⏱️ Position age tracking
- 📱 Shareable PnL cards
- 📂 Local position history storage (30-day retention)
- 💰 Total PnL aggregation across multiple wallets
- 🔍 Detailed position information including yield and debt

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, set up your environment variables:

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Create an account at [Helius](https://www.helius.dev/) and generate an API key

3. Configure your environment variables in `.env.local`:
   ```
   # API Configuration
   DEFITUNA_API_URL=https://api.defituna.com/api/v1

   # Helius API Configuration
   HELIUS_API_KEY=your_helius_api_key_here
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com

   # Donation Configuration (optional)
   NEXT_PUBLIC_DONATION_WALLET=5bxoPwxEoYMAwfuLWRQRSmS2M926GjYXEUjrR9xC2dZ3
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

The project has a comprehensive test suite with high coverage in key areas:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific tests
npm test -- <path-to-test-file>
```

### Test Coverage Summary

| Category | Components Tested | Total Coverage |
|---------|-------------------|----------------|
| Common Components | 6/8 (75%) | 68.77% |
| PnL Components | 13/13 (100%) | 94.51% |
| Education Components | 1/1 (100%) | 100% |
| History Components | 2/2 (100%) | 100% |
| Pool Components | 4/4 (100%) | 98.49% |
| Hooks | 9/9 (100%) | 89.67% |
| Utils | 12/13 (92.3%) | 90.7% |
| Contexts | 1/1 (100%) | 100% |

Overall project coverage: 80.77% statements, 73.97% branches, 80.04% functions, 80.85% lines

### Test Architecture

- **Unit Tests**: Tests for individual components, hooks, and utility functions
- **Mocks**: API calls and external dependencies are mocked for reliable testing
- **Testing Libraries**: Jest and React Testing Library

## Deployment

To deploy on Vercel:

1. Go to your project settings in Vercel
2. Add these environment variables:
   - `HELIUS_API_KEY`: Your Helius API key
   - `HELIUS_RPC_URL`: https://rpc-mainnet.helius.xyz
   - `DEFITUNA_API_URL`: https://api.defituna.com/api/v1
   - `NEXT_PUBLIC_DONATION_WALLET`: Your wallet to receive donation

## Reference

- [Defituna PnL production](https://defituna-pnl.vercel.app/)
- [Defituna](https://defituna.com/trade)
