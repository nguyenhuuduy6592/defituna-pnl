export const PositionsList = ({ positions, isSol, formatValue }) => {
  return (
    <>
      {positions.map((pos, i) => (
        <div key={i} className="position">
          <h3>Position {i + 1}: {pos.pair} (<span className={pos.state === 'open' ? 'positive' : 'negative'}>{pos.state}</span>)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Amount {isSol ? '(SOL)' : '($)'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Yield</td>
                <td className={pos.yield > 0 ? 'positive' : pos.yield < 0 ? 'negative' : 'zero'}>
                  {formatValue(pos.yield)}
                </td>
              </tr>
              <tr>
                <td>Compounded</td>
                <td className={pos.compounded > 0 ? 'positive' : pos.compounded < 0 ? 'negative' : 'zero'}>
                  {formatValue(pos.compounded)}
                </td>
              </tr>
              <tr>
                <td>Debt</td>
                <td className={pos.debt > 0 ? 'positive' : pos.debt < 0 ? 'negative' : 'zero'}>
                  {formatValue(pos.debt)}
                </td>
              </tr>
              <tr>
                <td>PnL</td>
                <td className={pos.pnl > 0 ? 'positive' : pos.pnl < 0 ? 'negative' : 'zero'}>
                  {formatValue(pos.pnl)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
};