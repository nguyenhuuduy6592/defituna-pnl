import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/PoolDetail.module.scss';
import { enhancePoolWithTokenMetadata } from '../../utils/tokens';

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
      tvl: '$' + formatNumber(poolData.tvl_usdc),
      volume: '$' + formatNumber(stats.volume || 0),
      fees: '$' + formatNumber(stats.fees || 0),
      yield: formatPercentage(stats.yield_over_tvl || 0),
      feeRate: (poolData.fee_rate / 10000).toFixed(2) + '%',
      protocolFeeRate: (poolData.protocol_fee_rate / 10000).toFixed(2) + '%',
    };
  };
  
  const formattedValues = getFormattedValues();
  
  // Determine token symbols from metadata
  const tokenASymbol = poolData?.tokenA?.symbol || (poolData?.token_a_mint ? `${poolData.token_a_mint.slice(0, 4)}...${poolData.token_a_mint.slice(-4)}` : '');
  const tokenBSymbol = poolData?.tokenB?.symbol || (poolData?.token_b_mint ? `${poolData.token_b_mint.slice(0, 4)}...${poolData.token_b_mint.slice(-4)}` : '');
  
  // Format price if available
  const formattedPrice = poolData?.currentPrice 
    ? poolData.currentPrice > 0.01 
      ? `1 ${tokenASymbol} = ${poolData.currentPrice.toFixed(6)} ${tokenBSymbol}`
      : `1 ${tokenBSymbol} = ${(1/poolData.currentPrice).toFixed(6)} ${tokenASymbol}`
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
                    {poolData.tokenA?.logoURI && (
                      <div className={styles.tokenLogo}>
                        <Image 
                          src={poolData.tokenA.logoURI} 
                          alt={tokenASymbol} 
                          width={24} 
                          height={24} 
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}
                    <span className={styles.tokenSymbol}>{tokenASymbol}</span>
                  </div>
                  
                  <span className={styles.separator}>/</span>
                  
                  <div className={styles.tokenInfo}>
                    {poolData.tokenB?.logoURI && (
                      <div className={styles.tokenLogo}>
                        <Image 
                          src={poolData.tokenB.logoURI} 
                          alt={tokenBSymbol} 
                          width={24} 
                          height={24}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}
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
                  <div className={styles.addressValue}>{poolData.address}</div>
                </div>
                
                <div className={styles.addressItem}>
                  <div className={styles.addressLabel}>Token A Mint</div>
                  <div className={styles.addressValue}>{poolData.token_a_mint}</div>
                </div>
                
                <div className={styles.addressItem}>
                  <div className={styles.addressLabel}>Token B Mint</div>
                  <div className={styles.addressValue}>{poolData.token_b_mint}</div>
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
                <div className={`${styles.statValue} ${getYieldClass(poolData.stats[timeframe].yield_over_tvl)}`}>{formattedValues.yield}</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Fee Rate</div>
                <div className={styles.statValue}>{formattedValues.feeRate}</div>
              </div>
            </div>
            
            <div className={styles.poolDetails}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Technical Details</h2>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Protocol Fee Rate</div>
                    <div className={styles.detailValue}>{formattedValues.protocolFeeRate}</div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Tick Spacing</div>
                    <div className={styles.detailValue}>{poolData.tick_spacing}</div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Current Tick Index</div>
                    <div className={styles.detailValue}>{poolData.tick_current_index}</div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Sqrt Price</div>
                    <div className={styles.detailValue} title={poolData.sqrt_price}>
                      {poolData.sqrt_price.slice(0, 10)}...
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Liquidity</div>
                    <div className={styles.detailValue} title={poolData.liquidity}>
                      {poolData.liquidity.slice(0, 10)}...
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Token A Vault</div>
                    <div className={styles.detailValue} title={poolData.token_a_vault}>
                      {poolData.token_a_vault.slice(0, 10)}...
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Token B Vault</div>
                    <div className={styles.detailValue} title={poolData.token_b_vault}>
                      {poolData.token_b_vault.slice(0, 10)}...
                    </div>
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
          </>
        )}
      </main>
    </div>
  );
} 