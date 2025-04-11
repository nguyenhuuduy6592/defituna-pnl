import React from 'react';
import { BsPlusCircle, BsDashCircle } from 'react-icons/bs';
import { useComparison } from '@/contexts/ComparisonContext';
import styles from '@/styles/CompareButton.module.scss';

/**
 * Button component for adding/removing pools to/from comparison
 * @param {Object} props Component props
 * @param {Object} props.pool Pool object to add to comparison
 * @returns {JSX.Element} Rendered component
 */
export default function CompareButton({ pool }) {
  const { isInComparison, addPoolToComparison, removePoolFromComparison } = useComparison();
  
  const inComparison = isInComparison(pool.address);
  
  const handleClick = (e) => {
    e.preventDefault(); // Prevent navigating to pool detail
    e.stopPropagation(); // Prevent event bubbling
    
    if (inComparison) {
      removePoolFromComparison(pool.address);
    } else {
      addPoolToComparison(pool);
    }
  };
  
  return (
    <button
      className={`${styles.compareButton} ${inComparison ? styles.active : ''}`}
      onClick={handleClick}
      title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
      aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
    >
      <span className={styles.icon}>
        {inComparison ? <BsDashCircle /> : <BsPlusCircle />}
      </span>
      <span className={styles.text}>
        {inComparison ? 'Remove' : 'Compare'}
      </span>
    </button>
  );
} 