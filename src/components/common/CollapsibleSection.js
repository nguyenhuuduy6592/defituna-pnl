import { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styles from './CollapsibleSection.module.scss';

/**
 * A collapsible section with a header that can be expanded or collapsed
 *
 * @param {Object} props Component props
 * @param {string} props.title The title to display in the section header
 * @param {ReactNode} props.children The content to display when expanded
 * @param {boolean} props.defaultExpanded Whether the section is expanded by default
 * @param {string} props.storageKey The localStorage key to save the expanded state
 * @param {boolean} props.visible Whether the section is visible at all (if false, returns null)
 * @returns {JSX.Element|null} The collapsible section component or null if not visible
 */
export const CollapsibleSection = ({
  title,
  children,
  defaultExpanded = true,
  storageKey,
  visible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const savedState = localStorage.getItem(storageKey);
      if (savedState !== null) {
        setIsExpanded(savedState === 'true');
      }
    }
  }, [storageKey]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, String(isExpanded));
    }
  }, [isExpanded, storageKey]);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  if (!visible) {return null;}

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader} onClick={toggleExpanded}>
        <div className={styles.sectionTitle}>
          {title}
        </div>
        <FiChevronDown
          className={`${styles.collapseIcon} ${isExpanded ? styles.expanded : ''}`}
        />
      </div>
      <div className={`${styles.sectionContent} ${isExpanded ? styles.expanded : ''}`}>
        {children}
      </div>
    </div>
  );
};