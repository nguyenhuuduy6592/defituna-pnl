import styles from './InfoIcon.module.scss';
import EnhancedTooltip from './EnhancedTooltip';

/**
 * InfoIcon component that displays a tooltip when hovered or clicked
 * @param {Object} props Component props
 * @param {string} props.content The content to display in the tooltip
 * @param {string} [props.position='top'] Position of the tooltip
 * @param {string} [props.size='small'] Size of the icon ('small', 'medium', 'large')
 */
const InfoIcon = ({ content, position = 'top', size = 'small' }) => {
  const sizeClass = styles[size] || styles.small;

  return (
    <EnhancedTooltip content={content} position={position}>
      <span className={`${styles.infoIcon} ${sizeClass}`} aria-label="Information">
        i
      </span>
    </EnhancedTooltip>
  );
};

export default InfoIcon;