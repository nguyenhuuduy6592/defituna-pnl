import { memo } from 'react';
import { format } from 'date-fns';
import styles from './TransactionsTable.module.scss';
import { formatWalletAddress } from '../../utils'; // Import address formatter
import tunaIdl from '../../idl/tuna_idl.json';

/**
 * Formats a Unix timestamp (seconds) into a readable date/time string.
 * @param {number} timestamp - Unix timestamp in seconds.
 * @returns {string} Formatted date string.
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    // Convert seconds to milliseconds
    return format(new Date(timestamp * 1000), 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Gets the tuna position account from the parsed instruction accounts.
 * @param {Object} parsedInfo - The parsed instruction info containing accounts and their metadata
 * @returns {string|null} The tuna position account address or null if not found
 */
const getTunaPositionAccount = (parsedInfo) => {
  if (!parsedInfo?.ixName || !parsedInfo?.accounts || !Array.isArray(parsedInfo.accounts)) {
    return null;
  }

  // Find the instruction in the IDL
  const instruction = tunaIdl.instructions.find(ix => ix.name === parsedInfo.ixName);
  if (!instruction) {
    console.log('Unknown instruction:', parsedInfo.ixName);
    return null;
  }

  // Find the index of the tuna_position account in the instruction's accounts
  const positionIndex = instruction.accounts.findIndex(acc => acc.name === 'tuna_position');
  if (positionIndex === -1) {
    return null;
  }

  // Return the corresponding account address
  return parsedInfo.accounts[positionIndex] || null;
};

/**
 * Basic table header for transactions, adding Position column.
 */
const TableHeader = memo(() => (
  <thead>
    <tr>
      <th>Date</th>
      <th>Type</th>
      <th>Position</th> 
      <th>Signature</th>
      <th>Status</th>
    </tr>
  </thead>
));
TableHeader.displayName = 'TransactionsTableHeader';

/**
 * Formats instruction names for display.
 */
const formatIxName = (name) => {
  if (!name) return 'N/A';
  // Remove _orca suffix and capitalize words
  return name.replace('_orca', '')
             .split('_')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
};

/**
 * Renders a single transaction row, handling loading state and parsed data.
 */
const TransactionRow = memo(({ transaction }) => {
  const signature = transaction?.signature || 'N/A';
  const isLoading = transaction?.loading;
  
  const parsedInfo = transaction?.parsed;
  
  // Get the transaction type from the parsed instruction name
  const txType = isLoading ? '-' : formatIxName(parsedInfo?.ixName);
  
  // Get the position account by searching through the accounts metadata
  const tunaPosition = !isLoading ? getTunaPositionAccount(parsedInfo) : null;

  let status = transaction?.status || 'N/A';
  let statusClass = styles.statusLoading;
  
  if (status === 'Success') {
    statusClass = styles.statusSuccess;
  } else if (status === 'Failed') {
    statusClass = styles.statusFailed;
  }
  
  const timestamp = transaction?.blockTime;

  return (
    <tr className={isLoading ? styles.loadingRow : ''}>
      <td>{formatTimestamp(timestamp)}</td>
      <td>{txType}</td>
      <td title={tunaPosition || ''}>{tunaPosition ? formatWalletAddress(tunaPosition) : (isLoading ? '-' : 'N/A')}</td>
      <td className={styles.signatureCell}>
        {signature !== 'N/A' ? 
          <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noopener noreferrer">
            {signature.slice(0, 8)}...
          </a> 
          : '-'
        }
      </td>
      <td className={statusClass}>{status}</td>
    </tr>
  );
});
TransactionRow.displayName = 'TransactionRow';

/**
 * A table component to display a list of transactions, supporting progressive loading.
 * 
 * @param {Object} props Component props
 * @param {Array<Object>} props.transactions - Array of transaction detail objects (potentially with loading/parsed flags).
 * @param {boolean} props.isLoading - Flag indicating overall loading state (signatures or details).
 * @param {number} props.totalSignatures - Total number of signatures being processed.
 */
export const TransactionsTable = memo(({ transactions, isLoading, totalSignatures }) => {

  // Combine transactions (which are only loaded+filtered ones) with placeholders if still loading
  // Note: The logic in TransactionHistory already provides placeholders, so this might be redundant
  // depending on how combinedAndFilteredTransactions is structured. Let's assume transactions includes placeholders.

  // Sort transactions primarily by blockTime descending (newest first)
  // If blockTime is missing (shouldn't happen with placeholders), keep original order
  const sortedTransactions = [...transactions].sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));

  if (!isLoading && totalSignatures === 0) {
    return <div className={styles.noData}>No recent transactions found.</div>; 
  }
  
  // If loading signatures initially and have no rows yet, show minimal loading state or nothing
  if (isLoading && sortedTransactions.length === 0 && totalSignatures === 0) {
       return <div className={styles.noData}>Loading signatures...</div>; // Or just null
  }

  return (
    <div className={styles.transactionsContainer}> 
      <table className={styles.transactionsTable}>
        <TableHeader />
        <tbody>
          {sortedTransactions.map((tx, index) => (
            <TransactionRow key={tx.signature || `loading-${index}`} transaction={tx} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

TransactionsTable.displayName = 'TransactionsTable'; 