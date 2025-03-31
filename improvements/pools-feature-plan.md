# DeFiTuna Pools Feature Plan

## Overview
Add a new feature to display all available pools on DeFiTuna, allowing users to easily browse and access detailed information about each pool. This will provide users with a comprehensive view of the ecosystem and help them make informed decisions about which pools to interact with.

## Goals
1. Display a complete list of all available pools
2. Provide detailed information about each pool
3. Enhance discoverability of pools for new users
4. Enable filtering and sorting capabilities
5. Integrate with Helius API for richer on-chain data

## Data Sources
1. **Main Pool Data**: `${process.env.DEFITUNA_API_URL}/pools` endpoint
2. **Individual Pool Details**: Already available in the pools endpoint
3. **On-chain Data**: Helius API for transaction history and additional context

## Feature Components

### 1. Pools Overview Page (Priority 1)
- Create a new `/pools` route
- Implement a responsive grid/list view of all pools
- Display key information for each pool:
  - Token pair (with icons)
  - TVL (Total Value Locked) from `tvl_usdc` field
  - 24h/7d/30d volume from `stats` object
  - Current yield metrics from `yield_over_tvl` field
  - Fee rates from `fee_rate` field
- Add sorting functionality by:
  - TVL
  - Volume (24h/7d/30d)
  - Yield (24h/7d/30d)
  - Fee rate
- Implement search/filter by token name/address

### 2. Pool Detail View (Priority 1)
- Create a `/pools/[poolAddress]` route
- Display comprehensive pool details:
  - Token pair information
  - Current price calculation from `sqrt_price`
  - Liquidity depth visualization using `liquidity` data
  - Historical yield data from time-based stats
  - Fee structure (both pool fee and protocol fee)
  - Contract addresses (with copy feature)
  - Pool creation date (via Helius API)
- Show current pool statistics:
  - Total value locked
  - Volume at different time intervals
  - Fees generated at different time intervals
  - Current yield metrics

### 3. User Interaction Features (Priority 2)
- Add "Add to Favorites" functionality
- Implement "Create Position" button linking to DeFiTuna trade page with pre-filled pool address
- Add "Share" button to generate shareable link
- Show user's current positions in this pool (if any)

### 4. Market Insights (Priority 2)
- Display fee/volume comparison charts 
- Show yield history visualization
- Present liquidity distribution visualization
- Calculate and display key metrics:
  - Yield history trends
  - Volume growth rate
  - Fee generation efficiency

### 5. Helius API Integration (Priority 3)
- Track pool creation and modification dates
- Monitor significant liquidity events
- Analyze transaction patterns for each pool
- Create heatmap of activity times
- Identify whale transactions and their impact

## Implementation Phases

### Phase 1: Core Functionality
1. Create a new API endpoint in `src/pages/api/pools.js` to fetch all pools
2. Implement basic pools listing page with sorting and filtering
3. Build pool detail view with comprehensive information display
4. Add routing and navigation structure

### Phase 2: Enhanced Features
1. Implement advanced sorting and filtering capabilities
2. Add data visualization components for yield and volume
3. Integrate user interaction features
4. Build responsive design optimizations

### Phase 3: Helius Integration
1. Connect to Helius API for blockchain data
2. Implement transaction history for pools
3. Add creation date and activity metrics
4. Build monitoring for significant events

### Phase 4: Performance & UI Refinements
1. Optimize data loading and caching
2. Enhance visual design and animations
3. Add user preference persistence
4. Implement advanced search capabilities

## Technical Implementation Details

### Frontend Components
1. `PoolsPage`: Main container for pools listing
2. `PoolCard`: Reusable component for pool summary in lists
3. `PoolDetailView`: Detailed view for individual pool
4. `PoolFilters`: Filter and sort controls
5. `YieldChart`: Yield history visualization
6. `VolumeChart`: Volume history visualization
7. `PoolMetrics`: Displays key pool statistics

### API Integration
1. Create a new API function in `defituna.js` to fetch all pools
2. Implement caching strategy similar to existing market data
3. Create new API endpoint `/api/pools` with optional filtering parameters

### Helius API Integration
1. Extend the existing Helius utilities to fetch pool-specific data
2. Implement function to retrieve transaction history for pools
3. Add methods to analyze transaction patterns and significant events

## Data Structures

### Pool Data (Based on actual API response)
The pool data from the API contains these key fields:
- `address`: Pool contract address (string)
- `provider`: Provider name, e.g., "orca" (string)
- `token_a_mint` and `token_b_mint`: Token mint addresses (string)
- `token_a_vault` and `token_b_vault`: Token vault addresses (string)
- `tvl_usdc`: Total Value Locked in USDC (string)
- `tick_spacing`: Tick spacing for price levels (number)
- `fee_rate` and `protocol_fee_rate`: Fee rates in basis points (number)
- `liquidity`: Current pool liquidity (string)
- `sqrt_price`: Square root price for calculations (string)
- `tick_current_index`: Current tick index (number)
- `stats`: Object containing metrics for different time periods:
  - 24h, 7d, and 30d statistics including:
    - `volume`: Trading volume (string)
    - `fees`: Fees generated (string)
    - `yield_over_tvl`: Yield over TVL ratio (string)

### Enhanced Pool Data
For the UI, we'll enhance the pool data with:
- Token metadata (symbol, name, icon, decimals)
- Calculated current price based on sqrt_price
- Formatted TVL (e.g., "$1.2M")
- Creation date from Helius API
- User positions in this pool (if any)

## Metrics and Success Criteria
1. User engagement:
   - Time spent on pools page
   - Number of pool details viewed
   - Click-through rate to DeFiTuna trading page
2. Feature adoption:
   - Percentage of users accessing pools feature
   - Number of positions created from pools page
3. Performance:
   - Load time for pools listing
   - Response time for filtering/sorting operations
   - Data freshness (time since last update)

## Next Steps and Dependencies
1. Create API endpoint wrapper for the pools data
2. Design UI mockups for pools page and detail view
3. Set up token metadata resolution for display names and icons
4. Determine optimal caching strategy based on data update frequency
5. Implement initial prototype and gather feedback 