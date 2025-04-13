import { initializeDatabase, getStatus } from '@/utils/feeDb';

/**
 * API route for getting process status
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
    const db = initializeDatabase();
    
    // Get all status values
    const statusKeys = [
      'processStatus', 'currentStep', 'lastRunStartTime', 
      'lastRunEndTime', 'lastSuccessfulRun', 'lastError', 
      'lastErrorTime', 'lastGeneration'
    ];
    
    const status = {};
    for (const key of statusKeys) {
      status[key] = getStatus(db, key);
    }
    
    return res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 