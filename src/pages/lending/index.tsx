import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLendingPools } from '@/hooks/useLendingPools';
import LendingPoolList from '@/components/lending/LendingPoolList';
import LendingPoolFilters from '@/components/lending/LendingPoolFilters';
import InfoIcon from '@/components/common/InfoIcon';
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
          <div className={styles.headerLeft}>
            <h1 className={styles.heading}>
              Lending Pools
            </h1>
            <div className={styles.navigationLinks}>
              <div className={styles.tvlDisplay}>
                <InfoIcon 
                  content="Total Value Locked (TVL) represents the total amount of assets deposited in all lending pools" 
                  position="left"
                />
                <span>Total Value Locked: ${totalTvl.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.headerRight}>
              <Link href="/" className={styles.linkWithoutUnderline}>
                <button className={styles.backButton}>
                  Back to PnL Viewer
                </button>
              </Link>
          </div>
        </div>

        <LendingPoolFilters
          filters={filters}
          onFilterChange={applyFilters}
          filterOptions={filterOptions}
        />

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