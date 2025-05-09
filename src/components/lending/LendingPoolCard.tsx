import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/LendingPoolCard.module.scss';
import { formatNumber, formatWalletAddress, formatPercentage } from '../../utils/formatters';
import InfoIcon from '../common/InfoIcon';
import { VaultData } from '@/utils/api/lending';
import { useTokenMetadata } from '@/hooks/useTokenMetadata';

interface LendingPoolCardProps {
  vault: VaultData;
  sortBy?: 'tvl' | 'supplyApy' | 'borrowApy' | 'utilization';
  sortOrder?: 'asc' | 'desc';
}

export default function LendingPoolCard({ vault, sortBy, sortOrder }: LendingPoolCardProps) {
  if (!vault) return null;

  const { metadata: tokenMetadata } = useTokenMetadata(vault.mint);
  
  // Format values for display
  const formattedTVL = '$' + formatNumber(vault.depositedFunds.usdValue, true);
  const formattedBorrowed = '$' + formatNumber(vault.borrowedFunds.usdValue, true);
  const formattedSupplyLimit = '$' + formatNumber(vault.supplyLimit.usdValue, true);
  const formattedUtilization = formatPercentage(vault.utilization);
  const formattedSupplyApy = formatPercentage(vault.supplyApy);
  const formattedBorrowApy = formatPercentage(vault.borrowApy);
  
  // Get sort indicator class
  const getSortIndicatorClass = (field: string) => {
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? styles.sortAsc : styles.sortDesc;
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardWrapper}>
        <Link href={`/lending/${vault.address}`} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.tokenInfo}>
              {tokenMetadata?.logo && (
                <div className={styles.tokenLogo}>
                  <Image
                    src={tokenMetadata.logo}
                    alt={`${tokenMetadata.symbol} logo`}
                    width={24}
                    height={24}
                  />
                </div>
              )}
              <span className={styles.tokenSymbol}>
                {tokenMetadata?.symbol || formatWalletAddress(vault.mint)}
              </span>
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={`${styles.metric} ${getSortIndicatorClass('tvl')}`}>
              <div className={styles.metricLabel}>
                TVL
                <InfoIcon content="Total Value Locked in the lending pool" position="top" />
              </div>
              <div className={styles.metricValue}>{formattedTVL}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass('borrowed')}`}>
              <div className={styles.metricLabel}>
                Borrowed
                <InfoIcon content="Total amount borrowed from the pool" position="top" />
              </div>
              <div className={styles.metricValue}>{formattedBorrowed}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass('utilization')}`}>
              <div className={styles.metricLabel}>
                Utilization
                <InfoIcon content="Percentage of TVL that is currently borrowed" position="top" />
              </div>
              <div className={styles.metricValue}>{formattedUtilization}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass('supplyApy')}`}>
              <div className={styles.metricLabel}>
                Supply APY
                <InfoIcon content="Annual Percentage Yield for lenders" position="top" />
              </div>
              <div className={styles.metricValue}>{formattedSupplyApy}</div>
            </div>

            <div className={`${styles.metric} ${getSortIndicatorClass('borrowApy')}`}>
              <div className={styles.metricLabel}>
                Borrow APY
                <InfoIcon content="Annual Percentage Yield for borrowers" position="top" />
              </div>
              <div className={styles.metricValue}>{formattedBorrowApy}</div>
            </div>

            <div className={styles.metric}>
              <div className={styles.metricLabel}>
                Supply Limit
                <InfoIcon content="Maximum amount that can be supplied to the pool" position="top" />
              </div>
              <div className={styles.metricValue}>{formattedSupplyLimit}</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
} 