/**
 * Mock Components for Page Testing
 *
 * This file contains a collection of mock components that are frequently used in page tests.
 * These components provide simplified versions that focus on testing key interactions
 * rather than implementation details.
 */

/**
 * Mock SearchInput component
 * @param {Object} props Component props
 * @param {string} props.value Current input value
 * @param {Function} props.onChange Change handler function
 * @returns {JSX.Element} Mock SearchInput component
 */
export const SearchInput = ({ value, onChange, placeholder }) => (
  <input
    data-testid="search-input"
    value={value || ''}
    placeholder={placeholder || 'Search...'}
    onChange={(e) => onChange(e.target.value)}
  />
);

/**
 * Mock PoolComparisonTable component
 * @param {Object} props Component props
 * @param {Array} props.pools Array of pool objects to compare
 * @param {string} props.timeframe Selected timeframe for comparison
 * @param {Function} props.onRemovePool Function to remove a pool from comparison
 * @returns {JSX.Element} Mock PoolComparisonTable component
 */
export const PoolComparisonTable = ({ pools, timeframe, onRemovePool }) => (
  <div data-testid="pool-comparison-table">
    <div>
      Comparing {pools.length} pools for timeframe: {timeframe}
    </div>
    <table>
      <thead>
        <tr>
          <th>Pool</th>
          <th>TVL</th>
          <th>Volume</th>
          <th>Fee</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pools.map((pool) => (
          <tr key={pool.address} data-testid={`pool-row-${pool.address}`}>
            <td>
              {pool.tokenA.symbol}/{pool.tokenB.symbol}
            </td>
            <td>${(pool.tvl_usdc / 1000000).toFixed(2)}M</td>
            <td>
              ${((pool.stats[timeframe]?.volume || 0) / 1000000).toFixed(2)}M
            </td>
            <td>{pool.fee_rate / 100}%</td>
            <td>
              <button
                data-testid={`remove-pool-${pool.address}`}
                onClick={() => onRemovePool && onRemovePool(pool.address)}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Mock PoolStatsCard component
 * @param {Object} props Component props
 * @param {Object} props.pool Pool object to display
 * @param {string} props.timeframe Selected timeframe for statistics
 * @returns {JSX.Element} Mock PoolStatsCard component
 */
export const PoolStatsCard = ({ pool, timeframe }) => (
  <div
    data-testid={`pool-stats-${pool.address}`}
    data-pool-id={pool.address}
    data-timeframe={timeframe}
  >
    <h2>
      {pool.tokenA.symbol}/{pool.tokenB.symbol} Pool
    </h2>
    <div className="stats-container">
      <div className="stat-item">
        <div className="stat-label">TVL</div>
        <div className="stat-value">
          ${(pool.tvl_usdc / 1000000).toFixed(2)}M
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Fee Rate</div>
        <div className="stat-value">{pool.fee_rate / 100}%</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Provider</div>
        <div className="stat-value">{pool.provider}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Volume ({timeframe})</div>
        <div className="stat-value">
          ${((pool.stats[timeframe]?.volume || 0) / 1000000).toFixed(2)}M
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Fees ({timeframe})</div>
        <div className="stat-value">${pool.stats[timeframe]?.fees || 0}</div>
      </div>
    </div>
  </div>
);

/**
 * Mock PoolDropdown component
 * @param {Object} props Component props
 * @param {Array} props.pools Array of available pools
 * @param {Array} props.selectedPools Array of selected pool addresses
 * @param {Function} props.onSelectPool Function called when a pool is selected
 * @returns {JSX.Element} Mock PoolDropdown component
 */
export const PoolDropdown = ({ pools, selectedPools, onSelectPool }) => (
  <div data-testid="pool-dropdown">
    <select
      data-testid="pool-select"
      onChange={(e) => onSelectPool(e.target.value)}
    >
      <option value="">Select a pool</option>
      {pools
        .filter((p) => !selectedPools.includes(p.address))
        .map((pool) => (
          <option key={pool.address} value={pool.address}>
            {pool.tokenA.symbol}/{pool.tokenB.symbol}
          </option>
        ))}
    </select>
  </div>
);

/**
 * Mock PoolPriceChart component
 * @param {Object} props Component props
 * @param {Object} props.pool Pool object to display data for
 * @param {string} props.timeframe Selected timeframe for chart
 * @returns {JSX.Element} Mock PoolPriceChart component
 */
export const PoolPriceChart = ({ pool, timeframe }) => (
  <div data-testid="pool-price-chart">
    <div>
      Chart for {pool.tokenA.symbol}/{pool.tokenB.symbol}
    </div>
    <div>Timeframe: {timeframe}</div>
  </div>
);

/**
 * Mock PoolVolumeChart component
 * @param {Object} props Component props
 * @param {Object} props.pool Pool object to display data for
 * @param {string} props.timeframe Selected timeframe for chart
 * @returns {JSX.Element} Mock PoolVolumeChart component
 */
export const PoolVolumeChart = ({ pool, timeframe }) => (
  <div data-testid="pool-volume-chart">
    <div>
      Volume Chart for {pool.tokenA.symbol}/{pool.tokenB.symbol}
    </div>
    <div>Timeframe: {timeframe}</div>
  </div>
);

// Add a test to prevent the "no tests" error
describe('Test Components', () => {
  it('exports mock components for testing', () => {
    expect(typeof SearchInput).toBe('function');
    expect(typeof PoolComparisonTable).toBe('function');
    expect(typeof PoolStatsCard).toBe('function');
    expect(typeof PoolDropdown).toBe('function');
    expect(typeof PoolPriceChart).toBe('function');
    expect(typeof PoolVolumeChart).toBe('function');
  });
});
