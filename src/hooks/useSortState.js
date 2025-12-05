import { useState, useCallback } from 'react';

export const useSortState = (initialField = 'age', initialDirection = 'desc') => {
  const [state, setState] = useState({
    field: initialField,
    direction: initialDirection,
  });

  const handleSort = useCallback((field) => {
    setState(prev => ({
      field,
      direction: field === prev.field ? (prev.direction === 'asc' ? 'desc' : 'asc') : prev.direction,
    }));
  }, []);

  const getSortIcon = useCallback((field) => {
    if (field !== state.field) {return '↕';}
    return state.direction === 'asc' ? '↑' : '↓';
  }, [state.field, state.direction]);

  return {
    sortState: state,
    handleSort,
    getSortIcon,
  };
};