import { initializeDatabase, getLatestBlockTime, storeTransfers, updateStatus } from '@/utils/feeDb';
import { fetchFeeTransactions } from '@/utils/fetchFeeTransactions';

// Store the active AbortController
let activeController = null;

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
    if (req.method === 'DELETE') {
      // Handle cancellation request
      if (activeController) {
        activeController.abort();
        activeController = null;
        return res.status(200).json({ success: true, message: 'Fetch cancelled' });
      } else {
        return res.status(404).json({ success: false, message: 'No active fetch to cancel' });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // If there's an active fetch, cancel it
    if (activeController) {
      activeController.abort();
      activeController = null;
    }

    // Initialize database and update status
    const db = initializeDatabase();
    updateStatus(db, 'processStatus', 'running');
    updateStatus(db, 'currentStep', 'Fetching fee data');

    const lastBlockTime = getLatestBlockTime(db);

    // Get force fetch parameter from request body
    const forceFetchAll = req.body?.forceFetchAll === true;
    
    // Create new AbortController for this fetch
    activeController = new AbortController();
    
    const { transfers, cancelled } = await fetchFeeTransactions(
      process.env.PROTOCOL_FEE_RECIPIENT,
      lastBlockTime,
      forceFetchAll,
      activeController.signal
    );
    
    // Clear the controller if fetch completed or was cancelled
    activeController = null;
    
    if (forceFetchAll) {
      // Clear existing data if force fetching
      db.prepare('DELETE FROM fee_transfers').run();
    }
    
    // Store transfers
    const stored = storeTransfers(db, transfers);
    
    // Update status
    updateStatus(db, 'processStatus', 'completed');
    updateStatus(db, 'lastFetchCount', stored.toString());
    updateStatus(db, 'lastFetchTime', Date.now().toString());
    
    // Update last successful sync time if we have transfers
    if (transfers.length > 0) {
      const latestBlockTime = Math.max(...transfers.map(t => t.blockTime));
      updateStatus(db, 'lastSyncTime', latestBlockTime.toString());
    }
    
    return res.status(200).json({ 
      success: true,
      message: `${stored} transfers${forceFetchAll ? ' (force fetched)' : ''}`,
      transfers: transfers.length,
      cancelled
    });
  } catch (error) {
    console.error('API route error:', error);
    
    // Update error status
    try {
      const db = initializeDatabase();
      updateStatus(db, 'processStatus', 'error');
      updateStatus(db, 'lastError', error.message);
      updateStatus(db, 'lastErrorTime', Date.now().toString());
    } catch (dbError) {
      console.error('Failed to update error status:', dbError);
    }
    
    return res.status(500).json({
      error: 'Failed to fetch fee data',
      details: error.message
    });
  }
} 