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
