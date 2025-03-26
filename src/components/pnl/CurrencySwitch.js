import styles from './CurrencySwitch.module.scss';

export const CurrencySwitch = ({ isSol, setIsSol }) => {
  return (
    <div className={styles.switchContainer}>
      <span>USD</span>
      <label className={styles.switch}>
        <input type="checkbox" checked={isSol} onChange={e => setIsSol(e.target.checked)} />
        <span className={styles.slider}></span>
      </label>
      <span>SOL</span>
    </div>
  );
};