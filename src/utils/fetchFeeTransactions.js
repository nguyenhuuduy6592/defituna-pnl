import axios from 'axios';
import { config } from './config';
import { initializeDatabase, storeTransfers } from './feeDb';

/**
 * Fetch fee transactions for the fee recipient using Helius Parsed Transaction History API
 * @param {string} feeRecipient Public key of the fee recipient
 * @param {number} lastBlockTime Last processed block time
 * @param {boolean} forceFetchAll If true, ignore lastBlockTime and fetch all transactions
 * @param {AbortSignal} signal Abort signal for cancellation
 * @returns {Promise<Object>} Object containing transfers and cancellation status
 * 
 * @example
 * // Example return format:
 * {
 *   transfers: [
 *     {
 *       signature: "5UwRYBxZC6AqyWviMM...",
 *       blockTime: 1678886400,
 *       mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *       amount: "1000000",
 *       source: "Sender123456789abcdef"
 *     }
 *   ],
 *   cancelled: false
 * }
 */
export async function fetchFeeTransactions(feeRecipient, lastBlockTime = 0, forceFetchAll = false, signal = null) {
  let allTransfers = [];
  let hasMore = true;
  let before = null;
  let consecutiveEmptyBatches = 0;
  let batchCount = 0;
  const MAX_EMPTY_BATCHES = 3;
  const MIN_DELAY_MS = 500; // Minimum 500ms between requests (2 requests/s)
  const processedSignatures = new Set(); // Track processed signatures
  
  // Initialize database
  const db = initializeDatabase();
  
  // Clear existing data if force fetching
  if (forceFetchAll) {
    console.log('Force fetch enabled - clearing existing data...');
    db.prepare('DELETE FROM fee_transfers').run();
  }
  
  console.log('=== Starting Transaction Fetch ===');
  console.log(`Fee Recipient: ${feeRecipient}`);
  console.log(`Force Fetch All: ${forceFetchAll}`);
  console.log(`Last Block Time: ${lastBlockTime} (${new Date(lastBlockTime * 1000).toISOString()})`);
  
  while (hasMore && consecutiveEmptyBatches < MAX_EMPTY_BATCHES) {
    // Check if cancelled
    if (signal?.aborted) {
      console.log('Fetch cancelled by user');
      return { transfers: allTransfers, cancelled: true };
    }

    batchCount++;
    console.log(`\n=== Processing Batch #${batchCount} ===`);
    
    try {
      // Prepare API URL with parameters
      let url = `https://api.helius.xyz/v0/addresses/${feeRecipient}/transactions?api-key=${config.HELIUS_API_KEY}`;
      
      if (before) {
        url += `&before=${before}`;
        console.log(`Using pagination cursor: ${before}`);
      }
      
      url += '&limit=100';
      
      console.log('Fetching transactions from Helius API...');
      const response = await axios.get(url, { signal }); // Pass signal to axios
      const transactions = response.data;
      
      console.log(`Received ${transactions?.length || 0} transactions in response`);
      
      if (!transactions || transactions.length === 0) {
        console.log('Empty batch received, stopping pagination');
        hasMore = false;
        continue;
      }
      
      // Log first and last transaction timestamps in batch
      const firstTx = transactions[0];
      const lastTx = transactions[transactions.length - 1];
      console.log(`Batch time range: ${new Date(firstTx.timestamp * 1000).toISOString()} to ${new Date(lastTx.timestamp * 1000).toISOString()}`);
      
      // Process current batch
      console.log('Processing transactions for token transfers...');
      const transfers = processTransactions(transactions, feeRecipient, lastBlockTime, forceFetchAll, processedSignatures);
      
      if (transfers.length === 0) {
        consecutiveEmptyBatches++;
        console.log(`No new fee transfers found in batch (${consecutiveEmptyBatches}/${MAX_EMPTY_BATCHES})`);
      } else {
        consecutiveEmptyBatches = 0;
        allTransfers = [...allTransfers, ...transfers];
        
        // Save batch to database
        const stored = storeTransfers(db, transfers);
        console.log(`Found ${transfers.length} fee transfers in batch, stored ${stored}, total: ${allTransfers.length}`);
        
        // Log details of found transfers
        console.log('New transfers found:');
        transfers.forEach((t, i) => {
          console.log(`  ${i + 1}. Time: ${new Date(t.blockTime * 1000).toISOString()}, Amount: ${t.amount}, Mint: ${t.mint}`);
        });
      }
      
      // Update cursor for next batch
      if (lastTx && lastTx.signature !== before) {
        before = lastTx.signature;
        console.log(`Next batch will start before signature: ${before}`);
      } else {
        console.log('No new cursor available, stopping pagination');
        hasMore = false;
      }
      
      // Always wait at least MIN_DELAY_MS between requests for Enhanced API rate limit
      await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS));
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      hasMore = false;
    }
  }
  
  return { transfers: allTransfers, cancelled: false };
}

/**
 * Process transactions from the Helius Parsed Transaction History API
 * @param {Array} transactions Helius parsed transactions
 * @param {string} feeRecipient Public key of the fee recipient
 * @param {number} lastBlockTime Last processed block time
 * @param {boolean} forceFetchAll If true, ignore lastBlockTime check
 * @returns {Array} Extracted fee transfers
 * 
 * @example
 * // Example input transaction from Helius Enhanced API:
 * {
 *   "description": "Token transfer from ABC to XYZ",
 *   "type": "TRANSFER",
 *   "source": "SYSTEM",
 *   "fee": 5000,
 *   "feePayer": "8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y",
 *   "signature": "5UwRYBxZC6AqyWviMM...",
 *   "slot": 148277128,
 *   "timestamp": 1656442333,
 *   "tokenTransfers": [
 *     {
 *       "fromUserAccount": "Sender123",
 *       "toUserAccount": "FeeRecipient123",
 *       "fromTokenAccount": "TokenAcc123",
 *       "toTokenAccount": "TokenAcc456",
 *       "tokenAmount": 1000000,
 *       "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 *     }
 *   ],
 *   "transactionError": null
 * }
 */
function processTransactions(transactions, feeRecipient, lastBlockTime, forceFetchAll = false, processedSignatures) {
  const transfers = [];
  let skippedFailed = 0;
  let skippedOld = 0;
  let skippedNoTransfers = 0;
  let skippedNotRecipient = 0;
  let skippedDuplicate = 0;
  
  for (const tx of transactions) {
    // Skip if we've already processed this transaction
    if (processedSignatures.has(tx.signature)) {
      skippedDuplicate++;
      continue;
    }
    
    if (tx.transactionError) {
      skippedFailed++;
      continue;
    }
    
    if (!forceFetchAll && tx.timestamp <= lastBlockTime) {
      skippedOld++;
      continue;
    }
    
    if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
      skippedNoTransfers++;
      continue;
    }
    
    let foundTransfer = false;
    for (const transfer of tx.tokenTransfers) {
      if (transfer.toUserAccount === feeRecipient) {
        transfers.push({
          signature: tx.signature,
          blockTime: tx.timestamp,
          mint: transfer.mint,
          amount: transfer.tokenAmount.toString(),
          source: transfer.fromUserAccount,
          raw_data: {
            transaction: {
              signature: tx.signature,
              description: tx.description,
              type: tx.type,
              source: tx.source,
              fee: tx.fee,
              feePayer: tx.feePayer,
              slot: tx.slot,
              timestamp: tx.timestamp,
              tokenTransfers: tx.tokenTransfers
            },
            matchedTransfer: transfer
          }
        });
        foundTransfer = true;
      }
    }
    
    if (!foundTransfer) {
      skippedNotRecipient++;
    }
    
    // Mark this transaction as processed
    processedSignatures.add(tx.signature);
  }
  
  console.log('Transaction processing stats:');
  console.log(`- Skipped duplicate transactions: ${skippedDuplicate}`);
  console.log(`- Skipped failed transactions: ${skippedFailed}`);
  console.log(`- Skipped old transactions: ${skippedOld}`);
  console.log(`- Skipped no transfers: ${skippedNoTransfers}`);
  console.log(`- Skipped not recipient: ${skippedNotRecipient}`);
  console.log(`- Valid transfers found: ${transfers.length}`);
  
  return transfers;
} 