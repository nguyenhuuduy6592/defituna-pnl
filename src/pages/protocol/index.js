import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './protocol.module.scss';

// Import FeeChart with SSR disabled since it uses browser-only libraries (recharts)
const FeeChart = dynamic(() => import('../../components/protocol/charts/FeeChart'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>Loading chart component...</div>
  )
});

export default function Protocol() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('Fetching stats data...');
        
        // Fetch directly from public directory
        const response = await fetch('/data/protocol-fees.json');
        if (!response.ok) {
          throw new Error('Failed to fetch stats data');
        }
        
        const rawData = await response.json();
        console.log('Raw stats data:', rawData);
        
        if (!rawData.feesByToken || !Array.isArray(rawData.feesByToken)) {
          throw new Error('Invalid stats data format');
        }

        // Validate the data structure
        rawData.feesByToken.forEach((token, index) => {
          if (!token.symbol || !token.dailyFees) {
            console.warn(`Token at index ${index} is missing required fields:`, token);
          }
        });
        
        setStatsData(rawData);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleTimeRangeChange = (range) => {
    console.log('Changing time range to:', range);
    setTimeRange(range);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading protocol data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Error loading protocol data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Protocol Analytics</h1>
      
      <div className={styles.timeRangeSelector}>
        <button 
          className={`${styles.timeButton} ${timeRange === '24h' ? styles.active : ''}`}
          onClick={() => handleTimeRangeChange('24h')}
        >
          24H
        </button>
        <button 
          className={`${styles.timeButton} ${timeRange === '7d' ? styles.active : ''}`}
          onClick={() => handleTimeRangeChange('7d')}
        >
          7D
        </button>
        <button 
          className={`${styles.timeButton} ${timeRange === '30d' ? styles.active : ''}`}
          onClick={() => handleTimeRangeChange('30d')}
        >
          30D
        </button>
      </div>

      <div className={styles.chartContainer}>
        {statsData && (
          <FeeChart 
            timeRange={timeRange} 
            data={statsData} 
          />
        )}
      </div>
    </div>
  );
} 