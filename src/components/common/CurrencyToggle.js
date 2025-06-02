import React from 'react';
import { useDisplayCurrency } from '../../contexts/DisplayCurrencyContext';
import styles from './CurrencyToggle.module.scss';

export const CurrencyToggle = () => {
  const { showInSol, toggleCurrency, currentCurrency } = useDisplayCurrency();

  return (
    <button 
      onClick={toggleCurrency} 
      className={styles.toggleButton}
      aria-live="polite"
      title={`Switch to ${showInSol ? 'USD' : 'TOKENS'}`}
      data-tooltip={`Click to switch to ${showInSol ? 'USD' : 'TOKENS'}`}
    >
      Display: {currentCurrency}
    </button>
  );
}; 