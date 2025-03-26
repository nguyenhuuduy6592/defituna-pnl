export const PositionsList = ({ positions, isSol }) => {
  const formatNumber = (num) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const formatDuration = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getStateClass = (state) => {
    switch (state) {
      case 'open': return 'state-open';
      case 'closed': return 'state-closed';
      case 'liquidated': return 'state-liquidated';
      default: return '';
    }
  };

  return (
    <div className="position">
      <table className="table">
        <thead>
          <tr>
            <th>Pair</th>
            <th>State</th>
            <th>Age</th>
            <th>Yield</th>
            <th>Compounded</th>
            <th>Debt Change</th>
            <th>PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => (
            <tr key={i}>
              <td>{p.pair}</td>
              <td className={getStateClass(p.state)}>{p.state}</td>
              <td>{formatDuration(p.age)}</td>
              <td className={p.yield > 0 ? 'positive' : p.yield < 0 ? 'negative' : 'zero'}>
                {formatNumber(p.yield)} {isSol ? 'SOL' : 'USD'}
              </td>
              <td className={p.compounded > 0 ? 'positive' : p.compounded < 0 ? 'negative' : 'zero'}>
                {formatNumber(p.compounded)} {isSol ? 'SOL' : 'USD'}
              </td>
              <td className={p.debt > 0 ? 'positive' : p.debt < 0 ? 'negative' : 'zero'}>
                {formatNumber(p.debt)} {isSol ? 'SOL' : 'USD'}
              </td>
              <td className={p.pnl > 0 ? 'positive' : p.pnl < 0 ? 'negative' : 'zero'}>
                {formatNumber(p.pnl)} {isSol ? 'SOL' : 'USD'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};