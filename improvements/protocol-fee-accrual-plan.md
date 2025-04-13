**Plan: Calculate DefiTuna Protocol Fee Accrual**

1.  **Objective:**
    *   Determine the total amount of fees collected by the DefiTuna protocol, broken down by individual token types. This involves identifying the protocol's fee recipient address and summing up all token transfers sent to that address.

2.  **Prerequisites:**
    *   **DefiTuna Program ID:** The public key of the deployed DefiTuna Solana program.
    *   **DefiTuna Fee Recipient:** The public key of the fee recipient wallet address (to be manually configured).
    *   **Helius API Key & Access:** Credentials and necessary setup to interact with the Helius API for fetching Solana blockchain data.
    *   **Development Environment:** Next.js application with necessary libraries (`axios`, `@solana/web3.js`, `better-sqlite3`).

3.  **Implementation Steps with Status Tracking:**

    *   **Step 1: Environment Configuration** `[Status: Completed]`
        * Update `.env.local.example` with necessary variables:
          ```
          # Protocol Fee Configuration
          DEFI_TUNA_PROGRAM_ID=
          PROTOCOL_FEE_RECIPIENT=
          ```
        * Copy these variables to your local `.env.local` file
        * Manual step: Obtain the DefiTuna Program ID from the team
        * Manual step: Obtain the Protocol Fee Recipient address from the team
        * Create `src/utils/config.js` for environment variables:
          ```javascript
          // src/utils/config.js
          export const config = {
            HELIUS_API_KEY: process.env.HELIUS_API_KEY,
            HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
            DEFI_TUNA_PROGRAM_ID: process.env.DEFI_TUNA_PROGRAM_ID,
            PROTOCOL_FEE_RECIPIENT: process.env.PROTOCOL_FEE_RECIPIENT,
          };
          ```
        * Completion criteria: Environment variables are properly configured

    *   **Step 2: Setup Database Utility** `[Status: Completed]`
        * Create `src/utils/feeDb.js` for database operations:
          ```javascript
          import { join, dirname } from 'path';
          import { mkdir } from 'fs/promises';
          import Database from 'better-sqlite3';
          
          const DB_PATH = join(process.cwd(), 'data', 'fee_data.sqlite');
          
          /**
           * Initialize the database connection and create tables if they don't exist
           * @returns {Database} The database connection
           */
          export function initializeDatabase() {
            // Ensure data directory exists
            mkdir(dirname(DB_PATH), { recursive: true }).catch(() => {});
            
            const db = new Database(DB_PATH);
            
            // Create tables if they don't exist
            db.exec(`
              CREATE TABLE IF NOT EXISTS fee_transfers (
                signature TEXT PRIMARY KEY,
                blockTime INTEGER,
                mint TEXT,
                amount TEXT,
                source TEXT
              );
              
              CREATE INDEX IF NOT EXISTS idx_blockTime ON fee_transfers (blockTime);
              CREATE INDEX IF NOT EXISTS idx_mint ON fee_transfers (mint);
              
              CREATE TABLE IF NOT EXISTS status (
                key TEXT PRIMARY KEY,
                value TEXT
              );
            `);
            
            return db;
          }
          
          /**
           * Get the latest processed block time
           * @param {Database} db The database connection
           * @returns {number} The latest block time or 0 if none
           */
          export function getLatestBlockTime(db) {
            const result = db.prepare('SELECT MAX(blockTime) as latestTime FROM fee_transfers').get();
            return result?.latestTime || 0;
          }
          
          /**
           * Store fee transfers in the database
           * @param {Database} db The database connection
           * @param {Array<Object>} transfers Array of transfer objects
           * @returns {number} Number of transfers stored
           * 
           * @example
           * // Example transfers format:
           * const transfers = [
           *   {
           *     signature: "5UwRYBxZC6AqyWviMMziH3NimBnB6zHQAGDx5eFdCFzQFhDihsLuKvXoGjBDiwm4HeikzSp3TZG6jgxP2xpqCKKC",
           *     blockTime: 1678886400,
           *     mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mint
           *     amount: "1000000", // 1 USDC (raw amount)
           *     source: "Sender123456789abcdef"
           *   }
           * ];
           */
          export function storeTransfers(db, transfers) {
            const insert = db.prepare('INSERT OR IGNORE INTO fee_transfers (signature, blockTime, mint, amount, source) VALUES (?, ?, ?, ?, ?)');
            
            const insertMany = db.transaction((items) => {
              for (const item of items) {
                insert.run(item.signature, item.blockTime, item.mint, item.amount, item.source);
              }
            });
            
            insertMany(transfers);
            return transfers.length;
          }
          
          /**
           * Aggregate fees by token mint address
           * @param {Database} db The database connection
           * @returns {Array<Object>} Array of aggregated fee objects
           * 
           * @example
           * // Example return format:
           * [
           *   {
           *     mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mint
           *     totalAmount: "1234567890" // Total amount as string
           *   }
           * ]
           */
          export function aggregateFeesByMint(db) {
            return db.prepare('SELECT mint, SUM(amount) AS totalAmount FROM fee_transfers GROUP BY mint').all();
          }
          
          /**
           * Update a status key-value pair
           * @param {Database} db The database connection
           * @param {string} key Status key
           * @param {string} value Status value
           */
          export function updateStatus(db, key, value) {
            db.prepare('INSERT OR REPLACE INTO status (key, value) VALUES (?, ?)').run(key, value);
          }
          
          /**
           * Get a status value by key
           * @param {Database} db The database connection
           * @param {string} key Status key
           * @returns {string|null} Status value or null if not found
           */
          export function getStatus(db, key) {
            const result = db.prepare('SELECT value FROM status WHERE key = ?').get(key);
            return result?.value;
          }
          ```
        * Completion criteria: Database utility functions are implemented

    *   **Step 3: Implement Transaction Fetching Logic** `[Status: Completed]`
        * Create `src/utils/fetchFeeTransactions.js` using Helius Enhanced Transactions API:
          ```javascript
          import axios from 'axios';
          import { config } from './config';
          
          /**
           * Fetch fee transactions for the fee recipient using Helius Parsed Transaction History API
           * @param {string} feeRecipient Public key of the fee recipient
           * @param {number} lastBlockTime Last processed block time
           * @returns {Promise<Array>} Array of fee transfers
           * 
           * @example
           * // Example return format:
           * [
           *   {
           *     signature: "5UwRYBxZC6AqyWviMM...",
           *     blockTime: 1678886400,
           *     mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
           *     amount: "1000000",
           *     source: "Sender123456789abcdef"
           *   }
           * ]
           */
          export async function fetchFeeTransactions(feeRecipient, lastBlockTime = 0) {
            // Params validation
            if (!feeRecipient) {
              throw new Error('Fee recipient address is required');
            }
            
            if (!config.HELIUS_API_KEY) {
              throw new Error('Helius API key is not configured');
            }
            
            // Set up API URL
            const apiUrl = `https://api.helius.xyz/v0/addresses/${feeRecipient}/transactions`;
            
            // Process in batches
            const batchSize = 50;
            let allTransfers = [];
            let hasMore = true;
            let cursor = null;
            
            while (hasMore) {
              try {
                // Prepare request params
                const params = {
                  'api-key': config.HELIUS_API_KEY,
                  limit: batchSize,
                  type: 'TOKEN_TRANSFER',
                  'transaction-type': 'ANY',
                };
                
                // Add cursor for pagination if available
                if (cursor) {
                  params.cursor = cursor;
                }
                
                // Make API request
                const response = await axios.get(apiUrl, { params });
                const data = response.data;
                
                // Extract transfers from tokens
                const transfers = [];
                
                for (const tx of data.data) {
                  // Skip transactions before our last processed block time
                  if (tx.timestamp && tx.timestamp < lastBlockTime) {
                  hasMore = false;
                  break;
                }
                
                  // Process token transfers to fee recipient
                  const tokenTransfers = tx.tokenTransfers;
                  if (tokenTransfers) {
                    for (const transfer of tokenTransfers) {
                  if (transfer.toUserAccount === feeRecipient) {
                    transfers.push({
                      signature: tx.signature,
                      blockTime: tx.timestamp,
                      mint: transfer.mint,
                          amount: transfer.tokenAmount,
                          source: transfer.fromUserAccount || 'unknown'
                    });
                  }
                }
              }
            }
            
                // Add transfers to result
                allTransfers = [...allTransfers, ...transfers];
                
                // Update cursor for next page
                if (data.data.length < batchSize || !data.cursor) {
                  hasMore = false;
                } else {
                  cursor = data.cursor;
                }
              } catch (error) {
                console.error('Error fetching fee transactions:', error);
                hasMore = false;
              }
            }
            
            return allTransfers;
          }
          ```
        * Create `src/utils/fetchTokenMetadata.js` for token metadata fetching:
          ```javascript
          import axios from 'axios';
          import { config } from './config';
          
          /**
           * Fetch token metadata using Helius API
           * @param {string} mintAddress Token mint address
           * @returns {Promise<Object>} Token metadata
           * 
           * @example
           * // Example return format:
           * {
           *   symbol: "USDC",
           *   name: "USD Coin",
           *   decimals: 6,
           *   logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
           * }
           */
          export async function fetchTokenMetadata(mintAddress) {
            if (!mintAddress) {
              throw new Error('Mint address is required');
            }
            
            if (!config.HELIUS_API_KEY) {
              throw new Error('Helius API key is not configured');
            }
            
            try {
              const response = await axios.get(`https://api.helius.xyz/v0/tokens/metadata?api-key=${config.HELIUS_API_KEY}`, {
                params: {
                  mintAccounts: [mintAddress]
                }
              });
              
              if (response.data && response.data.length > 0) {
                const metadata = response.data[0];
                return {
                  symbol: metadata.symbol || 'UNKNOWN',
                  name: metadata.name || 'Unknown Token',
                  decimals: metadata.decimals || 0,
                  logoURI: metadata.image || null
                };
              }
              
              return {
                symbol: 'UNKNOWN',
                name: 'Unknown Token',
                decimals: 0,
                logoURI: null
              };
            } catch (error) {
              console.error(`Error fetching metadata for ${mintAddress}:`, error);
              return {
                symbol: 'ERROR',
                name: 'Error Fetching Token',
                decimals: 0,
                logoURI: null
              };
            }
          }
          ```
        * Completion criteria: Transaction fetching logic is implemented and token metadata retrieval works

    *   **Step 4: Create API Endpoints** `[Status: Completed]`
        * Create API route for fetching fee data (`src/pages/api/admin/fetch-fee-data.js`):
          ```javascript
          import { initializeDatabase, getLatestBlockTime, storeTransfers, updateStatus } from '@/utils/feeDb';
          import { fetchFeeTransactions } from '@/utils/fetchFeeTransactions';
          import { config } from '@/utils/config';

          /**
           * API route for fetching and storing fee transaction data
           * @param {Object} req HTTP request object
           * @param {Object} res HTTP response object
           */
          export default async function handler(req, res) {
            // Only allow in development environment
            if (process.env.NODE_ENV !== 'development') {
              return res.status(404).json({ error: 'Not found' });
            }
            
            if (req.method !== 'POST') {
              return res.status(405).json({ error: 'Method not allowed' });
            }
            
            try {
              // Validate configuration
              if (!config.PROTOCOL_FEE_RECIPIENT) {
                return res.status(500).json({
                  error: 'Protocol fee recipient not configured',
                  details: 'Please set PROTOCOL_FEE_RECIPIENT in .env.local'
                });
              }
              
              // Initialize database and track status
              const db = initializeDatabase();
              updateStatus(db, 'processStatus', 'running');
              updateStatus(db, 'lastRunStartTime', Date.now().toString());
              updateStatus(db, 'currentStep', 'Fetching transactions');
              
              // Get latest processed block time
              const latestBlockTime = getLatestBlockTime(db);
              
              // Fetch new transactions
              const transfers = await fetchFeeTransactions(
                config.PROTOCOL_FEE_RECIPIENT,
                latestBlockTime
              );
              
              // Store transactions in database
              updateStatus(db, 'currentStep', 'Storing transactions');
              const storedCount = storeTransfers(db, transfers);
              
              // Update status
              updateStatus(db, 'processStatus', 'completed');
              updateStatus(db, 'lastRunEndTime', Date.now().toString());
              updateStatus(db, 'lastFetchCount', storedCount.toString());
              updateStatus(db, 'currentStep', 'Completed');
              
              // Return success
              return res.status(200).json({
                success: true,
                message: `Successfully processed ${storedCount} new transactions`,
                lastBlockTime: latestBlockTime
              });
            } catch (error) {
              console.error('Error in fetch-fee-data API:', error);
              
              // Update status
              try {
                const db = initializeDatabase();
                updateStatus(db, 'processStatus', 'error');
                updateStatus(db, 'lastError', error.message);
                updateStatus(db, 'lastErrorTime', Date.now().toString());
              } catch (dbError) {
                console.error('Error updating status in database:', dbError);
              }
              
              return res.status(500).json({
                error: 'Failed to fetch fee data',
                details: error.message
              });
            }
          }
          ```
          
        * Create API route for generating fee statistics (`src/pages/api/admin/generate-fee-stats.js`):
          ```javascript
          import { initializeDatabase, aggregateFeesByMint, updateStatus } from '@/utils/feeDb';
          import { fetchTokenMetadata } from '@/utils/fetchTokenMetadata';
          import fs from 'fs/promises';
          import path from 'path';
          
          /**
           * API route for generating fee statistics
           * @param {Object} req HTTP request object
           * @param {Object} res HTTP response object
           */
          export default async function handler(req, res) {
            // Only allow in development environment
            if (process.env.NODE_ENV !== 'development') {
              return res.status(404).json({ error: 'Not found' });
            }
            
            if (req.method !== 'POST') {
              return res.status(405).json({ error: 'Method not allowed' });
            }
            
            try {
              // Initialize database and track status
              const db = initializeDatabase();
              updateStatus(db, 'statsStatus', 'running');
              updateStatus(db, 'statsLastRunStartTime', Date.now().toString());
              
              // Aggregate fees by mint
              const aggregatedFees = aggregateFeesByMint(db);
              
              // Fetch token metadata for each mint
              const enrichedFees = [];
              for (const fee of aggregatedFees) {
                const metadata = await fetchTokenMetadata(fee.mint);
                
                enrichedFees.push({
                  mint: fee.mint,
                  symbol: metadata.symbol,
                  name: metadata.name,
                  decimals: metadata.decimals,
                  logoURI: metadata.logoURI,
                  totalAmount: fee.totalAmount,
                  totalAmountFormatted: (Number(fee.totalAmount) / Math.pow(10, metadata.decimals)).toFixed(metadata.decimals)
                });
              }
              
              // Sort by total amount (highest first)
              enrichedFees.sort((a, b) => {
                return Number(b.totalAmountFormatted) - Number(a.totalAmountFormatted);
              });
              
              // Write to JSON file
              const statsDir = path.join(process.cwd(), 'public', 'data');
              await fs.mkdir(statsDir, { recursive: true });
              
              const statsPath = path.join(statsDir, 'protocol_fees.json');
              await fs.writeFile(
                statsPath,
                JSON.stringify({
                  updatedAt: new Date().toISOString(),
                  fees: enrichedFees
                }, null, 2)
              );
              
              // Update status
              updateStatus(db, 'statsStatus', 'completed');
              updateStatus(db, 'statsLastRunEndTime', Date.now().toString());
              updateStatus(db, 'statsTotalTokens', enrichedFees.length.toString());
              
              // Return success
              return res.status(200).json({
                success: true,
                message: `Successfully generated stats for ${enrichedFees.length} tokens`,
                tokens: enrichedFees
              });
            } catch (error) {
              console.error('Error in generate-fee-stats API:', error);
              
              // Update status
              try {
                const db = initializeDatabase();
                updateStatus(db, 'statsStatus', 'error');
                updateStatus(db, 'statsLastError', error.message);
                updateStatus(db, 'statsLastErrorTime', Date.now().toString());
              } catch (dbError) {
                console.error('Error updating status in database:', dbError);
              }
              
              return res.status(500).json({
                error: 'Failed to generate fee stats',
                details: error.message
              });
            }
          }
          ```
          
        * Create API route for status checking (`src/pages/api/admin/get-status.js`):
          ```javascript
          import { initializeDatabase, getStatus } from '@/utils/feeDb';
          
          /**
           * API route for checking process status
           * @param {Object} req HTTP request object
           * @param {Object} res HTTP response object
           */
          export default async function handler(req, res) {
            // Only allow in development environment
            if (process.env.NODE_ENV !== 'development') {
              return res.status(404).json({ error: 'Not found' });
            }
            
            if (req.method !== 'GET') {
              return res.status(405).json({ error: 'Method not allowed' });
            }
            
            try {
              // Initialize database
              const db = initializeDatabase();
              
              // Get status values
              const status = {
                // Process status
                processStatus: getStatus(db, 'processStatus') || 'never_run',
                lastRunStartTime: getStatus(db, 'lastRunStartTime'),
                lastRunEndTime: getStatus(db, 'lastRunEndTime'),
                lastFetchCount: getStatus(db, 'lastFetchCount'),
                currentStep: getStatus(db, 'currentStep'),
                lastError: getStatus(db, 'lastError'),
                lastErrorTime: getStatus(db, 'lastErrorTime'),
                
                // Stats status
                statsStatus: getStatus(db, 'statsStatus') || 'never_run',
                statsLastRunStartTime: getStatus(db, 'statsLastRunStartTime'),
                statsLastRunEndTime: getStatus(db, 'statsLastRunEndTime'),
                statsTotalTokens: getStatus(db, 'statsTotalTokens'),
                statsLastError: getStatus(db, 'statsLastError'),
                statsLastErrorTime: getStatus(db, 'statsLastErrorTime')
              };
              
              return res.status(200).json(status);
            } catch (error) {
              console.error('Error in get-status API:', error);
              
              return res.status(500).json({
                error: 'Failed to get status',
                details: error.message
              });
            }
          }
          ```
        * Completion criteria: API endpoints are implemented and functional

    *   **Step 5: Create Admin Interface** `[Status: Completed]`
        * Create admin page (`src/pages/admin/protocol-fees.js`):
          ```javascript
          import { useState, useEffect } from 'react';
          import Head from 'next/head';
          
          export default function ProtocolFeesAdmin() {
            const [status, setStatus] = useState('idle');
            const [message, setMessage] = useState('');
            const [error, setError] = useState('');
            const [statusData, setStatusData] = useState(null);
            const [tokens, setTokens] = useState([]);
            
            // Fetch current status on load
            useEffect(() => {
              const getStatus = async () => {
                try {
                  const response = await fetch('/api/admin/get-status');
                  const data = await response.json();
                  
                  if (response.ok) {
                    setStatusData(data);
                  } else {
                    console.error('Status error:', data);
                  }
                } catch (error) {
                  console.error('Error fetching status:', error);
                }
              };
              
              getStatus();
            }, []);
            
            const fetchFeeData = async () => {
              setStatus('fetching');
              setMessage('Fetching transaction data...');
              setError('');
              
              try {
                const response = await fetch('/api/admin/fetch-fee-data', {
                  method: 'POST'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  setMessage(`Successfully fetched ${data.message}`);
                  // Refresh status
                  const statusResponse = await fetch('/api/admin/get-status');
                  const statusData = await statusResponse.json();
                  setStatusData(statusData);
                } else {
                  setError(`Error: ${data.error} - ${data.details || ''}`);
                }
              } catch (error) {
                setError(`Error: ${error.message}`);
              } finally {
                setStatus('idle');
              }
            };
            
            const generateStats = async () => {
              setStatus('generating');
              setMessage('Generating fee statistics...');
              setError('');
              
              try {
                const response = await fetch('/api/admin/generate-fee-stats', {
                  method: 'POST'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  setMessage(`Successfully generated stats for ${data.tokens.length} tokens`);
                  setTokens(data.tokens);
                  
                  // Refresh status
                  const statusResponse = await fetch('/api/admin/get-status');
                  const statusData = await statusResponse.json();
                  setStatusData(statusData);
                } else {
                  setError(`Error: ${data.error} - ${data.details || ''}`);
                }
              } catch (error) {
                setError(`Error: ${error.message}`);
              } finally {
                setStatus('idle');
              }
            };
            
            return (
              <div className="container mx-auto px-4 py-8">
                <Head>
                  <title>Protocol Fee Management - DefiTuna Admin</title>
                </Head>
                
                <h1 className="text-2xl font-bold mb-6">Protocol Fee Management</h1>
                
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                  <p className="font-bold">Manual Configuration Required</p>
                  <p>Please ensure you have set the following environment variables in your <code>.env.local</code> file:</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li><code>DEFI_TUNA_PROGRAM_ID</code> - The Solana program ID for DefiTuna</li>
                    <li><code>PROTOCOL_FEE_RECIPIENT</code> - The public key of the fee recipient wallet</li>
                    <li><code>HELIUS_API_KEY</code> - Valid API key for Helius</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white shadow rounded p-4">
                    <h2 className="text-lg font-semibold mb-4">Process Status</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Status:</span>
                        <span className="font-medium">{statusData?.processStatus || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Step:</span>
                        <span className="font-medium">{statusData?.currentStep || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Run:</span>
                        <span className="font-medium">
                          {statusData?.lastRunEndTime ? new Date(parseInt(statusData.lastRunEndTime)).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Error:</span>
                        <span className="font-medium text-red-600">{statusData?.lastError || 'None'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded p-4">
                    <h2 className="text-lg font-semibold mb-4">Actions</h2>
                    <div className="flex flex-col space-y-4">
                      <button
                        onClick={fetchFeeData}
                        disabled={status === 'fetching'}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                      >
                        {status === 'fetching' ? 'Fetching...' : 'Fetch/Update Fee Data'}
                      </button>
                      
                      <button
                        onClick={generateStats}
                        disabled={status === 'generating'}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                      >
                        {status === 'generating' ? 'Generating...' : 'Calculate & Generate Statistics'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {message && (
                  <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded">
                    {message}
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
                    Error: {error}
                  </div>
                )}
              </div>
            );
          }
          ```
          
        * Implement UI components for triggering data fetching and stats generation
        * Create data visualization components for admin view
        * Completion criteria: Admin interface is functional

    *   **Step 6: Display Protocol Fees on Frontend** `[Status: Completed]`
        * Create protocol fees page and components
        * Load data from `public/data/protocol_fees.json`
        * Create data visualization components
        * Implement UI for switching between token types
        * Completion criteria: Fee data is properly displayed on frontend

    *   **Step 7: Production Deployment Preparation** `[Status: Completed]`
        * Build cron job mechanism or scheduled API route
        * Set up proper authorization for admin routes
        * Create production-ready environment variables and configs
        * Add CI/CD pipeline updates
        * Completion criteria: System is ready for production deployment

4.  **Implementation Details & Libraries:**
    *   **Next.js Framework:** Using existing project structure with new API routes and pages.
    *   **Database:** SQLite for local development (data stored in `data/fee_data.sqlite`).
    *   **API:** Helius Enhanced Transactions API for fetching Solana blockchain data.
    *   **Dependencies:** `axios` for API requests, `better-sqlite3` for database operations.
    *   **Environment:** Use environment variables for configuration without hardcoding addresses.

5.  **Manual Configuration Steps:**
    *   **Step 1:** Consult with the DefiTuna team to obtain the Program ID
    *   **Step 2:** Consult with the DefiTuna team to obtain the Protocol Fee Recipient address
    *   **Step 3:** Add these values to your `.env.local` file:
        ```
        DEFI_TUNA_PROGRAM_ID=program_id_obtained_from_team
        PROTOCOL_FEE_RECIPIENT=fee_recipient_address_obtained_from_team
        ```
    *   **Step 4:** Ensure you have a valid Helius API key in your `.env.local` file

6.  **Workflow:**
    *   **Local Development:**
        1. Configure environment variables as described in the manual steps
        2. Run `npm run dev` to start the development server
        3. Access the admin page at `/admin/fees`
        4. Use the "Fetch/Update Fee Data" button to collect fee transactions
        5. Use the "Calculate & Generate Statistics" button to generate statistics
        6. Output is stored in `public/data/protocol-fees.json`
    
    *   **Production Deployment:**
        1. Perform steps 1-5 locally to generate the `protocol-fees.json` file
        2. Commit the generated file to the repository
        3. Deploy the application to production
        4. The fee statistics are accessible via the `ProtocolFeesDisplay` component

7.  **Key Benefits of Using Helius Enhanced Transactions API:**
    *   **Simplified Processing:** The API provides pre-parsed token transfers, making extraction easier
    *   **Improved Efficiency:** Direct access to the transactions relevant to the fee recipient
    *   **Structured Data:** Better organization of transaction data with specific token transfer information
    *   **Pagination Support:** Easier to implement pagination with the `before` parameter
    *   **Complete Transaction Context:** Each transfer includes the full transaction data including signature, timestamp, and other metadata
    *   **Error Reduction:** Lower risk of missing transfers as the API handles the parsing complexities
