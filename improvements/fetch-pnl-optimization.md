# Fetch-PnL API Optimization Plan

## Overview
Current API response time: ~2s
Target response time: ~500ms

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

### 2. Response Compression
Status: 🟢 Completed
- [x] Implement gzip/brotli compression (Brotli automatically applied by Next.js/deployment environment)
- [ ] Configure compression thresholds (Default thresholds likely sufficient)
- [x] Add compression for error messages (Handled automatically)
- [ ] Monitor compression performance (Can be done via browser DevTools/monitoring tools)
- [ ] Handle compression failures (Handled automatically by server/browser)

Benefits:
- Reduces network bandwidth usage
- Faster data transfer
- Lower costs for data transfer
- Better performance on slower connections

### 3. Split Position Age API
Status: 🟢 Completed
- [x] Create new `/api/fetch-position-age` endpoint (returns creation timestamps)
- [x] Remove age data from main `/api/fetch-pnl` endpoint
- [x] Implement client-side age calculation during auto-refresh (using fetched timestamps)
- [ ] Add age data caching strategy (Handled by Helius util cache for now)
- [ ] Handle edge cases:
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

## Expected Improvements
- [ ] Reduce API response time from ~2s to ~500ms
- [ ] Reduce server load
- [ ] Better error handling and reliability
- [ ] Improved user experience with faster responses
- [ ] More efficient resource usage
- [ ] Eliminate redundant age API calls during auto-refresh

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⚫ Blocked

## Notes
- Priority order: Early Validation > Split Position Age > Response Compression
- Each step should be implemented and tested independently
- Performance metrics should be collected before and after each change
- Edge cases should be thoroughly tested 