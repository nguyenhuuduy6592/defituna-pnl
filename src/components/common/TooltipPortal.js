import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/TooltipPortal.module.scss';

/**
 * Tooltip component that renders content in a portal with positioning relative to a target element
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Content to display in the tooltip
 * @param {React.RefObject} props.targetRef Reference to the target element
 * @param {boolean} props.show Whether to show the tooltip
 * @param {'top'|'bottom'} props.position Position of the tooltip relative to the target element
 */
export const TooltipPortal = ({ 
  children, 
  targetRef, 
  show, 
  position = 'top' 
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [portalContainer] = useState(() => document.createElement('div'));

  // Setup portal container
  useEffect(() => {
    document.body.appendChild(portalContainer);
    return () => {
      document.body.removeChild(portalContainer);
    };
  }, [portalContainer]);

  // Calculate and update tooltip position
  const updatePosition = useCallback(() => {
    if (!targetRef.current) return;

    const rect = targetRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.top + scrollTop;
    let left = rect.left + (rect.width / 2) + scrollLeft;

    // Adjust position based on the specified position prop
    if (position === 'top') {
      top -= 10; // Add some spacing
    } else if (position === 'bottom') {
      top += rect.height + 10;
    }

    setTooltipPosition({ top, left });
  }, [targetRef, position]);

  // Handle position updates
  useEffect(() => {
    if (!show) return;
    
    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [show, updatePosition]);

  if (!show) return null;

  // Get transform style based on position
  const getTransformStyle = () => {
    return position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
  };

  return createPortal(
    <div 
      className={styles.tooltipContainer}
      style={{
        position: 'absolute',
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        transform: getTransformStyle()
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className={`${styles.tooltip} ${styles[position]}`}>
        {children}
      </div>
    </div>,
    portalContainer
  );
}; 