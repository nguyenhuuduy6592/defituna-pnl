# Background Data Fetching Implementation Plan (v2.3)

## Overview
This document outlines the plan to implement background data fetching for the DeFiTuna application using a Service Worker. The goal is to enable real-time updates of position data even when the browser tab is inactive, enhancing user experience and data reliability, addressing browser compatibility, testing, and error handling, focusing on minimal schema changes while ensuring reliability.

## Implementation Steps

### 1. Service Worker Setup
- **File:** `public/service-worker.js`
- **Action:** Implement background sync logic (no caching).
- **Implementation Details:**
  - **Background Sync Logic:**
    - Create a `fetchPositions()` function to:
      - Call `fetchWalletPnL` (reused from `src/utils/pnlUtils.js`) to fetch position data.
      - Validate the response.
      - Store data in IndexedDB using `savePositionSnapshot` (reused from `src/utils/indexedDB.js`).
    - **Error Handling:**
      - Log API errors (404, 500, network issues).
    - **Timer Logic:**
      - Use `setInterval` to periodically fetch data (sync interval matches `useAutoRefresh.js`).
  - **Activation:**
    - Start the sync timer when the service worker activates.
    - Add cleanup logic to stop the timer when needed.
- **Status:** Not Started

### 2. Service Worker Registration
- **File:** `src/pages/_app.js`
- **Action:** Verify registration flow
- **Implementation Details:**
  - Confirm production-only registration
  - Add debug logging for registration state
  - **No changes required** (existing implementation is correct)
- **Status:** Completed

### 3. IndexedDB Preparation (Minimal Changes)
- **File:** `src/utils/indexedDB.js`
- **Action:** Ensure compatibility with background sync
- **Implementation Details:**
  - **No schema changes required**
  - **Error Handling:**
    - Log sync failures to console for monitoring.
    - Ensure that any data being saved during sync is validated against existing schema rules.
    - Implement checks to ensure that only valid data is stored, preventing corrupt entries.
- **Status:** Not Started

### 4. useAutoRefresh Hook Update
- **File:** `src/hooks/useAutoRefresh.js`
- **Action:** Integrate with Service Worker
- **Implementation Details:**
  - **New Logic:**
    - Register the timer on mount to fetch data at the specified interval and if auto refresh is enabled.
    - Replace the current timer to let service worker does the api call.
    - Sync interval = current refresh interval
    - Trigger the service worker's `fetchPositions()` function when the timer elapses.
    - Add `useEffect` cleanup to clear the timer when the component unmounts.
    - If request failed, skip that execution as the the timer should call the api again in selected time period.
- **Status:** Not Started

### 5. Comprehensive Testing
- **Test Areas:**
  1. **Service Worker:**
     - Mock `navigator.serviceWorker` in Jest
     - Test timer-based fetch logic
     - Verify offline fallback behavior
  2. **IndexedDB:**
     - Verify existing logic tests work
     - Ensure that timestamp validation is correctly implemented.
  3. **Hook:**
     - Test registration/unregistration
     - Verify error recovery
     - Test edge cases, including network failures and invalid data responses.
- **Testing Tools:**
  - `jest.spyOn` for API mocks
  - `fake-indexeddb` for unit tests
  - Chrome DevTools for manual verification
- **Status:** Not Started

## AI Assistant Guidelines
1. **Code Style:**
   - Match existing patterns in error handling and hooks
   - Maintain current JSDoc standards

2. **Safety Checks:**
   - Verify `window` and IndexedDB availability

3. **Testing Priority:**
   - Test IndexedDB changes first (isolated)
   - Then service worker logic
   - Finally hook integration

## Updated Status Table
| Step | Description | Status | Owner |
|------|-------------|--------|-------|
| 1 | Service Worker Setup | Not Started | AI |
| 2 | Service Worker Reg | Not Started | AI |
| 3 | IndexedDB Prep | Not Started | AI |
| 4 | Hook Integration | Not Started | AI |
| 5 | UI Cleanup | Not Started | AI |
| 6 | Testing | Not Started | AI/QA |
| 7 | Progress Tracking | Ongoing | Lead |
