# DeFiTuna Transaction History - Incremental MVP Plan

## Phase 1: Basic Transaction List (MVP)
**Focus: Just get a functional list working with minimal effort**

1. **Minimal Helius API Integration**
   - Set up basic Helius API calls to fetch recent transactions (last 7 days only)
   - Simple filtering to identify DeFiTuna transactions
   - No complex caching - just use in-memory storage during session

2. **Simple Transaction List UI**
   - Create a basic table similar to existing position list
   - Show only essential columns: date, transaction type, position pair, amount
   - Use existing CSS styles where possible
   - Simple descending chronological order (newest first)

3. **Basic Transaction Parsing**
   - Identify basic transaction types (open, close, liquidate)
   - Extract minimal position details from transactions
   - Skip complex parsing logic for edge cases

**Deliverable:** A functional transaction list showing recent position history with minimal styling and features.

## Phase 2: Enhanced Transaction Details
**Focus: Improve utility while keeping implementation simple**

1. **Expanded Transaction Information**
   - Add more transaction details to the list view (fees, PnL where available)
   - Improve transaction type identification
   - Display basic status indicators (success/failed)

2. **Basic Filtering**
   - Add simple dropdown for filtering by transaction type
   - Implement basic date range selector (last day, week, month)
   - Keep UI controls minimal and functional

3. **Extend Helius API Usage**
   - Increase history range to 30 days
   - Implement basic retry logic for API failures
   - Simple localStorage caching to reduce redundant API calls

**Deliverable:** More informative transaction list with basic filtering capabilities.

## Phase 3: Transaction Detail View
**Focus: Allow users to explore individual transactions**

1. **Simple Detail Modal**
   - Add click handler to transaction rows
   - Create basic modal showing all available transaction data
   - Include link to block explorer for verification

2. **Position Context**
   - Show position state before/after transaction where possible
   - Display related transactions for the same position
   - Simple chronological view of position history

3. **Improved Data Parsing**
   - Handle more transaction types and edge cases
   - Extract more detailed information from transaction data
   - Improve error handling for malformed transactions

**Deliverable:** Users can click on transactions to view details and understand position context.

## Phase 4: UI Improvements & Advanced Filtering
**Focus: Make the experience more intuitive and useful**

1. **UI Organization**
   - Group transactions by date with clear headers
   - Improve visual hierarchy and readability
   - Add simple loading indicators and empty states

2. **Advanced Filtering**
   - Implement searchable transaction history
   - Add multi-select filters for transaction types
   - Allow filtering by position pair or ID

3. **Pagination & Loading**
   - Add basic pagination controls
   - Implement "load more" functionality
   - Improve loading states and feedback

**Deliverable:** More polished UI with improved organization and filtering capabilities.

## Phase 5: Persistent Storage
**Focus: Handle larger transaction volumes reliably**

1. **IndexedDB Implementation**
   - Set up proper IndexedDB schema for transactions
   - Implement CRUD operations and queries
   - Migrate from localStorage to IndexedDB

2. **Extended History Support**
   - Remove time limitations on history retrieval
   - Implement batched loading of historical data
   - Support differential syncing of new transactions

3. **Background Syncing**
   - Add automatic refresh of transaction data
   - Implement background fetching of older transactions
   - Show sync status indicators

**Deliverable:** Reliable storage solution supporting larger transaction volumes with background syncing.

## Phase 6: Performance Optimization & Polish
**Focus: Handle edge cases and optimize performance**

1. **List Virtualization**
   - Implement virtual scrolling for large transaction lists
   - Optimize rendering performance
   - Handle large datasets efficiently

2. **Advanced Error Handling**
   - Implement comprehensive error states
   - Add retry mechanisms with exponential backoff
   - Provide helpful error messaging

3. **Visual Polish**
   - Refine UI styling and animations
   - Add micro-interactions and visual feedback
   - Ensure consistent design language with the rest of the application

4. **Advanced Features**
   - Implement data visualizations and charts
   - Add export functionality
   - Support deeper analytics on transaction history

**Deliverable:** Fully optimized, production-ready transaction history feature.

## Implementation Priorities

1. **Start with absolute minimum** - Just show a list of transactions
2. **Focus on functionality over aesthetics** early on
3. **Deliver working features at each phase**
4. **Defer complex optimizations** until later phases
5. **Reuse existing UI patterns** where possible to minimize new CSS

# Original Detailed Implementation Plan 

## Overview

This document outlines a comprehensive plan to implement transaction history tracking for all past and current positions of active wallets in DeFiTuna using the Helius API. The implementation will allow users to view the complete transaction history of their positions, providing deeper insights into their trading activities.

## User Flow

1. **Initial Access**
   - User connects their wallet to DeFiTuna
   - System automatically begins fetching transaction history in the background
   - User sees a loading indicator while initial data is retrieved
   - Once data is available, user is presented with transaction list view

2. **Browsing Transaction History**
   - User views their transaction list, sorted by most recent first
   - Transactions are visually grouped by date
   - User can scroll through the virtualized list without performance issues
   - Each transaction shows essential information (type, pair, amount, time)

3. **Filtering & Searching**
   - User can tap/click filter icon to reveal filter options
   - User selects filters based on transaction type, date range, or position
   - Results update instantly as filters are applied
   - User can search for specific transactions using search field
   - Results highlight matching terms in the transaction list

4. **Viewing Transaction Details**
   - User taps/clicks on a transaction in the list
   - Detail panel slides in from the right side
   - User sees complete transaction information organized in tabs/sections
   - User can view position state before and after the transaction
   - Advanced users can access technical details and blockchain links
   - User can close detail view by clicking close button or outside the panel

5. **Data Exploration**
   - User can switch between list and visualization views
   - Timeline view shows position lifecycle with transaction points
   - Charts display position performance over time
   - User can export transaction data for record-keeping

## Application Flow

1. **Data Retrieval & Processing**
   - On wallet connection, app initiates transaction history fetch
   - App checks local storage for cached transaction data
   - If cached data exists, app displays it immediately while updating in background
   - If no cached data, app shows loading state while fetching from blockchain
   - Transactions are fetched in batches to respect API rate limits
   - All transactions are filtered to identify DeFiTuna-specific operations
   - Transactions are parsed and classified by operation type
   - Processed transactions are stored in IndexedDB for persistence

2. **Data Management**
   - App implements differential sync to fetch only new transactions
   - Background sync occurs periodically when app is active
   - Cache invalidation happens after configurable TTL period
   - Storage optimizations prevent excessive memory usage

3. **Rendering & UI Updates**
   - React components use custom hooks to access transaction data
   - List view uses virtualization to render only visible items
   - Filter state changes trigger query updates to storage service
   - UI reflects loading, error, and empty states appropriately
   - Component re-renders are optimized to prevent performance issues

4. **Error Handling**
   - Network errors during data fetch trigger retry with exponential backoff
   - Parsing errors for unknown transaction types are logged and skipped
   - Storage errors attempt recovery strategies before failing
   - UI displays appropriate error messages with retry options
   - Failed syncs are retried automatically on next app activation

5. **Performance Optimization**
   - Initial data load prioritizes recent transactions
   - Background fetching of older transactions occurs during idle periods
   - Storage queries use indexes for optimal performance
   - Render optimizations prevent UI jank during scrolling
   - Memory usage is monitored and optimized for mobile devices

## UI/UX Considerations

1. **Non-Disruptive Sync Indicators**
   - Use subtle sync indicators that don't block interaction with the app
   - Implement a small, unobtrusive progress indicator in the corner of the transaction history view
   - Allow users to continue browsing already loaded transactions while new ones sync
   - Avoid full-screen loading states after initial data load

2. **Progress Communication**
   - Show clear percentage or progress bar for initial data load
   - Display "Last synced" timestamp to indicate data freshness
   - Use toast notifications for completed sync operations instead of modal dialogs
   - Provide count of new transactions found during background sync

3. **Staged Data Display**
   - Show transactions as soon as they're processed rather than waiting for all data
   - Implement "load more" functionality at list bottom for older transactions
   - Use skeleton screens instead of spinners when possible to reduce perceived wait time
   - Prioritize visible content loading over off-screen elements

4. **Error Recovery States**
   - Design non-blocking error states that allow partial functionality
   - Implement inline retry buttons for failed operations
   - Show specific error messages with actionable next steps
   - Automatically retry background operations without user intervention

5. **Responsive Feedback**
   - Add micro-animations for state changes (new transactions appearing, filters applying)
   - Ensure UI remains responsive even during data processing
   - Implement optimistic UI updates for filter operations
   - Provide immediate visual feedback for all user actions

## Requirements

1. Track all transactions for the active wallet's positions
2. Parse transactions using DeFiTuna IDL to identify specific operation types
3. Store transaction data efficiently for quick retrieval
4. Display transaction history with relevant position details
5. Filter and sort transaction history by various parameters

## Implementation Plan

### Phase 1: Infrastructure Setup

1. **Helius API Integration**
   - Set up Helius API key and configuration
   - Create helper utilities to handle rate limiting and retry logic
   - Implement caching mechanisms to reduce API calls

2. **IDL Parser Development**
   - Import and configure DeFiTuna IDL for transaction parsing
   - Create parser utilities to extract position-related data from transactions
   - Develop a classification system for different transaction types

### Phase 2: Data Retrieval and Processing

3. **Fetching Transactions**
   - Implement function to fetch historical transactions for a wallet
   - Set up pagination to handle large transaction volumes
   - Implement date range filters to optimize data retrieval

4. **Position Identification**
   - Create logic to associate transactions with specific positions
   - Develop algorithm to reconstruct position lifecycle from transactions
   - Implement filters to identify only DeFiTuna-related transactions

5. **Transaction Parsing**
   - Parse transaction data using IDL to extract relevant details
   - Classify transactions by operation type (open, close, liquidate, etc.)
   - Extract position parameters (size, leverage, etc.) from instruction data

### Phase 3: Data Storage and Management

6. **Local Storage Implementation**
   - Design schema for storing transaction history
   - Implement indexedDB or localStorage solution for client-side persistence
   - Set up efficient queries for retrieving transaction history

7. **Synchronization Logic**
   - Develop mechanism to sync local data with blockchain
   - Implement differential sync to minimize API calls
   - Set up background refresh mechanism for active users

### Phase 4: User Interface

8. **Transaction List Implementation (Priority 1)**
   - **Design transaction list similar to the existing active positions display for consistency**
   - **Maintain familiar column structure and layout patterns users already understand**
   - **Default to chronological order with newest transactions first**
   - **Include essential information in list view:**
     - Transaction type (with appropriate icon)
     - Position pair
     - Date/time
     - Primary value change (+/- amount)
     - Status indicator
   - **Implement virtual scrolling for performance**
   - **Add subtle visual grouping by date or position**
   - **Use familiar patterns like pull-to-refresh on mobile**
   - **Deliver as first UI component for early user testing and feedback**

9. **Filtering and Sorting (Priority 2)**
   - Implement filters for transaction type, date range, position, etc.
   - Create sorting options for various transaction attributes
   - Develop search functionality for transaction history
   - Integrate directly with list view for immediate value

10. **Transaction Detail View (Priority 3)**
    - **Design a modal or slide-in panel for transaction details (similar to position details)**
    - **Show complete history of all interactions with the position**
    - **Display transaction sequence in chronological order**
    - **Organize details into logical sections with clear headings:**
      - Transaction summary (type, time, status)
      - Position information (pair, size, leverage)
      - Financial details (amount, fees, total)
      - Technical details (collapsible section for advanced users)
    - **Include a visual summary at the top (transaction type, status, amount)**
    - **Provide contextual information (position state before/after)**
    - **Include blockchain verification link for advanced users**
    - **Use tooltips for technical terms**

11. **Data Visualization (Priority 4)**
    - Design timeline visualization for position lifecycle
    - Implement charts to show position changes over time
    - Create visual indicators for significant events (liquidation risks, etc.)

### Phase 5: Testing and Optimization

12. **Testing**
    - Create test cases for different transaction scenarios
    - Test with various wallet histories and position types
    - Implement load testing for large transaction volumes

13. **Performance Optimization**
    - Optimize API call frequency and data fetching
    - Implement lazy loading and virtualization for large history lists
    - Optimize storage utilization for long-term use

## Technical Implementation Details

### Helius API Integration Architecture

1. **Extending Existing Helius Utilities**
   - Create a function to fetch transaction history that extends the existing fetchWithRetry utility
   - Implement signature-based transaction fetching to get all transactions for a wallet address
   - Use the same batching approach as the existing getTransactionAges function to respect rate limits
   - Apply consistent error handling and retry patterns as in the existing implementation

2. **Enhanced Caching Mechanism**
   - Implement a transaction cache similar to the existing timestampCache
   - Store transactions in memory with configurable time-to-live (TTL)
   - Create functions to get and set cached transactions with proper cache invalidation
   - Use cache to reduce redundant API calls during the same session

### Transaction Parsing & Classification

1. **DeFiTuna Instruction Parsing**
   - Define a constant for the DeFiTuna program ID to identify program-specific transactions
   - Create an instruction parser object with specific parsers for each instruction type
   - Implement discriminator-based parsing to identify different operation types
   - Extract relevant account information and instruction data for each transaction type

2. **Transaction Classification System**
   - Define transaction type constants for different operations (open, close, modify, etc.)
   - Implement a classification function that examines transaction instructions
   - Extract position addresses and details from the transaction data
   - Build a comprehensive transaction object with type, address, and extracted details

### Storage Implementation

1. **IndexedDB Schema**
   - Design database schema with separate object stores for transactions, positions, and sync state
   - Include appropriate indexes for efficient querying (by wallet, position, time, type)
   - Implement database initialization with proper version handling
   - Create helper functions for database connection and schema management

2. **Storage Service**
   - Implement CRUD operations for transaction records
   - Build query functions with filtering, sorting, and pagination support
   - Create specialized methods for retrieving transactions by position or wallet
   - Add synchronization state tracking for incremental updates

### UI Components Implementation

1. **Transaction List Component**
   - Implement a virtualized list component for efficient rendering of large transaction lists
   - Create transaction list item component with appropriate visual indicators for different types
   - Include formatted display of transaction amounts, times, and status
   - Add proper click handlers for viewing transaction details

2. **Transaction Detail Component**
   - Create a modal component with tabs for different detail categories
   - Implement sections for transaction summary, position details, and financial information
   - Add technical details section for advanced users
   - Include proper navigation and close functionality

### Data Flow Architecture

1. **Transaction History Service**
   - Implement a service to coordinate between UI, storage, and API
   - Create a wallet transaction synchronization function with differential sync support
   - Add classification of transactions to extract and store only relevant data
   - Implement proper error handling and reporting

2. **React Hook Integration**
   - Create a custom hook for transaction history data access
   - Implement state management for loading, error, and transaction data
   - Add dependency tracking to refresh data when filters change
   - Provide clean interface for components to access transaction data

## Implementation Steps

### Step 1: Set up Helius API Integration
1. Create API key in Helius dashboard
2. Implement API client with authentication and rate limiting
3. Create retry logic and error handling
4. Test basic transaction fetching

### Step 2: Transaction Filtering & Processing
1. Import and configure DeFiTuna IDL
2. Implement program filtering logic
3. Create instruction parser based on IDL
4. Develop classification system for operations
5. Test with sample transactions

### Step 3: Position Association
1. Create position identification logic
2. Implement transaction-to-position mapping
3. Develop position lifecycle reconstruction
4. Test with existing wallet data

### Step 4: Local Storage Implementation
1. Design and implement storage schema
2. Create storage service for IndexedDB
3. Implement CRUD operations
4. Add persistence and cache management
5. Test storage and retrieval performance

### Step 5: UI Implementation (Incremental Delivery Approach)

1. **List View Development (Phase 1 - MVP)**
   - Design and implement the transaction list view first
   - **Base design on existing positions table for familiarity and consistency**
   - **Default sort order: newest transactions first (descending chronological order)**
   - Use virtual list component for performance (react-window or similar)
   - Implement clear date-based section headers
   - Ensure working UI for viewing basic transaction history
   - Deploy for early user testing and feedback
   - This provides immediate value to users while detail views are being developed

2. **Filtering and Sorting Implementation (Phase 1 - MVP)**
   - Implement essential filters (transaction type, date range)
   - Add basic sorting capabilities
   - Integrate directly with list view
   - This completes the minimum viable product for transaction history

3. **Detail View Development (Phase 2)**
   - Implement a slide-in panel or modal for transaction details
   - **Show comprehensive history of all interactions with the position**
   - **Maintain consistent styling with position details modal**
   - Group details into collapsible sections (transaction overview, position details, fee details)
   - Show visual comparison of before/after state where applicable
   - Add option to view raw transaction data for advanced users

4. **Advanced Features (Phase 3)**
   - Implement advanced search functionality
   - Add data visualizations and charts
   - Create export and sharing functionality
   - Enhance with additional user-requested features based on feedback

5. **Final Polish**
   - Design refinements based on user feedback
   - Performance optimizations
   - Accessibility improvements
   - Cross-browser and device testing

### Step 6: Testing & Optimization
1. Test with various wallet profiles
2. Optimize API usage and caching
3. Implement background syncing
4. Add error recovery mechanisms
5. Optimize rendering performance

## Considerations & Challenges

1. **API Rate Limits**
   - Helius has rate limits that need to be managed
   - Implement caching and batching to reduce API calls
   - Consider premium API tiers for high-volume users

2. **Large Transaction Volumes**
   - Active traders may have thousands of transactions
   - Implement pagination and virtual scrolling
   - Consider incremental loading strategies

3. **IDL Version Compatibility**
   - DeFiTuna IDL may change over time
   - Implement version detection and handling
   - Support parsing of legacy transaction formats

4. **Privacy Considerations**
   - All data is kept client-side
   - No server storage of user transaction data
   - Clear storage options for users

## Future Enhancements

1. Real-time notifications for position changes
2. Transaction anomaly detection
3. Performance analytics based on transaction history
4. Export functionality for tax reporting
5. Integration with portfolio tracking tools