# DeFiTuna PnL Improvement Plan (Part 1)

This document outlines strategic features to enhance the DeFiTuna PnL application while adhering to the following constraints:
- Read-only functionality (no write operations)
- No external database requirements
- Leveraging existing DeFiTuna and Helius APIs
- Not duplicating value already provided by DeFiTuna

## Implementation Status

| Feature | Status | Dependencies | Priority |
|---------|--------|--------------|----------|
| 1. Offline Position Data Storage | Ready for implementation | None | High |
| 2. Configurable Browser Notifications | Ready for implementation | Feature #1 | High |
| 3. Position Status Change Alerts | Ready for implementation | Features #1, #2 | Medium |
| 4. Position PnL Target Alerts | Ready for implementation | Features #1, #2 | Medium |
| 5. Historical PnL Visualization | Requires additional dependencies | Feature #1, Chart library | Low |

## Feature Implementation Plan

### 1. Offline Position Data Storage

**Description:** Allow users to save position data locally for offline access and historical analysis.

**Implementation:**
- Add a toggle switch similar to auto-refresh in the UI
- Store position snapshots in IndexedDB with timestamps
- Implement data retention policy (maximum 30 days)
- Add storage management utilities to prevent excessive storage usage

**Technical Details:**
- Use IndexedDB for efficient storage of time-series data
- Add storage quota monitoring and cleanup routines
- Show confirmation modal to user, let them know data is stored locally with limitations and list features relies on this historical data

**Implementation Steps:**
1. Install `idb` package for IndexedDB management: `npm install idb`
2. Create `useHistoricalData.js` hook in `src/hooks/` with these functions:
   - `initializeDB()`: Set up database structure with position history store
   - `savePositionSnapshot(positions, timestamp)`: Store position data
   - `getPositionHistory(positionId, timeRange)`: Retrieve historical data
   - `cleanupOldData(retentionDays = 30)`: Remove records older than 30 days
   - `getStorageStats()`: Calculate current storage usage
3. Add UI toggle to `index.js` next to the auto-refresh controls
4. Create confirmation modal explaining local storage purpose
5. Integrate data storage logic with existing fetch workflow

**Database Structure:**
```javascript
const dbStructure = {
  name: "defituna-pnl",
  version: 1,
  stores: {
    positions: { 
      keyPath: ["id", "timestamp"],
      indexes: ["timestamp", "pair", "walletAddress"] 
    },
    settings: { 
      keyPath: "id" 
    }
  }
};
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

### 5. Historical PnL Visualization

**Description:** Create charts showing position PnL over time compared to holding strategies.

**Implementation:**
- Utilize stored position history to generate time-series charts
- Calculate equivalent "HODL" value for comparison
- Show impermanent loss effects visually
- Provide interactive charts with zoom capabilities

**Technical Details:**
- Integrate lightweight charting library compatible with Next.js
- Implement data processing utilities for chart preparation
- Show chart components by a new button on the Actions column of each position
- Optimize rendering for mobile devices

**Implementation Steps:**
1. Install charting library: `npm install recharts`
2. Create `PositionChart.js` component in `src/components/` folder:
   - Time-series chart of position PnL over time
   - Comparison line for "HODL" strategy
   - Visual indication of impermanent loss
   - Interactive zoom and tooltips
3. Create `PositionChartModal.js` for displaying charts in a modal
4. Add "Chart" button to position actions column in the table
5. Implement data processing utilities:
   ```javascript
   function prepareChartData(positionHistory) {
     return positionHistory.map(snapshot => ({
       timestamp: snapshot.timestamp,
       pnl: snapshot.pnl,
       yield: snapshot.yield,
       hodlValue: calculateHodlValue(snapshot),
       impermanentLoss: calculateImpermanentLoss(snapshot)
     }));
   }
   ```
6. Optimize chart rendering for mobile devices with responsive design

## Required Dependencies

```json
{
  "dependencies": {
    "idb": "^7.1.1",
    "recharts": "^2.9.0"
  }
}

