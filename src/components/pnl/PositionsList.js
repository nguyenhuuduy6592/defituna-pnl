import { memo, useState, useMemo } from 'react';
import styles from './PositionsList.module.scss';
import { PnLCard } from './PnLCard';
import { PositionChart } from './PositionChart';
import { PositionsTable } from './PositionsTable';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { 
  calculatePnlPercentage, 
  calculateStatus, 
  getAdjustedPosition, 
  sortPositions 
} from '../../utils';
import { useSortState } from '../../hooks/useSortState';
import { useInvertedPairs } from '../../hooks/useInvertedPairs';

export const PositionsList = memo(({ positions, showWallet = false, historyEnabled }) => {
  // Custom hooks
  const { sortState, handleSort } = useSortState('age', 'desc');
  const { invertedPairs, handlePairInversion, isInverted } = useInvertedPairs();
  const { getPositionHistory } = useHistoricalData();
  
  // Local state
  const [selectedState, setSelectedState] = useState({
    position: null,
    chartPosition: null
  });

  // Handlers
  const handleShowChart = async (position) => {
    const positionId = `${position.pair}-${position.positionAddress}`;
    const history = await getPositionHistory(positionId);
    setSelectedState(prev => ({ ...prev, chartPosition: { ...position, history } }));
  };

  // Memoized data processing
  const processedPositions = useMemo(() => {
    if (!positions) return [];

    const sorted = sortPositions(positions, sortState.field, sortState.direction);
    
    return sorted.map(position => {
      const inverted = invertedPairs.has(position.pair);
      const adjusted = getAdjustedPosition(position, inverted);
      
      return {
        ...adjusted,
        displayStatus: calculateStatus(position),
        displayPnlPercentage: calculatePnlPercentage(position.pnl?.bps)
      };
    });
  }, [positions, sortState.field, sortState.direction, invertedPairs]);

  if (!positions || positions.length === 0) {
    return <div className={styles.noData}>No positions found</div>;
  }

  return (
    <div className={styles.positionsContainer}>
      <PositionsTable
        positions={processedPositions}
        showWallet={showWallet}
        historyEnabled={historyEnabled}
        sortState={sortState}
        onSort={handleSort}
        isInverted={isInverted}
        onPairInversion={handlePairInversion}
        onShare={(position) => setSelectedState(prev => ({ ...prev, position }))}
        onShowChart={handleShowChart}
      />

      {selectedState.position && (
        <PnLCard
          position={selectedState.position}
          onClose={() => setSelectedState(prev => ({ ...prev, position: null }))}
        />
      )}

      {selectedState.chartPosition && (
        <PositionChart
          positionHistory={selectedState.chartPosition.history}
          onClose={() => setSelectedState(prev => ({ ...prev, chartPosition: null }))}
        />
      )}
    </div>
  );
});