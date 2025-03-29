# Fetch-PnL API Optimization Plan

## Overview
Current API response time: ~2s
Target response time: ~500ms

## Optimization Steps

### 1. Early Validation 🟢 Completed
- [x] Validate wallet address format on client side
- [x] Validate wallet address format on server side
- [x] Implement early returns with descriptive error messages
- [x] Keep validation simple and focused

Benefits:
- Reduces unnecessary API calls
- Provides faster feedback for invalid inputs
- Improves error handling and user experience
- Simple and maintainable validation

### 2. Response Compression
Status: 🔴 Not Started
- [ ] Implement gzip/brotli compression
- [ ] Configure compression thresholds
- [ ] Add compression for error messages
- [ ] Monitor compression performance
- [ ] Handle compression failures

Benefits:
- Reduces network bandwidth usage
- Faster data transfer
- Lower costs for data transfer
- Better performance on slower connections

### 3. Split Position Age API
Status: 🔴 Not Started
- [ ] Create new `/api/fetch-position-age` endpoint
- [ ] Remove age data from main `/api/fetch-pnl` endpoint
- [ ] Implement client-side age calculation during auto-refresh
- [ ] Add age data caching strategy
- [ ] Handle edge cases:
  - [ ] New positions during auto-refresh
  - [ ] Page reload during auto-refresh
  - [ ] Browser tab sleep/wake
  - [ ] Multiple wallets with different load times

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
- Clear error messages
- Proper error status codes

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