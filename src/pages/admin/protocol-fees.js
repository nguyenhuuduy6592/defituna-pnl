import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export default function ProtocolFeesAdmin() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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

  const fetchFeeData = async (forceFetch = false) => {
    setStatus('fetching');
    setMessage('Fetching transaction data...');
    setError('');

    try {
      const response = await fetch('/api/admin/fetch-fee-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forceFetchAll: forceFetch })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully ${forceFetch ? 'force ' : ''}fetched ${data.message}`);
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

  const handleStopFetch = async () => {
    try {
      const response = await fetch('/api/admin/fetch-fee-data', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Fetch operation cancelled');
      } else {
        setError(`Error: ${data.error || 'Failed to stop fetch'}`);
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
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
        setMessage(`Successfully generated stats for ${data.tokensProcessed} tokens`);
        
        // Fetch the generated JSON file
        try {
          const fileResponse = await fetch(data.outputPath);
          const fileData = await fileResponse.json();
          setTokens(fileData.feesByToken || []);
        } catch (error) {
          console.error('Error loading generated stats:', error);
        }

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

  const handleForceFetch = () => {
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Protocol Fee Management - DefiTuna Admin</title>
      </Head>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => fetchFeeData(true)}
        title="Force Fetch All Data"
        message="This will clear all existing fee data and fetch the complete transaction history from the beginning. This operation cannot be undone. Are you sure you want to continue?"
      />

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
              onClick={() => fetchFeeData(false)}
              disabled={status === 'fetching'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {status === 'fetching' ? 'Fetching...' : 'Fetch/Update Fee Data'}
            </button>

            <button
              onClick={handleStopFetch}
              disabled={status !== 'fetching'}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
            >
              Stop Fetching
            </button>

            <button
              onClick={handleForceFetch}
              disabled={status === 'fetching'}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
            >
              {status === 'fetching' ? 'Fetching...' : 'Force Fetch All Data'}
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

      {tokens.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Generated Token Statistics</h2>
          <div className="bg-white shadow rounded overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{token.mint}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{token.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{token.totalAmountUI.toFixed(6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {token.lastTransactionTime ? new Date(token.lastTransactionTime).toLocaleString() : 'No transactions'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 