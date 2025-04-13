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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      signature TEXT NOT NULL,
      blockTime INTEGER NOT NULL,
      mint TEXT NOT NULL,
      amount TEXT NOT NULL,
      source TEXT,
      raw_data TEXT,
      UNIQUE(signature, mint)
    );
    
    CREATE INDEX IF NOT EXISTS idx_blockTime ON fee_transfers (blockTime);
    CREATE INDEX IF NOT EXISTS idx_mint ON fee_transfers (mint);
    CREATE INDEX IF NOT EXISTS idx_signature ON fee_transfers (signature);
    
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
  console.log(`\n=== Storing Transfers ===`);
  console.log(`Attempting to store ${transfers.length} transfers`);
  
  const insert = db.prepare(
    'INSERT OR IGNORE INTO fee_transfers (signature, blockTime, mint, amount, source, raw_data) VALUES (?, ?, ?, ?, ?, ?)'
  );
  
  const insertMany = db.transaction((items) => {
    let stored = 0;
    let ignored = 0;
    let uniqueSignatures = new Set();
    
    for (const item of items) {
      uniqueSignatures.add(item.signature);
      const result = insert.run(
        item.signature, 
        item.blockTime, 
        item.mint, 
        item.amount, 
        item.source,
        item.raw_data ? JSON.stringify(item.raw_data) : null
      );
      
      if (result.changes > 0) {
        stored++;
      } else {
        ignored++;
        console.log(`Ignored duplicate transfer: ${item.signature} (${item.mint}, ${item.amount})`);
      }
    }
    
    console.log(`\nStorage Summary:`);
    console.log(`- Attempted: ${items.length}`);
    console.log(`- Stored: ${stored}`);
    console.log(`- Ignored: ${ignored}`);
    console.log(`- Unique transactions: ${uniqueSignatures.size}`);
    
    return stored;
  });
  
  const storedCount = insertMany(transfers);
  
  // Double check the total count in database
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM fee_transfers').get().count;
  const uniqueTxCount = db.prepare('SELECT COUNT(DISTINCT signature) as count FROM fee_transfers').get().count;
  console.log(`Database stats:`);
  console.log(`- Total transfers: ${totalCount}`);
  console.log(`- Unique transactions: ${uniqueTxCount}\n`);
  
  return storedCount;
}

/**
 * Aggregate fees by token mint address with daily breakdowns
 * @param {Database} db The database connection
 * @returns {Array<Object>} Array of aggregated fee objects with daily data
 */
export function aggregateFeesByMint(db) {
  // Get total amounts and last transaction time
  const totals = db.prepare(`
    SELECT 
      mint,
      SUM(CAST(amount AS DECIMAL)) as totalAmount,
      MAX(blockTime) as lastTransactionTime
    FROM fee_transfers 
    GROUP BY mint
  `).all();

  if (!totals) return [];

  // Get daily amounts for each mint
  const dailyQuery = db.prepare(`
    SELECT 
      mint,
      date(blockTime, 'unixepoch') as date,
      SUM(CAST(amount AS DECIMAL)) as dailyAmount
    FROM fee_transfers 
    GROUP BY mint, date
    ORDER BY date DESC
  `);

  return totals.map(total => {
    const dailyFees = dailyQuery.all().filter(daily => daily.mint === total.mint)
      .map(daily => ({
        date: daily.date,
        amountRaw: daily.dailyAmount.toString(),
        amountUI: null // Will be converted after getting token decimals
      }));

    return {
      mint: total.mint,
      totalAmount: total.totalAmount.toString(),
      lastTransactionTime: total.lastTransactionTime,
      dailyFees
    };
  });
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