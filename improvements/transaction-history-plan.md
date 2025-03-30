# DeFiTuna Transaction History Implementation Plan

## Overview

This document outlines a comprehensive plan to implement transaction history tracking for all past and current positions of active wallets in DeFiTuna using the Helius API. The implementation will allow users to view the complete transaction history of their positions, providing deeper insights into their trading activities.

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

## Technical Details

### Helius API Integration

1. **Endpoint Selection**
   - Use Helius `/v0/addresses/{address}/transactions` endpoint for history
   - Leverage enhanced transaction data format for additional metadata
   - Consider using webhook notifications for real-time updates

2. **Transaction Parsing Strategy**
   - First pass: Filter transactions by program ID (DeFiTuna's ID)
   - Second pass: Parse instruction data using IDL
   - Third pass: Classify and organize by position

3. **Data Extraction Points**
   - Transaction signature (for unique identification)
   - Block time (for chronological ordering)
   - Instruction data (for operation details)
   - Account references (for position identification)
   - Inner instructions (for fee/yield tracking)

### Position History Reconstruction

1. **Position Lifecycle Tracking**
   - Opening transaction: Initial parameters, collateral, leverage
   - Modification transactions: Changes to position parameters
   - Closing/liquidation: Final state and outcome
   - Yield/fee transactions: Ongoing revenue or expenses

2. **Data Association Keys**
   - Position address as primary key
   - Wallet address as secondary key
   - Trading pair as tertiary grouping

### Storage Requirements

1. **Transaction Data Schema**
   ```
   {
     signature: string,           // Transaction signature
     blockTime: number,           // Unix timestamp
     positionAddress: string,     // Associated position
     operationType: string,       // Open, close, modify, etc.
     pair: string,                // Trading pair
     details: {                   // Operation-specific details
       // Varies by operation type
     },
     amount: number,              // Transaction amount (if applicable)
     fees: number                 // Transaction fees
   }
   ```

2. **Estimated Storage Size**
   - Average transaction: ~2KB
   - 100 transactions: ~200KB
   - 1000 transactions: ~2MB per wallet

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

## Timeline Estimate

- Phase 1 (Infrastructure): 1-2 weeks
- Phase 2 (Data Retrieval): 2-3 weeks
- Phase 3 (Storage): 1-2 weeks
- Phase 4 (UI - List View MVP): 1-2 weeks
- Phase 5 (UI - Detail View & Advanced Features): 2-3 weeks
- Phase 6 (Testing & Optimization): 1-2 weeks

Total estimated time: 8-14 weeks depending on complexity and resources, with initial MVP available to users after 5-9 weeks.

## Future Enhancements

1. Real-time notifications for position changes
2. Transaction anomaly detection
3. Performance analytics based on transaction history
4. Export functionality for tax reporting
5. Integration with portfolio tracking tools 