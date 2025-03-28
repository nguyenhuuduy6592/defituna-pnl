# DeFiTuna PnL Improvement Plan (Part 1)

This document outlines strategic features to enhance the DeFiTuna PnL application while adhering to the following constraints:
- Read-only functionality (no write operations)
- No external database requirements
- Leveraging existing DeFiTuna and Helius APIs
- Not duplicating value already provided by DeFiTuna

## Implementation Status

| Feature | Status | Dependencies | Priority |
|---------|--------|--------------|----------|
| 1. Offline Position Data Storage | ✅ Implemented | None | High |
| 2. Configurable Browser Notifications | Ready for implementation | Feature #1 | High |
| 3. Position Status Change Alerts | Ready for implementation | Features #1, #2 | Medium |
| 4. Position PnL Target Alerts | Ready for implementation | Features #1, #2 | Medium |
| 5. Historical PnL Visualization | ✅ Implemented | Feature #1, Chart library | Low |
| 6. Background Position Data Fetching | Ready for implementation | Feature #1 | High |

## Implementation Details

### 1. Offline Position Data Storage (✅ Completed)

**Description:** Allow users to save position data locally for offline access and historical analysis.

**Implementation Status:**
- ✅ IndexedDB setup with `idb` package
- ✅ Position snapshot storage with timestamps
- ✅ 30-day data retention policy
- ✅ Storage management utilities
- ✅ User confirmation modal
- ✅ Auto-refresh integration
- ✅ Data cleanup routines

**Current Features:**
- Local storage of position data with timestamps
- Automatic data cleanup for entries older than 30 days
- Integration with auto-refresh for regular data collection
- Clean UI with confirmation modal and storage toggle
- Storage statistics tracking
- Organized in dedicated `history` components folder

**Location of Implementation:**
- `src/hooks/useHistoricalData.js` - Core data management hook
- `src/components/history/` - UI components
  - HistoryToggle.js
  - HistoryConfirmationModal.js
  - Associated SCSS modules

**Dependencies:**
```json
{
  "idb": "^8.0.2"
}
```

### 2. Configurable Browser Notifications System

**Description:** Create a flexible notification system allowing users to choose which alerts they receive.

**Implementation:**
- Develop a notification configuration UI with toggles for each alert type
- Create an extensible notification framework to easily add new types
- Store notification preferences in localStorage
- Request browser notification permissions when enabled
- Only enable if historical data is enabled

**Technical Details:**
- Create a notification settings component
- Implement a notification queue system for managing multiple alerts

**Implementation Steps:**
1. Enhance `src/utils/notifications.js` with these functions:
   - `requestNotificationPermission()`: Handle browser permission request
   - `sendBrowserNotification(title, body, options)`: Create native notifications
   - `createNotificationQueue()`: Manage multiple notifications with priority
2. Create `NotificationSettings.js` component in `src/components/` folder:
   - Main enable/disable toggle
   - Permission request button with status indicator
   - Individual alert type toggles with descriptions
3. Create `useNotificationSettings.js` hook in `src/hooks/` folder:
   - Store and retrieve notification preferences in localStorage
   - Track notification permission status
   - Provide helper methods for different notification types
4. Add notification settings panel to main UI below auto-refresh controls

**Notification Settings Structure:**
```javascript
const defaultSettings = {
  enabled: false,
  permission: "default", // "default", "granted", "denied"
  alerts: {
    statusChange: true,
    pnlTargets: true,
    significantChanges: true
  },
  sound: true,
  displayDuration: 5000 // milliseconds
};
```

### 3. Position Status Change Alerts (Alert type 1)

**Description:** Notify users when positions change status (open, closed, liquidated).

**Implementation:**
- Alert config:
  + No config, just enable/disable
- Compare current position status with previously stored states
- Generate browser notifications for meaningful changes
- Only enable if historical data is enabled

**Technical Details:**
- Add status transition detection logic
- Use position history data from feature #1
- Integrate with the notification system from feature #2

**Implementation Steps:**
1. Enhance `usePositionAlerts.js` hook with:
   - Status change detection logic
   - Relevant status transition messages
   - Integration with notification system
2. Add UI toggle in notification settings panel
3. Create status change detection function:
   ```javascript
   function detectStatusChanges(currentPositions, previousPositions) {
     const changes = [];
     currentPositions.forEach(current => {
       const previous = previousPositions.find(p => 
         p.pair === current.pair && p.walletAddress === current.walletAddress
       );
       if (previous && current.state !== previous.state) {
         changes.push({
           positionId: `${current.pair}-${current.walletAddress || ""}`,
           previousState: previous.state,
           currentState: current.state,
           message: `Position ${current.pair} changed from ${previous.state} to ${current.state}`
         });
       }
     });
     return changes;
   }
   ```
4. Implement alert display in position list with status change indicator

### 4. Position PnL Target Alerts (Alert type 2)

**Description:** Alert users when positions hit specified PnL targets.

**Implementation:**
- Alert config:
  + Allow users to set percentage or USD value targets for positions
- Store targets in indexdb with position identifiers
- Compare current PnL against targets during each data refresh
- Trigger notifications when targets are reached
- Only enable if historical data is enabled

**Technical Details:**
- Add PnL target configuration UI component in target modal
- Implement target comparison logic in position processing
- Allow setting both gain and loss thresholds in a single field
- Use position history data from feature #1
- Integrate with the notification system from feature #2

**Implementation Steps:**
1. Create `usePnLTargets.js` hook in `src/hooks/` folder:
   - Add/update/delete PnL targets for positions
   - Store targets in the IndexedDB database
   - Compare current PnL against defined targets
2. Create `PnLTargetModal.js` component in `src/components/` folder:
   - Input fields for percentage or USD values
   - Options for one-time or recurring alerts
   - Target editing interface with validation
3. Update IndexedDB schema to include targets:
   ```javascript
   targets: {
     keyPath: "id",
     indexes: ["positionId", "targetType", "targetValue"]
   }
   ```
4. Add "Set Target" button to position actions column in the table
5. Implement notification logic in `processPositionsData` function

### 5. Historical PnL Visualization (✅ Completed)

**Description:** Interactive chart showing position PnL and yield over time with configurable time periods.

**Implementation Status:**
- ✅ Chart Component Implementation
  - Responsive chart layout
  - Time period selection (1min to 1month)
  - PnL and Yield metrics display
  - Interactive tooltips and legend
  - Consistent grid lines

- ✅ Data Processing
  - Robust timestamp handling
  - Proper data grouping by time periods
  - Value validation and error handling
  - Support for different data formats

- ✅ Time Period Support
  - 1 minute intervals
  - 5, 15, 30 minute intervals
  - 1, 4 hour intervals
  - Daily, weekly, monthly views
  - Proper tick generation for each period
`
- ✅ Visual Features
  - Consistent grid lines
  - Proper axis formatting
  - Interactive tooltips
  - Toggleable metrics
  - Responsive layout

**Location of Implementation:**
- `src/components/pnl/PositionChart.js` - Main chart component
- `src/utils/chart.js` - Data processing utilities

**Dependencies:**
```json
{
  "recharts": "^2.9.0"
}
```

**Technical Features:**
1. Data Processing:
   - Timestamp validation and normalization
   - Flexible value parsing (number, object with usd/value)
   - Data grouping by time periods
   - Proper handling of missing/invalid data

2. Chart Display:
   - Consistent grid lines with proper spacing
   - Formatted time labels based on period
   - Dollar value formatting with proper precision
   - Interactive legend for toggling metrics
   - Responsive tooltips with formatted values

3. Time Period Handling:
   - Support for all time periods from 1min to 1month
   - Proper data grouping for each period
   - Consistent tick generation
   - Appropriate date/time formatting

4. Performance Optimizations:
   - Disabled animations for better performance
   - Efficient data processing
   - Proper error handling
   - Memory efficient data structures

5. User Interface:
   - Clean, modern design
   - Easy period selection
   - Clear metric toggles
   - Informative tooltips
   - Proper spacing and layout

## Required Dependencies

```json
{
  "dependencies": {
    "idb": "^7.1.1",
    "recharts": "^2.9.0"
  }
}
```

### 6. Background Position Data Fetching

**Description:** Implement a service worker to fetch position data in the background, enabling real-time updates even when the browser tab is inactive.

**Implementation:**
- Create a service worker for background data fetching
- Implement periodic data refresh mechanism
- Handle offline/online state transitions
- Only enable if historical data is enabled

**Technical Details:**
- Service worker registration and lifecycle management
- Background sync API for reliable data fetching
- Same data storage as the Store History feature

**Integration Points:**
- Service worker registration in `src/index.js`
- Background sync request in `useHistoricalData` hook
- Status display in main UI
- Notification system integration for sync status

**Technical Features:**
1. Background Sync:
   - Periodic data fetching (use value from Auto Refresh feature)
   - Reliable sync using Background Sync API
   - Offline queue management
   - Error handling and retry logic

2. Data Management:
   - Reuse the same data storage as the Store History feature

3. Performance:
   - Minimal battery impact
   - Efficient network usage
   - Smart retry strategies
   - Resource cleanup

**Dependencies:**
```json
{
  "workbox-background-sync": "^7.0.0",
  "workbox-routing": "^7.0.0",
  "workbox-strategies": "^7.0.0"
}
```
