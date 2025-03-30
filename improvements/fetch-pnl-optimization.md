# Fetch-PnL API Optimization Plan

## Overview
Current API response time: ~2s
Initial target response time: ~500ms
Achieved response time: ~850-950ms (with caching)

## Optimization Steps

### 1. Early Validation 🟢 Completed
- [x] Validate wallet address format on client side using showNotification
- [x] Validate wallet address format on server side
- [x] Implement early returns with descriptive error messages
- [x] Keep validation simple and focused
- [x] Remove inline error display in favor of notifications

Benefits:
- Reduces unnecessary API calls
- Provides faster feedback for invalid inputs via toast notifications
- Improves error handling and user experience
- Simple and maintainable validation
- Consistent error display with rest of the application

### 2. Response Compression 🟢 Completed
- [x] Implement gzip/brotli compression (Brotli automatically applied by Next.js/deployment environment)
- [x] Configure compression thresholds (Default thresholds are sufficient)
- [x] Add compression for error messages (Handled automatically)
- [x] Monitor compression performance (Confirmed via browser DevTools)
- [x] Handle compression failures (Handled automatically by server/browser)

Benefits:
- Reduces network bandwidth usage
- Faster data transfer
- Lower costs for data transfer
- Better performance on slower connections

### 3. Split Position Age API 🟢 Completed
- [x] Create new `/api/fetch-position-age` endpoint (returns creation timestamps)
- [x] Remove age data from main `/api/fetch-pnl` endpoint
- [x] Implement client-side age calculation during auto-refresh (using fetched timestamps)
- [x] Add age data caching strategy (Handled by Helius util cache for now)
- [x] Handle edge cases:
  - [x] New positions during auto-refresh (Handled: New age fetched on next manual refresh/load)
  - [x] Page reload during auto-refresh (Handled: Fetches both PnL and ages on reload)
  - [x] Browser tab sleep/wake (Handled: `setInterval` resumes, age calculation updates)
  - [x] Multiple wallets with different load times (Handled: Ages fetched after all PnL data aggregates)

Benefits:
- Faster initial position data loading
- More flexible data fetching
- Better separation of concerns
- Reduced payload size for main position data
- Eliminates redundant age API calls during auto-refresh
- More efficient network usage
- Faster auto-refresh responses

### 4. Implement Tiered Caching 🟢 Completed
- [x] Add server-side caching for pool data (30-second TTL)
- [x] Add server-side caching for market data (1-hour TTL)
- [x] Add server-side caching for token data (24-hour TTL)
- [x] Implement parallel fetching with Promise.all
- [x] Add resilient error handling for cache misses

Benefits:
- Drastically reduces time spent in `processPositionsData` (from ~1.2s to < 5ms)
- Keeps pool data (including current tick) reasonably fresh
- Maintains longer cache for rarely-changing data (markets, tokens)
- Improves overall response time to ~850-950ms (vs. original ~2s)
- Reduces load on external DeFiTuna API

### 5. Move Formatting to Client 🟢 Completed
- [x] Move status calculation to client using price data
- [x] Move PnL percentage calculation to client 
- [x] Update utility functions to support client-side formatting
- [x] Ensure proper handling of all position states (liquidated, limit order, etc.)

Benefits:
- Reduced processing load on server
- Reduced response payload size
- Better separation of presentation and data concerns
- Improved client-side rendering flexibility

## Implementation Considerations

### Early Validation
- Simple wallet address validation
- Consistent validation on both client and server
- Clear error messages via toast notifications
- Proper error status codes
- No inline error display for cleaner UI

### Response Compression
- Configure compression level based on server resources
- Monitor compression performance
- Consider different compression strategies
- Handle compression failures gracefully

### Split Position Age
- Define clear API contract for both endpoints
- Implement proper error handling
- Add appropriate caching strategies
- Handle all edge cases

### Tiered Caching
- Implement server-side caching for pool, market, and token data
- Use TTLs to manage cache expiration
- Parallel fetching with Promise.all for improved performance
- Resilient error handling for cache misses

### Move Formatting to Client
- Move status calculation and PnL percentage calculation to client
- Update utility functions to support client-side formatting
- Ensure proper handling of all position states

## Expected Improvements
- [x] Reduce API response time from ~2s to ~500-1000ms
- [x] Reduce server load
- [x] Better error handling and reliability
- [x] Improved user experience with faster responses
- [x] More efficient resource usage
- [x] Eliminate redundant age API calls during auto-refresh

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⚫ Blocked

## Notes
- All planned optimizations have been completed
- Main performance bottleneck is now the initial `fetchPositions` call to the external API (~850ms)
- The optimizations reduced processing time from ~2s to ~850-950ms, a >50% improvement
- Further optimization would require changes to the external API or aggressive wallet-level caching

## Additional Notes
- The caching solution implemented for market, pool, and token data is based on a tiered approach with TTLs.
- The cache is designed to keep pool data (including current tick) reasonably fresh and maintain longer cache for rarely-changing data (markets, tokens).
- The parallel fetching with Promise.all improves performance by allowing multiple cache fetches to run concurrently.
- Resilient error handling for cache misses ensures that the system can handle cache misses gracefully and continue functioning without errors.

## Future Optimizations

### High Priority
1. **Response Payload Optimization** 🔴
   - Further reduce payload size by removing unused fields
   - Implement numeric encoding for decimal values
   - Consider binary formats for data transfer (MessagePack/Protobuf)
   - Expected benefit: 10-30% reduction in response time and bandwidth usage

2. **Request Batching** 🔴
   - Implement batching for multiple wallet requests similar to `getTransactionAges` in helius.js
   - Consolidate redundant external API calls when users view multiple wallets
   - Optimize concurrent limits to prevent API rate limiting
   - Expected benefit: Improved scalability and reduced load on external API

### Medium Priority
1. **Wallet-level Position Caching** 🟡
   - Implement short-term cache (30-60 seconds) for `fetchPositions` results
   - Current main bottleneck at ~850ms per request
   - Add similar TTL pattern as used for pool/market/token caching
   - Expected benefit: Reduction in API response time to <200ms for repeat requests

2. **Service Worker Cache** 🟡
   - Implement browser service worker to cache responses
   - Enable offline capabilities for previously viewed wallet data
   - Reduce server load for frequent users
   - Expected benefit: Improved user experience and reduced server costs

### Future Considerations
1. **Progressive Data Loading**
   - Initially return basic position data quickly
   - Load detailed metrics in a second phase
   - Implement skeleton UI while waiting for complete data

2. **WebSocket for Real-time Updates**
   - Replace polling with WebSocket connections for position updates
   - Reduces need for full API calls during auto-refresh
   - Only fetch delta changes rather than full position data

3. **Background Prefetching**
   - Prefetch data for recently viewed wallets
   - Refresh cache in background intervals
   - Implement predictive prefetching for frequently used wallets 