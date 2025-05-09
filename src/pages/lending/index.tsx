import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLendingPools } from '@/hooks/useLendingPools';
import { VaultData } from '@/utils/api/lending';
import LendingPoolCard from '@/components/lending/LendingPoolCard';
import styles from './index.module.scss';

export default function LendingPage() {
  const {
    vaults,
    loading,
    error,
    filters,
    filterOptions,
    applyFilters,
    refresh
  } = useLendingPools();

  const totalTvl = vaults?.reduce((sum: number, vault: VaultData) => 
    sum + (vault.depositedFunds.usdValue || 0), 0
  ) || 0;

  return (
    <div className={styles.container}>
      <Head>
        <title>DeFiTuna - Lending</title>
        <meta name="description" content="Explore lending opportunities on DeFiTuna" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.navigationLinks}>
            <Link href="/" className={styles.linkWithoutUnderline}>
              <button className={styles.backButton}>
                Home
              </button>
            </Link>
          </div>

          <h1 className={styles.heading}>
            Lending Pools
          </h1>

          <div className={styles.tvlDisplay}>
            Total Value Locked: ${totalTvl.toLocaleString()}
          </div>
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading lending pools...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>Error: {error}</p>
            <button 
              className={styles.retryButton}
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && vaults?.length === 0 && (
          <div className={styles.emptyContainer}>
            <p>No lending pools available at the moment.</p>
          </div>
        )}

        {!loading && !error && vaults?.length > 0 && (
          <div className={styles.poolsGrid}>
            {vaults.map((vault) => (
              <LendingPoolCard
                key={vault.address}
                vault={vault}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 