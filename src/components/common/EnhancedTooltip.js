import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/EnhancedTooltip.module.scss';

/**
 * Enhanced tooltip component with support for rich formatting and sections
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children The element that triggers the tooltip
 * @param {React.ReactNode} props.content The content to display in the tooltip
 * @param {string} [props.position='bottom'] Position of the tooltip
 * @param {string} [props.maxWidth='320px'] Maximum width of the tooltip
 * @param {boolean} [props.interactive=false] Whether the tooltip content can be interacted with
 * @param {boolean} [props.disableHover=false] Whether to disable hover behavior
 */
const EnhancedTooltip = ({ 
  children, 
  content, 
  position = 'bottom', 
  maxWidth = '320px',
  interactive = false,
  disableHover = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const arrowRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  // Close tooltip when clicking outside
  useEffect(() => {
    if (!isVisible) return;
    
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
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

  // Handle escape key to close tooltip
  useEffect(() => {
    if (!isVisible) return;
    
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isVisible]);

  // Position the tooltip
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Default margin from trigger
      const margin = 10;
      
      let top, left;
      let arrowLeft, arrowTop;
      
      switch (position) {
        case 'bottom':
          top = triggerRect.bottom + margin;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          arrowLeft = '50%'; // Center the arrow
          arrowTop = '0';
          break;
        case 'top':
          top = triggerRect.top - tooltipRect.height - margin;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          arrowLeft = '50%';
          arrowTop = 'auto';
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - margin;
          arrowLeft = 'auto';
          arrowTop = '50%';
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + margin;
          arrowLeft = '0';
          arrowTop = '50%';
          break;
        default:
          top = triggerRect.bottom + margin;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          arrowLeft = '50%';
          arrowTop = '0';
      }
      
      // Original left position before viewport adjustments
      const initialLeft = left;
      
      // Ensure tooltip stays within viewport
      if (left < 10) left = 10;
      if (left + tooltipRect.width > viewportWidth - 10) {
        left = viewportWidth - tooltipRect.width - 10;
      }
      
      if (top < 10) top = 10;
      if (top + tooltipRect.height > viewportHeight - 10) {
        top = viewportHeight - tooltipRect.height - 10;
      }
      
      // If the tooltip was adjusted for viewport, update arrow position
      if (position === 'top' || position === 'bottom') {
        // Calculate arrow percentage position if tooltip was shifted
        if (initialLeft !== left) {
          const arrowLeftPx = triggerRect.left + (triggerRect.width / 2) - left;
          // Convert to percentage of tooltip width
          const arrowLeftPercent = (arrowLeftPx / tooltipRect.width) * 100;
          // Clamp to keep arrow within tooltip (with 10px padding)
          const clampedArrowPercent = Math.max(10, Math.min(90, arrowLeftPercent));
          arrowLeft = `${clampedArrowPercent}%`;
        }
      }
      
      setTooltipStyle({
        top: `${top}px`,
        left: `${left}px`,
        maxWidth
      });
      
      setArrowStyle({
        left: arrowLeft,
        top: arrowTop,
        right: position === 'left' ? '0' : 'auto',
        bottom: position === 'top' ? '0' : 'auto',
      });
    };
    
    // Update position immediately and on resize/scroll
    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, position, maxWidth]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(!isVisible);
  };
  
  const handleMouseEnter = () => {
    if (disableHover) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsVisible(true);
  };
  
  const handleMouseLeave = () => {
    if (disableHover) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Add a small delay before hiding to prevent flickering when moving to tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      // Only hide if not hovering over tooltip
      if (tooltipRef.current && !tooltipRef.current.matches(':hover')) {
        setIsVisible(false);
      }
    }, 100);
  };
  
  // Format tooltip content if it's a string
  const formattedContent = typeof content === 'string' ? formatTooltipContent(content) : content;
  
  // Create tooltip portal element
  const tooltipElement = (
    <div 
      className={`${styles.tooltip} ${styles[position]} ${isVisible ? styles.visible : ''} ${interactive ? styles.interactive : ''}`} 
      style={tooltipStyle}
      role="tooltip" 
      aria-live="polite"
      ref={tooltipRef}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
    >
      <div 
        className={styles.tooltipArrow} 
        style={arrowStyle}
        ref={arrowRef}
      />
      <div className={styles.tooltipContent}>
        {formattedContent}
      </div>
    </div>
  );
  
  return (
    <div className={styles.tooltipContainer}>
      <div 
        className={styles.tooltipTrigger}
        onClick={handleToggle}
        onTouchEnd={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-expanded={isVisible}
        aria-label="Show tooltip"
        ref={triggerRef}
      >
        {children}
      </div>
      {isVisible && typeof document !== 'undefined' && 
        createPortal(tooltipElement, document.body)}
    </div>
  );
};

// Helper function to format string content
function formatTooltipContent(content) {
  if (typeof content !== 'string') return content;
  
  // Split by double newlines to find sections
  const sections = content.split(/\n\n+/);
  
  return (
    <>
      {sections.map((section, sectionIndex) => {
        // Check if this section is a title (no bullet points)
        const isTitle = !section.includes('•') && !section.includes('\n');
        
        // First section with newlines is typically a header section
        const isHeaderSection = sectionIndex === 0 && section.includes('\n');
        
        // Handle bullet points by splitting on newlines
        const lines = section.split('\n').filter(line => line.trim());
        
        if (isTitle) {
          return (
            <div key={sectionIndex} className={styles.tooltipTitle}>
              {section}
            </div>
          );
        } else if (isHeaderSection) {
          return (
            <div key={sectionIndex} className={styles.tooltipHeader}>
              {lines.map((line, i) => (
                <div key={i} className={i === 0 ? styles.tooltipHeaderTitle : styles.tooltipHeaderDescription}>
                  {line}
                </div>
              ))}
            </div>
          );
        } else {
          // Check if section has a heading (first line not starting with bullet)
          const hasHeading = lines.length > 0 && !lines[0].trim().startsWith('•');
          
          return (
            <div key={sectionIndex} className={styles.tooltipSection}>
              {hasHeading && (
                <div className={styles.tooltipSectionTitle}>
                  {lines[0]}
                </div>
              )}
              
              <ul className={styles.tooltipList}>
                {lines.slice(hasHeading ? 1 : 0).map((line, i) => (
                  <li key={i}>
                    {line.replace(/^•\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      })}
    </>
  );
}

export default EnhancedTooltip; 