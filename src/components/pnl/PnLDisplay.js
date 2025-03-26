import { CurrencySwitch } from './CurrencySwitch';
import { PositionsList } from './PositionsList';

export const PnLDisplay = ({ data, isSol, setIsSol }) => {
  const formatValue = (val) => {
    const value = isSol ? val : val * data.solPrice;
    return `${value >= 0 ? ' ' : '-'}${Math.abs(value).toFixed(isSol ? 6 : 2)}`.padStart(isSol ? 10 : 8);
  };

  return (
    <>
      <CurrencySwitch isSol={isSol} setIsSol={setIsSol} />
      <h2>Total PnL: <span className={data.totalPnL > 0 ? 'positive' : data.totalPnL < 0 ? 'negative' : 'zero'}>
        {isSol ? `${formatValue(data.totalPnL)} SOL` : `$${formatValue(data.totalPnL)}`}
      </span></h2>
      <p>Current SOL Price: ${data.solPrice.toFixed(2)}</p>
      <hr />
      <PositionsList positions={data.positions} isSol={isSol} formatValue={formatValue} />
    </>
  );
};