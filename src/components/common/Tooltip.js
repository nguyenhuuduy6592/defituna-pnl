import { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.scss';

/**
 * Tooltip component that displays additional information on hover (desktop) or tap (mobile)
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children The element that triggers the tooltip
 * @param {React.ReactNode} props.content The content to display in the tooltip
 * @param {string} [props.position='bottom'] Position of the tooltip - 
 *   Basic positions: 'top', 'right', 'bottom', 'left'
 *   Extended positions: 'bottom-center', 'top-center', 'right-center', 'left-center'
 */
export const Tooltip = ({ children, content, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  
  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isVisible) return;
    
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);
  
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(!isVisible);
  };
  
  // Validate position value and map to CSS class
  const validPositions = [
    'top', 'right', 'bottom', 'left',
    'bottom-center', 'top-center', 'right-center', 'left-center'
  ];
  const positionClass = validPositions.includes(position) ? position : 'bottom';
  
  return (
    <div 
      className={`${styles.tooltipContainer} ${isVisible ? styles.active : ''}`}
      ref={tooltipRef}
    >
      <div 
        className={styles.tooltipTrigger}
        onClick={handleToggle}
        onTouchEnd={handleToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isVisible}
        aria-label="Show tooltip"
      >
        {children}
      </div>
      <div 
        className={`${styles.tooltip} ${styles[positionClass]} ${isVisible ? styles.visible : ''}`} 
        role="tooltip" 
        aria-live="polite"
      >
        {content}
      </div>
    </div>
  );
};