import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './TooltipPortal.module.scss';

export const TooltipPortal = ({ children, targetRef, show, position = 'top' }) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [portalContainer] = useState(() => document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(portalContainer);
    return () => {
      document.body.removeChild(portalContainer);
    };
  }, [portalContainer]);

  useEffect(() => {
    if (!targetRef.current || !show) return;

    const updatePosition = () => {
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
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetRef, show, position]);

  if (!show) return null;

  return createPortal(
    <div 
      className={styles.tooltipContainer}
      style={{
        position: 'absolute',
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        transform: position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
      }}
    >
      <div className={`${styles.tooltip} ${styles[position]}`}>
        {children}
      </div>
    </div>,
    portalContainer
  );
}; 