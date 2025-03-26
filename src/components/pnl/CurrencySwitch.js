export const CurrencySwitch = ({ isSol, setIsSol }) => {
  return (
    <div className="switch-container">
      <span>USD</span>
      <label className="switch">
        <input type="checkbox" checked={isSol} onChange={e => setIsSol(e.target.checked)} />
        <span className="slider"></span>
      </label>
      <span>SOL</span>
    </div>
  );
};