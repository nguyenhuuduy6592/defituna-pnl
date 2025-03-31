import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/PoolDetail.module.scss';
import { enhancePoolWithTokenMetadata } from '../../utils/tokens';
import { formatNumber, formatWalletAddress, formatPercentage, formatFee } from '../../utils/formatters';

export default function PoolDetailPage() {
  const router = useRouter();
  const { address } = router.query;
  
  const [poolData, setPoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  
  useEffect(() => {
    // Only fetch if we have an address
    if (!address) return;
    
    async function fetchPoolDetail() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/pools?address=${address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pool data');
        }
        
        const data = await response.json();
        if (!data.data || !data.data.length) {
          throw new Error('Pool not found');
        }
        
        // Enhance with token metadata
        const enhancedPool = await enhancePoolWithTokenMetadata(data.data[0]);
        setPoolData(enhancedPool);
      } catch (err) {
        console.error('Error fetching pool detail:', err);
        setError(err.message || 'Failed to load pool data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPoolDetail();
  }, [address]);
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  // Format values using the helper functions
  const getFormattedValues = () => {
    if (!poolData) return {};
    
    const stats = poolData.stats[timeframe] || {};
    
    return {
      tvl: formatFee(poolData.tvl_usdc, true),
      volume: formatFee(stats.volume || 0, true),
      fees: formatFee(stats.fees || 0),
      yield: formatPercentage(stats.yield_over_tvl || 0),
      feeRate: formatPercentage(poolData.fee_rate / 10000),
      protocolFeeRate: formatPercentage(poolData.protocol_fee_rate / 10000),
    };
  };
  
  const formattedValues = getFormattedValues();
  
  // Determine token symbols from metadata
  const tokenASymbol = poolData?.tokenA?.symbol || (poolData?.token_a_mint ? formatWalletAddress(poolData.token_a_mint) : '');
  const tokenBSymbol = poolData?.tokenB?.symbol || (poolData?.token_b_mint ? formatWalletAddress(poolData.token_b_mint) : '');
  
  // Format price if available
  const formattedPrice = poolData?.currentPrice 
    ? Number(poolData.currentPrice) > 0 
      ? `1 ${tokenASymbol} = ${formatNumber(poolData.currentPrice)} ${tokenBSymbol}`
      : 'Price unavailable'
    : 'Price unavailable';
  
  const getYieldClass = (value) => {
    if (!value) return '';
    const yieldValue = value * 100;
    if (yieldValue > 20) return styles.positive;
    if (yieldValue > 10) return styles.neutral;
    if (yieldValue < 5) return styles.negative;
    return '';
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>{poolData ? `${tokenASymbol}/${tokenBSymbol} Pool` : 'Pool Details'} | DeFiTuna</title>
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
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading pool data...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>{error}</div>
          </div>
        ) : poolData && (
          <>
            <div className={styles.poolOverview}>
              <div className={styles.poolIdentity}>
                <div className={styles.tokenPair}>
                  <div className={styles.tokenInfo}>
                    <span className={styles.tokenSymbol}>{tokenASymbol}</span>
                  </div>
                  
                  <span className={styles.separator}>/</span>
                  
                  <div className={styles.tokenInfo}>
                    <span className={styles.tokenSymbol}>{tokenBSymbol}</span>
                  </div>
                </div>
                
                <div className={styles.provider}>
                  provided by <span>{poolData.provider}</span>
                </div>
              </div>
              
              <div className={styles.priceInfo}>
                <div className={styles.priceLabel}>Current Price:</div>
                <div className={styles.priceValue}>{formattedPrice}</div>
              </div>
              
              <div className={styles.addressSection}>
                <div className={styles.addressItem}>
                  <div className={styles.addressLabel}>Pool Address</div>
                  <div className={styles.addressValue} title={poolData.address}>{formatWalletAddress(poolData.address)}</div>
                </div>
                
                <div className={styles.addressItem}>
                  <div className={styles.addressLabel}>Token A Mint</div>
                  <div className={styles.addressValue} title={poolData.token_a_mint}>
                    {tokenASymbol} ({formatWalletAddress(poolData.token_a_mint)})
                  </div>
                </div>
                
                <div className={styles.addressItem}>
                  <div className={styles.addressLabel}>Token B Mint</div>
                  <div className={styles.addressValue} title={poolData.token_b_mint}>
                    {tokenBSymbol} ({formatWalletAddress(poolData.token_b_mint)})
                  </div>
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
                <div className={`${styles.statValue} ${styles.highlight}`}>{formattedValues.tvl}</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Volume ({timeframe})</div>
                <div className={styles.statValue}>{formattedValues.volume}</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Fees ({timeframe})</div>
                <div className={styles.statValue}>{formattedValues.fees}</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Yield ({timeframe})</div>
                <div className={`${styles.statValue} ${getYieldClass(poolData.stats[timeframe]?.yield_over_tvl)}`}>
                  {formattedValues.yield}
                </div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Fee Rate</div>
                <div className={styles.statValue}>{formattedValues.feeRate}</div>
              </div>
            </div>
            
            <div className={styles.technicalDetails}>
              <h2>Technical Details</h2>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Liquidity</div>
                  <div className={styles.detailValue}>{formatNumber(poolData.liquidity, true)}</div>
                </div>
                
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Sqrt Price</div>
                  <div className={styles.detailValue}>{poolData.sqrt_price}</div>
                </div>
                
                {poolData.protocol_fee_rate !== undefined && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Protocol Fee</div>
                    <div className={styles.detailValue}>{formattedValues.protocolFeeRate}</div>
                  </div>
                )}
                
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Token A Decimals</div>
                  <div className={styles.detailValue}>
                    {poolData.tokenA?.decimals !== undefined ? poolData.tokenA.decimals : 'Unknown'}
                  </div>
                </div>
                
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Token B Decimals</div>
                  <div className={styles.detailValue}>
                    {poolData.tokenB?.decimals !== undefined ? poolData.tokenB.decimals : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button className={styles.actionButton}>Create Position</button>
              <button className={styles.actionButton}>Share Pool</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 