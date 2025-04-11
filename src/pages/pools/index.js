import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import usePoolsData from '@/hooks/usePoolsData';
import PoolCard from '@/components/pools/PoolCard';
import PoolFilters from '@/components/pools/PoolFilters';
import { useComparison } from '@/contexts/ComparisonContext';
import styles from '@/styles/Pools.module.scss';
import { appTitle } from '@/utils/constants';

export default function PoolsPage() {
  // State for selected timeframe (24h, 7d, 30d)
  const [timeframe, setTimeframe] = useState('24h');
  
  // Use the pools data hook
  const { 
    pools, 
    loading, 
    error, 
    filters, 
    filterOptions,
    applyFilters 
  } = usePoolsData();
  
  // Get comparison context
  const { comparisonPools } = useComparison();
  
  // Extract unique providers from pools data
  const providers = useMemo(() => {
    if (!pools || pools.length === 0) return ['orca'];
    return [...new Set(pools.map(pool => pool.provider))];
  }, [pools]);
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>All Pools - {appTitle}</title>
        <meta name="description" content="Explore all available pools on DeFiTuna" />
      </Head>
      
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>All Pools</h1>
          <div className={styles.headerActions}>
            {comparisonPools.length > 0 && (
              <Link href="/pools/compare" className={styles.compareLink}>
                Compare Pools ({comparisonPools.length})
              </Link>
            )}
            <Link href="/" className={styles.homeLink}>
            ← Back to PnL Viewer
            </Link>
          </div>
        </div>
        
        <p className={styles.description}>
          Explore and analyze all available liquidity pools on DeFiTuna
        </p>
        
        <PoolFilters 
          filters={filters}
          onFilterChange={applyFilters}
          filterOptions={filterOptions}
        />
        
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading pools data...</p>
          </div>
        )}
        
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>Error: {error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => applyFilters(filters)}
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && !error && pools && pools.length === 0 && (
          <div className={styles.emptyContainer}>
            <p>No pools found matching your filters.</p>
          </div>
        )}
        
        <div className={styles.poolsGrid}>
          {!loading && !error && pools && pools.map((pool) => (
            <PoolCard 
              key={pool.address} 
              pool={pool} 
              timeframe={filters.timeframe}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
            />
          ))}
        </div>
      </main>
    </div>
  );
} 