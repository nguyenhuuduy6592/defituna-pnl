import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLendingPools } from '@/hooks/useLendingPools';
import LendingPoolList from '@/components/lending/LendingPoolList';
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

  const totalTvl = vaults?.reduce((sum, vault) => 
    sum + (vault.depositedFunds.usdValue || 0), 0
  ) || 0;

  return (
    <div className={styles.container}>
      <Head>
        <title>DeFiTuna - Lending</title>
        <meta name="description" content="Explore lending opportunities on DeFiTuna" />
      </Head>

      <main>
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

        <LendingPoolList
          vaults={vaults}
          loading={loading}
          error={error}
          filters={filters}
          onRetry={refresh}
        />
      </main>
    </div>
  );
} 