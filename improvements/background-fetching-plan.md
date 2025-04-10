# Background Data Fetching Implementation Plan (v2.3)

## Overview
This document outlines the plan to implement background data fetching for the DeFiTuna application using a Service Worker. The goal is to enable real-time updates of position data even when the browser tab is inactive, enhancing user experience and data reliability, addressing browser compatibility, testing, and error handling, focusing on minimal schema changes while ensuring reliability.

## Implementation Steps

### 1. Service Worker Setup
- **File:** `public/service-worker.js`
- **Action:** Enhance service worker for background sync
- **Implementation Details:**
  - Add `install`/`activate` listeners for cache setup
  - Create `fetchPositions()` function to:
    - Call API endpoints (reuse existing fetch logic)
    - Validate response data
    - Store in IndexedDB using existing `savePositionSnapshot()`
    - **Error Handling:** 
      - Handle different API response scenarios:
        - **404 Not Found:** Log the error and notify the user that the data could not be retrieved.
        - **500 Internal Server Error:** Log the error and implement a retry mechanism with exponential backoff.
        - **Network Errors:** Log the error and attempt to fetch from the cache if available.
  - **Timer Logic:** 
    - Use `setInterval` to fetch data based on the refresh interval set in `AutoRefresh.js`, allowing background fetching even when the tab is closed.
    - Ensure that the timer fetches the latest data without overwhelming the API.
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
    - Sync interval = current refresh interval
    - Add `useEffect` cleanup to clear the timer when the component unmounts.
  - **Error Handling:**
    - Service Worker: Logs technical details for debugging.
    - UI: Shows user-friendly alerts for sync failures or issues.
    - Automatic retry every 2 intervals to ensure data is fetched reliably.
- **Status:** Not Started

### 5. UI Cleanup
- **Action:** Remove background sync toggle
- **Implementation Details:**
  - Delete related state/props from `AutoRefresh.js`
  - Update PropTypes
  - **Note:** Background sync activates automatically with auto-refresh
- **Status:** Not Started

### 6. Comprehensive Testing
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

### 7. Progress Tracking
- **System:**
  ```markdown
  ## Progress
  - [x] 2023-11-20: Service Worker Registration (Step 2)
  - [ ] IndexedDB Preparation (Step 3)
  - [ ] Service Worker Setup (Step 1)
  ```
- **Rollback Plan:**
  1. Revert to last git commit
  2. Document failure in progress log
  3. Create issue with reproduction steps

## AI Assistant Guidelines
1. **Code Style:**
   - Match existing patterns in error handling and hooks
   - Maintain current JSDoc standards

2. **Safety Checks:**
   - Verify `window` and IndexedDB availability
   - Validate API responses before storage

3. **Testing Priority:**
   - Test IndexedDB changes first (isolated)
   - Then service worker logic
   - Finally hook integration

## Updated Status Table
| Step | Description | Status | Owner |
|------|-------------|--------|-------|
| 1 | Service Worker Setup | Not Started | AI |
| 2 | Service Worker Reg | Completed | - |
| 3 | IndexedDB Prep | Not Started | AI |
| 4 | Hook Integration | Not Started | AI |
| 5 | UI Cleanup | Not Started | AI |
| 6 | Testing | Not Started | AI/QA |
| 7 | Progress Tracking | Ongoing | Lead |

## Risk Mitigation
1. **Browser Support:**
   - Feature-detect all new APIs
   - Maintain foreground sync fallback

2. **Data Integrity:**
   - No schema migrations needed

3. **Performance:**
   - Throttle syncs during heavy usage