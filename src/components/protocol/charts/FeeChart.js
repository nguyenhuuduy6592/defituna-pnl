import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import styles from './FeeChart.module.scss';

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#a4de6c',
  '#d0ed57',
  '#83a6ed',
  '#8dd1e1',
  '#a4de6c',
  '#d0ed57'
];

const DEFAULT_TOKENS = ['USDC', 'Bonk', 'PENGU', 'JUP', 'SOL'];

export default function FeeChart({ data, timeRange }) {
  const [processedData, setProcessedData] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState(DEFAULT_TOKENS);
  const [useLogScale, setUseLogScale] = useState(false);
  const [logScale, setLogScale] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState(new Set());

  useEffect(() => {
    if (data?.feesByToken) {
      setVisibleTokens(new Set(data.feesByToken.map(token => token.symbol)));
    }
  }, [data]);

  const handleTokenToggle = (symbol) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!data?.feesByToken) return;

    // Get date range based on timeRange
    const endDate = startOfDay(new Date());
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const startDate = subDays(endDate, days);

    console.log(`Generating data points for ${timeRange}`);

    // Initialize data points for all dates
    const dateMap = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      dateMap[dateStr] = {
        date: dateStr,
        ...Object.fromEntries(selectedTokens.map(token => [`${token}_amount`, 0]))
      };
    }

    // Process fees for each token
    data.feesByToken.forEach(tokenData => {
      if (!tokenData.dailyFees) return;

      console.log(`Processing ${tokenData.symbol}:`, {
        totalAmount: tokenData.totalAmountUI,
        dailyFeesCount: tokenData.dailyFees.length,
        dailyFees: tokenData.dailyFees
      });

      tokenData.dailyFees.forEach(dailyFee => {
        const { date, amountUI } = dailyFee;
        if (date in dateMap && selectedTokens.includes(tokenData.symbol)) {
          const feeAmount = parseFloat(amountUI);
          if (!isNaN(feeAmount)) {
            dateMap[date][`${tokenData.symbol}_amount`] = feeAmount;
            console.log(`Added ${tokenData.symbol} fee for ${date}: ${feeAmount}`);
          }
        }
      });
    });

    // Convert to array and sort by date
    const chartData = Object.values(dateMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    console.log('Final processed data:', chartData);

    setProcessedData(chartData);
  }, [data, timeRange, selectedTokens]);

  const formatDate = (dateStr) => {
    return timeRange === '24h' 
      ? format(new Date(dateStr), 'HH:mm')
      : format(new Date(dateStr), 'MMM d');
  };

  const formatValue = (value) => {
    if (value === 0) return '0.00';
    if (typeof value !== 'number') return '0.00';
    
    if (value < 0.0001) {
      return value.toExponential(2);
    } else if (value < 1) {
      return value.toFixed(4);
    } else {
      return value.toFixed(2);
    }
  };

  if (!data?.feesByToken || data.feesByToken.length === 0) {
    return (
      <div className={styles.chartWrapper}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Fee Collection ({timeRange})</h3>
          <button className={styles.scaleToggle}>Log Scale</button>
        </div>
        <div className={styles.noData}>No data available for the selected time range</div>
      </div>
    );
  }

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Fee Collection ({timeRange})</h3>
        <button
          className={styles.scaleToggle}
          onClick={() => setUseLogScale(!useLogScale)}
        >
          {useLogScale ? 'Linear Scale' : 'Log Scale'}
        </button>
      </div>
      
      <div className={styles.tokenButtons}>
        {data.feesByToken.map((token) => (
          <button
            key={token.symbol}
            onClick={() => handleTokenToggle(token.symbol)}
            className={`${styles.tokenButton} ${
              !visibleTokens.has(token.symbol) ? styles.inactive : ''
            }`}
            style={{
              backgroundColor: visibleTokens.has(token.symbol)
                ? COLORS[data.feesByToken.indexOf(token) % COLORS.length]
                : undefined,
              color: visibleTokens.has(token.symbol) ? '#ffffff' : undefined
            }}
          >
            {token.symbol}
          </button>
        ))}
      </div>
      
      <div className={styles.chartContainer}>
        {processedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={formatValue}
                scale={useLogScale ? 'log' : 'linear'}
                domain={useLogScale ? ['auto', 'auto'] : [0, 'auto']}
              />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value, name) => [
                  formatValue(value),
                  name.replace('_amount', '')
                ]}
              />
              <Legend formatter={(value) => value.replace('_amount', '')} />
              {selectedTokens.map((token, index) => (
                <Line
                  key={token}
                  type="monotone"
                  dataKey={`${token}_amount`}
                  stroke={COLORS[data.feesByToken.findIndex(t => t.symbol === token) % COLORS.length]}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.noData}>
            No data available for the selected time range
          </div>
        )}
      </div>
    </div>
  );
} 