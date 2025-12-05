import styles from '../../styles/TimeframeSelector.module.scss';

/**
 * TimeframeSelector component for selecting time periods
 * @param {Object} props - Component props
 * @param {Array} props.timeframes - Array of timeframe options (e.g. ['24h', '7d', '30d'])
 * @param {string} props.selected - Currently selected timeframe
 * @param {Function} props.onChange - Callback function when timeframe changes
 * @returns {JSX.Element} TimeframeSelector component
 */
export default function TimeframeSelector({
  timeframes = ['24h', '7d', '30d'],
  selected = '24h',
  onChange,
}) {
  return (
    <div className={styles.timeframeSelector}>
      {timeframes.map((timeframe) => (
        <button
          key={timeframe}
          className={`${styles.timeframeButton} ${selected === timeframe ? styles.active : ''}`}
          onClick={() => onChange(timeframe)}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
}
