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
    // Initialize database and update status
    const db = initializeDatabase();
    updateStatus(db, 'processStatus', 'running');
    updateStatus(db, 'currentStep', 'Generating statistics');
    
    // Aggregate fees by token
    const aggregatedFees = aggregateFeesByMint(db);
    
    if (aggregatedFees.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No fee data available',
        tokensProcessed: 0
      });
    }
    
    // Get token metadata
    const mints = aggregatedFees.map(fee => fee.mint);
    const metadata = await fetchTokenMetadata(mints);
    
    // Format results
    const feesByToken = aggregatedFees.map(fee => {
      const decimals = metadata[fee.mint]?.decimals || 0;
      const symbol = metadata[fee.mint]?.symbol || 'UNKNOWN';
      
      // Convert the fee amount to a number and handle decimals
      const totalAmountNum = Number(fee.totalAmount);
      const totalAmountUI = totalAmountNum / (10 ** decimals);
      
      // Convert daily amounts to UI values
      const dailyFees = fee.dailyFees.map(daily => ({
        date: daily.date,
        amountRaw: daily.amountRaw,
        amountUI: Number(daily.amountRaw) / (10 ** decimals)
      }));

      return {
        mint: fee.mint,
        symbol,
        decimals,
        totalAmountRaw: fee.totalAmount,
        totalAmountUI: totalAmountUI,
        lastTransactionTime: fee.lastTransactionTime * 1000, // Convert to milliseconds for JS Date
        dailyFees
      };
    });
    
    // Create output structure
    const output = {
      lastUpdatedTimestamp: Math.floor(Date.now() / 1000),
      feesByToken
    };
    
    // Ensure directory exists
    const dataDir = path.join(process.cwd(), 'public/data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
    }
    
    // Write output file
    const outputPath = path.join(dataDir, 'protocol-fees.json');
    await fs.writeFile(
      outputPath,
      JSON.stringify(output, null, 2)
    );
    
    // Update status
    updateStatus(db, 'processStatus', 'completed');
    updateStatus(db, 'lastGeneration', Date.now().toString());
    
    return res.status(200).json({
      success: true,
      tokensProcessed: feesByToken.length,
      outputPath: '/data/protocol-fees.json'
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
      success: false,
      error: error.message
    });
  }
} 