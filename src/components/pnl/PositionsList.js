import { memo, useState, useMemo, useCallback } from 'react';
import styles from './PositionsList.module.scss';
import { PnLCard } from './PnLCard';
import { PositionChart } from './PositionChart';
import { PositionsTable } from './PositionsTable';
import { 
  useHistoricalData, 
  useSortState, 
  useInvertedPairs 
} from '../../hooks';
import { 
  calculateStatus, 
  getAdjustedPosition, 
  sortPositions,
  invertPairString
} from '../../utils';

/**
 * Empty state component when no positions are available
 */
const NoPositions = memo(() => (
  <div className={styles.noData} role="status" aria-live="polite">
    No positions found
  </div>
));

NoPositions.displayName = 'NoPositions';

/**
 * Component that renders a list of positions with sorting, filtering, and detailed views
 * 
 * @param {Object} props Component props
 * @param {Array} props.positions List of position objects to display
 * @param {boolean} props.showWallet Whether to show wallet addresses
 * @param {boolean} props.historyEnabled Whether position history feature is enabled
 */
export const PositionsList = memo(({ 
  positions, 
  showWallet = false, 
  historyEnabled = false 
}) => {
  // Custom hooks for state management
  const { sortState, handleSort } = useSortState('age', 'desc');
  const { invertedPairs, handlePairInversion, isInverted } = useInvertedPairs();
  const { getPositionHistory } = useHistoricalData();
  
  // Local state for modal dialogs
  const [selectedState, setSelectedState] = useState({
    position: null,     // Selected position for PnL card
    chartPosition: null // Selected position for chart view
  });

  // Handler for showing the position chart
  const handleShowChart = useCallback(async (position) => {
    const positionId = `${position.pair}-${position.positionAddress}`;
    const history = await getPositionHistory(positionId);
    setSelectedState(prev => ({ 
      ...prev, 
      chartPosition: { ...position, history } 
    }));
  }, [getPositionHistory]);

  // Handler for showing the PnL card
  const handleShowCard = useCallback((position) => {
    // Make sure we show the pair in the same order as in the table
    // If the pair is inverted in the table, use the inverted display
    const isPairInverted = isInverted(position.pair);
    const adjustedPosition = {
      ...position,
      // If we don't preserve the display format, the PnL card will show a different order
      pairDisplay: isPairInverted ? invertPairString(position.pair) : position.pair,
    };
    
    setSelectedState(prev => ({ ...prev, position: adjustedPosition }));
  }, [isInverted]);

  // Handlers for closing modals
  const handleCloseCard = useCallback(() => {
    setSelectedState(prev => ({ ...prev, position: null }));
  }, []);

  const handleCloseChart = useCallback(() => {
    setSelectedState(prev => ({ ...prev, chartPosition: null }));
  }, []);

  // Process and prepare positions data with memoization
  const processedPositions = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    // Sort positions based on current sort state
    const sorted = sortPositions(
      positions, 
      sortState.field, 
      sortState.direction
    );
    
    // Process each position with display-specific data
    return sorted.map(position => {
      const inverted = invertedPairs.has(position.pair);
      const adjusted = getAdjustedPosition(position, inverted);
      
      return {
        ...adjusted,
        displayStatus: calculateStatus(position),
      };
    });
  }, [positions, sortState.field, sortState.direction, invertedPairs]);

  // Return empty state if no positions
  if (!positions || positions.length === 0) {
    return <NoPositions />;
  }

  return (
    <div 
      className={styles.positionsContainer}
      aria-label="Positions list and details"
    >
      <PositionsTable
        positions={processedPositions}
        showWallet={showWallet}
        historyEnabled={historyEnabled}
        sortState={sortState}
        onSort={handleSort}
        isInverted={isInverted}
        onPairInversion={handlePairInversion}
        onShare={handleShowCard}
        onShowChart={handleShowChart}
      />

      {selectedState.position && (
        <PnLCard
          position={selectedState.position}
          onClose={handleCloseCard}
        />
      )}

      {selectedState.chartPosition && (
        <PositionChart
          position={selectedState.chartPosition}
          positionHistory={selectedState.chartPosition.history}
          onClose={handleCloseChart}
        />
      )}
    </div>
  );
});