import { calculateStatus } from './positionUtils';

export const SORT_FIELD_CONFIG = {
  pnl: (position) => position?.pnl?.usd || 0,
  yield: (position) => position?.yield?.usd || 0,
  status: (position) => calculateStatus(position),
  pair: (position) => String(position?.pair || ''),
  state: (position) => String(position?.state || ''),
  walletAddress: (position) => String(position?.walletAddress || ''),
  age: (position) => position?.age,
  size: (position) => Number(position?.size || 0),
};

export const sortPositions = (positions, sortField, sortDirection) => {
  if (!positions || positions.length <= 1) {
    return positions;
  }

  return [...positions].sort((a, b) => {
    const getValue = SORT_FIELD_CONFIG[sortField];
    let aValue = getValue ? getValue(a) : a[sortField];
    let bValue = getValue ? getValue(b) : b[sortField];

    // Special handling for age
    if (sortField === 'age') {
      aValue = a.age ?? (sortDirection === 'asc' ? Infinity : -Infinity);
      bValue = b.age ?? (sortDirection === 'asc' ? Infinity : -Infinity);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // String comparison
    if (['pair', 'state', 'walletAddress', 'status'].includes(sortField)) {
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    }

    // Default numeric comparison
    aValue = Number(aValue || 0);
    bValue = Number(bValue || 0);
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
};
