import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './LendingPoolCard.module.scss';
import visualStyles from '../../styles/lending/VisualEnhancements.module.scss';
import InfoIcon from '../common/InfoIcon';
import { formatNumber, formatWalletAddress, formatPercentage } from '../../utils/formatters';
import { VaultData } from '@/utils/api/lending';
import { useTokenMetadata } from '../../hooks/useTokenMetadata';
import classNames from 'classnames';

interface LendingPoolCardProps {
  vault: VaultData;
  sortBy?: string;
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

  // Determine APY value styling
  const getApyValueClass = (apy: number) => {
    if (apy > 0) return visualStyles.positive;
    if (apy < 0) return visualStyles.negative;
    return visualStyles.neutral;
  };

  // Memoize the card classes to prevent unnecessary recalculations
  const cardClasses = useMemo(() => 
    classNames(
      styles.card,
      visualStyles.hoverEffect,
      visualStyles.fadeIn
    ), []
  );

  return (
    <div className={cardClasses}>
      <div className={styles.header}>
        <div className={styles.tokenInfo}>
          {tokenMetadata?.logo && (
            <img 
              src={tokenMetadata.logo} 
              alt={tokenMetadata.symbol} 
              className={styles.tokenLogo}
            />
          )}
          <h3 className={styles.tokenName}>
            {tokenMetadata?.symbol || 'Unknown Token'}
          </h3>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={classNames(styles.metric, getSortIndicatorClass('tvl'), visualStyles.slideIn)}>
          <div className={classNames(styles.metricLabel, visualStyles.touchTarget)}>
            TVL
            <InfoIcon content="Total Value Locked in the lending pool" position="top" />
          </div>
          <div className={styles.metricValue}>{formattedTVL}</div>
        </div>

        <div className={classNames(styles.metric, getSortIndicatorClass('borrowed'), visualStyles.slideIn)}>
          <div className={classNames(styles.metricLabel, visualStyles.touchTarget)}>
            Borrowed
            <InfoIcon content="Total amount borrowed from the pool" position="top" />
          </div>
          <div className={styles.metricValue}>{formattedBorrowed}</div>
        </div>

        <div className={classNames(styles.metric, getSortIndicatorClass('utilization'), visualStyles.slideIn)}>
          <div className={classNames(styles.metricLabel, visualStyles.touchTarget)}>
            Utilization
            <InfoIcon content="Percentage of TVL that is currently borrowed" position="top" />
          </div>
          <div className={classNames(styles.metricValue, visualStyles.pulseOnUpdate)}>
            {formattedUtilization}
          </div>
        </div>

        <div className={classNames(styles.metric, getSortIndicatorClass('supplyApy'), visualStyles.slideIn)}>
          <div className={classNames(styles.metricLabel, visualStyles.touchTarget)}>
            Supply APY
            <InfoIcon content="Annual Percentage Yield for lenders" position="top" />
          </div>
          <div className={classNames(
            styles.metricValue,
            visualStyles.apyValue,
            getApyValueClass(vault.supplyApy),
            visualStyles.pulseOnUpdate
          )}>
            {formattedSupplyApy}
          </div>
        </div>

        <div className={classNames(styles.metric, getSortIndicatorClass('borrowApy'), visualStyles.slideIn)}>
          <div className={classNames(styles.metricLabel, visualStyles.touchTarget)}>
            Borrow APY
            <InfoIcon content="Annual Percentage Yield for borrowers" position="top" />
          </div>
          <div className={classNames(
            styles.metricValue,
            visualStyles.apyValue,
            getApyValueClass(vault.borrowApy),
            visualStyles.pulseOnUpdate
          )}>
            {formattedBorrowApy}
          </div>
        </div>

        <div className={classNames(styles.metric, visualStyles.slideIn)}>
          <div className={classNames(styles.metricLabel, visualStyles.touchTarget)}>
            Supply Limit
            <InfoIcon content="Maximum amount that can be supplied to this pool" position="top" />
          </div>
          <div className={styles.metricValue}>{formattedSupplyLimit}</div>
        </div>
      </div>
    </div>
  );
} 