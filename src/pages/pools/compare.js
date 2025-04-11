import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useComparison } from '@/contexts/ComparisonContext';
import { formatWalletAddress, formatPercentage, formatFee } from '@/utils/formatters';
import PoolMetrics from '@/components/pools/PoolMetrics';
import styles from '@/styles/PoolsCompare.module.scss';

const TIMEFRAMES = ['24h', '7d', '30d'];

export default function PoolComparisonPage() {
  const { comparisonPools, removePoolFromComparison, clearComparison } = useComparison();
  const [timeframe, setTimeframe] = useState('24h');
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  // Format values for display
  const getFormattedValues = (pool) => {
    if (!pool) return {};
    
    const stats = pool.stats?.[timeframe] || {};
    
    return {
      tvl: formatFee(pool.tvl_usdc, true),
      volume: formatFee(stats.volume || 0, true),
      fees: formatFee(stats.fees || 0),
      yield: formatPercentage(stats.yield_over_tvl || 0),
      feeRate: formatPercentage(pool.fee_rate / 10000),
      protocolFeeRate: formatPercentage(pool.protocol_fee_rate / 10000),
    };
  };
  
  // Get token symbols
  const getTokenSymbols = (pool) => {
    if (!pool) return { tokenA: '', tokenB: '' };
    
    return {
      tokenA: pool.tokenA?.symbol || formatWalletAddress(pool.token_a_mint),
      tokenB: pool.tokenB?.symbol || formatWalletAddress(pool.token_b_mint)
    };
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>DeFiTuna - Pool Comparison</title>
        <meta name="description" content="Compare DeFiTuna pools side by side" />
      </Head>
      
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.navigation}>
            <Link href="/pools" className={styles.backLink}>
              ← Back to Pools
            </Link>
            <Link href="/" className={styles.homeLink}>
              Home
            </Link>
          </div>
          
          <h1 className={styles.heading}>Pool Comparison</h1>
          
          <div className={styles.actions}>
            <button
              className={styles.clearButton}
              onClick={clearComparison}
              disabled={comparisonPools.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className={styles.timeframeSelector}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`${styles.timeframeButton} ${timeframe === tf ? styles.active : ''}`}
              onClick={() => handleTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {comparisonPools.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No pools selected for comparison.</p>
            <p>Go to the <Link href="/pools">pools page</Link> and add pools to compare.</p>
          </div>
        ) : (
          <div className={styles.comparisonGrid}>
            {/* Table headers */}
            <div className={styles.comparisonRow}>
              <div className={styles.labelColumn}>
                <div className={styles.sectionTitle}></div>
              </div>
              
              {comparisonPools.map((pool, index) => {
                const { tokenA, tokenB } = getTokenSymbols(pool);
                return (
                  <div key={pool.address} className={styles.poolColumn}>
                    <div className={styles.poolHeader}>
                      <div className={styles.poolName}>
                        <span>{tokenA}/{tokenB}</span>
                      </div>
                      
                      <button
                        className={styles.removeButton}
                        onClick={() => removePoolFromComparison(pool.address)}
                        aria-label={`Remove ${tokenA}/${tokenB} from comparison`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Basic Metrics */}
            <div className={styles.comparisonSection}>
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>
                  <div className={styles.sectionTitle}>Basic Metrics</div>
                </div>
              </div>
              
              {/* TVL */}
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>TVL</div>
                
                {comparisonPools.map((pool) => {
                  const values = getFormattedValues(pool);
                  return (
                    <div key={`${pool.address}-tvl`} className={styles.poolColumn}>
                      <div className={styles.metricValue}>{values.tvl}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Volume */}
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>Volume ({timeframe})</div>
                
                {comparisonPools.map((pool) => {
                  const values = getFormattedValues(pool);
                  return (
                    <div key={`${pool.address}-volume`} className={styles.poolColumn}>
                      <div className={styles.metricValue}>{values.volume}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Fees */}
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>Fees ({timeframe})</div>
                
                {comparisonPools.map((pool) => {
                  const values = getFormattedValues(pool);
                  return (
                    <div key={`${pool.address}-fees`} className={styles.poolColumn}>
                      <div className={styles.metricValue}>{values.fees}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Yield */}
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>Yield ({timeframe})</div>
                
                {comparisonPools.map((pool) => {
                  const values = getFormattedValues(pool);
                  return (
                    <div key={`${pool.address}-yield`} className={styles.poolColumn}>
                      <div className={styles.metricValue}>{values.yield}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Fee Rate */}
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>Fee Rate</div>
                
                {comparisonPools.map((pool) => {
                  const values = getFormattedValues(pool);
                  return (
                    <div key={`${pool.address}-fee-rate`} className={styles.poolColumn}>
                      <div className={styles.metricValue}>{values.feeRate}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className={styles.comparisonSection}>
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>
                  <div className={styles.sectionTitle}>Performance Metrics</div>
                </div>
              </div>
              
              {/* Derived metrics */}
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>Metrics</div>
                
                {comparisonPools.map((pool) => (
                  <div key={`${pool.address}-metrics`} className={styles.poolColumn}>
                    <div className={styles.metricsContainer}>
                      <PoolMetrics poolAddress={pool.address} timeframe={timeframe} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Links */}
            <div className={styles.comparisonSection}>
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>
                  <div className={styles.sectionTitle}>Pool Details</div>
                </div>
              </div>
              
              <div className={styles.comparisonRow}>
                <div className={styles.labelColumn}>View Details</div>
                
                {comparisonPools.map((pool) => (
                  <div key={`${pool.address}-link`} className={styles.poolColumn}>
                    <Link href={`/pools/${pool.address}`} className={styles.detailLink}>
                      View Pool Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 