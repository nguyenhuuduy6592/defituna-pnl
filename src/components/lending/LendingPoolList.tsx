import React from 'react';
import { VaultData } from '@/utils/api/lending';
import LendingPoolCard from './LendingPoolCard';
import styles from './LendingPoolList.module.scss';

interface LendingPoolListProps {
  vaults: VaultData[];
  loading: boolean;
  error: string | null;
  filters: {
    sortBy?: 'tvl' | 'supplyApy' | 'borrowApy' | 'utilization';
    sortOrder?: 'asc' | 'desc';
  };
  onRetry: () => void;
}

export default function LendingPoolList({ vaults, loading, error, filters, onRetry }: LendingPoolListProps) {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading lending pools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <button 
          className={styles.retryButton}
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!vaults?.length) {
    return (
      <div className={styles.emptyContainer}>
        <p>No lending pools available at the moment.</p>
      </div>
    );
  }

  return (
    <div className={styles.poolsGrid}>
      {vaults.map((vault) => (
        <div key={vault.address} role="article" aria-label="lending pool card">
          <LendingPoolCard
            vault={vault}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
          />
        </div>
      ))}
    </div>
  );
} 