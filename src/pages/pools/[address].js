import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/PoolDetail.module.scss';

// Helper functions for formatting
function formatNumber(num, digits = 2) {
  const absNum = Math.abs(Number(num));
  if (isNaN(absNum)) return "N/A";
  
  if (absNum >= 1e9) return (absNum / 1e9).toFixed(digits) + 'B';
  if (absNum >= 1e6) return (absNum / 1e6).toFixed(digits) + 'M';
  if (absNum >= 1e3) return (absNum / 1e3).toFixed(digits) + 'K';
  return absNum.toFixed(digits);
}

function formatPercentage(value) {
  const percentValue = Number(value) * 100;
  if (isNaN(percentValue)) return "N/A";
  
  return percentValue.toFixed(2) + '%';
}

export default function PoolDetailPage() {
  const router = useRouter();
  const { address } = router.query;
  
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  
  // Fetch pool data
  useEffect(() => {
    async function fetchPoolData() {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all pools and find the matching one
        // In a future implementation, this could be optimized with a dedicated endpoint
        const response = await fetch(`/api/pools`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch pool data');
        }
        
        const data = await response.json();
        const poolData = data.data.find(p => p.address === address);
        
        if (!poolData) {
          throw new Error('Pool not found');
        }
        
        setPool(poolData);
      } catch (err) {
        console.error('Error fetching pool data:', err);
        setError(err.message || 'Failed to fetch pool data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPoolData();
  }, [address]);
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading pool data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Error: {error}</p>
          <Link href="/pools">
            <button className={styles.backButton}>
              Back to Pools
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!pool) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Pool not found</p>
          <Link href="/pools">
            <button className={styles.backButton}>
              Back to Pools
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Extract stats for the selected timeframe
  const stats = pool.stats?.[timeframe] || {};
  
  // Format values for display
  const formattedTVL = '$' + formatNumber(pool.tvl_usdc);
  const formattedVolume = '$' + formatNumber(stats.volume || 0);
  const formattedFees = '$' + formatNumber(stats.fees || 0);
  const formattedYield = formatPercentage(stats.yield_over_tvl || 0);
  const formattedFeeRate = (pool.fee_rate / 10000).toFixed(2) + '%'; // Convert basis points to percentage
  
  const getYieldClass = (value) => {
    if (value > 20) return styles.positive;
    if (value > 10) return styles.neutral;
    if (value < 5) return styles.negative;
    return '';
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>DeFiTuna Pool - {pool.address.slice(0, 8)}...</title>
        <meta name="description" content={`Details for DeFiTuna pool ${pool.address}`} />
      </Head>
      
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.navigationLinks}>
            <Link href="/pools" className={styles.linkWithoutUnderline}>
              <button className={styles.backButton}>
                ← Back to Pools
              </button>
            </Link>
            <Link href="/" className={styles.linkWithoutUnderline}>
              <button className={styles.backButton}>
                Home
              </button>
            </Link>
          </div>
          
          <h1 className={styles.heading}>
            Pool Details
          </h1>
        </div>
        
        <div className={styles.poolOverview}>
          <div className={styles.poolIdentity}>
            <div className={styles.tokenPair}>
              <div className={styles.tokenInfo}>
                <div className={styles.tokenSymbol}>{pool.token_a_mint.slice(0, 8)}...</div>
              </div>
              <div className={styles.separator}>/</div>
              <div className={styles.tokenInfo}>
                <div className={styles.tokenSymbol}>{pool.token_b_mint.slice(0, 8)}...</div>
              </div>
            </div>
            <div className={styles.provider}>
              Provider: <span>{pool.provider}</span>
            </div>
          </div>
          
          <div className={styles.addressSection}>
            <div className={styles.addressItem}>
              <div className={styles.addressLabel}>Pool Address</div>
              <div className={styles.addressValue}>{pool.address}</div>
            </div>
          </div>
        </div>
        
        <div className={styles.timeframeSelector}>
          <button 
            className={`${styles.timeframeButton} ${timeframe === '24h' ? styles.active : ''}`}
            onClick={() => handleTimeframeChange('24h')}
          >
            24h
          </button>
          <button 
            className={`${styles.timeframeButton} ${timeframe === '7d' ? styles.active : ''}`}
            onClick={() => handleTimeframeChange('7d')}
          >
            7d
          </button>
          <button 
            className={`${styles.timeframeButton} ${timeframe === '30d' ? styles.active : ''}`}
            onClick={() => handleTimeframeChange('30d')}
          >
            30d
          </button>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>TVL</div>
            <div className={styles.statValue}>{formattedTVL}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Volume ({timeframe})</div>
            <div className={styles.statValue}>{formattedVolume}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Fees ({timeframe})</div>
            <div className={styles.statValue}>{formattedFees}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Yield ({timeframe})</div>
            <div className={`${styles.statValue} ${getYieldClass(stats.yield_over_tvl || 0)}`}>{formattedYield}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Fee Rate</div>
            <div className={styles.statValue}>{formattedFeeRate}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Protocol Fee Rate</div>
            <div className={styles.statValue}>{(pool.protocol_fee_rate / 10000).toFixed(2) + '%'}</div>
          </div>
        </div>
        
        <div className={styles.poolDetails}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Technical Details</h2>
            
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Tick Spacing</div>
                <div className={styles.detailValue}>{pool.tick_spacing}</div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Current Tick Index</div>
                <div className={styles.detailValue}>{pool.tick_current_index}</div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Liquidity</div>
                <div className={styles.detailValue}>{pool.liquidity}</div>
              </div>
              
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Sqrt Price</div>
                <div className={styles.detailValue}>{pool.sqrt_price}</div>
              </div>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button className={styles.actionButton}>
              Create Position
            </button>
            <button className={styles.actionButton}>
              Share Pool
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 