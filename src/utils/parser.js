import { BorshInstructionCoder } from '@coral-xyz/anchor';
import tunaIdl from '../idl/tuna_idl.json'; // Import the IDL

// Initialize the Coder
const instructionCoder = new BorshInstructionCoder(tunaIdl);

// DeFiTuna Program ID (already defined in helius.js, consider moving to a constants file)
const DEFITUNA_PROGRAM_ID = 'tuna4uSQZncNeeiAMKbstuxA9CUkHH6HmC64wgmnogD';

// Basic instruction types we care about for Phase 1
const RELEVANT_IX_NAMES = [
  'open_position_orca', 
  'close_position_orca', 
  'liquidate_position_orca', 
  'add_liquidity_orca', 
  'remove_liquidity_orca'
  // Add others like collect_fees, repay_debt later if needed
];

/**
 * Parses a transaction detail object to find and decode the primary DeFiTuna instruction.
 * 
 * @param {object} transactionDetail - The transaction detail object from Helius/Cache.
 * @returns {object|null} An object containing parsed info ({ ixName, accounts }) or null if no relevant instruction found.
 */
export function parseTunaTransaction(transactionDetail) {
  if (!transactionDetail?.transaction?.message?.instructions || !transactionDetail?.transaction?.message?.accountKeys) {
    return null;
  }

  const accountKeys = transactionDetail.transaction.message.accountKeys.map(k => k.pubkey || k);
  const instructions = transactionDetail.transaction.message.instructions;
  const loadedAddresses = transactionDetail.meta?.loadedAddresses;
  
  // If we have loaded addresses, merge them with accountKeys
  let allAccountKeys = [...accountKeys];
  if (loadedAddresses) {
    if (loadedAddresses.writable) {
      allAccountKeys = allAccountKeys.concat(loadedAddresses.writable);
    }
    if (loadedAddresses.readonly) {
      allAccountKeys = allAccountKeys.concat(loadedAddresses.readonly);
    }
  }

  // Look for DeFiTuna program instruction
  for (const ix of instructions) {
    const programIdIndex = ix.programIdIndex;
    if (programIdIndex === undefined || programIdIndex >= allAccountKeys.length) {
      continue;
    }
    
    const programId = allAccountKeys[programIdIndex];
    
    if (programId === DEFITUNA_PROGRAM_ID) {
      try {
        // Try to decode the instruction
        const decodedIx = instructionCoder.decode(ix.data, 'base58');
        
        if (!decodedIx) {
          // If we can't decode, try to get the instruction name from logs
          const logs = transactionDetail.meta?.logMessages || [];
          for (const log of logs) {
            if (log.includes('Instruction:')) {
              const match = log.match(/Instruction: (\w+)/);
              if (match && match[1]) {
                const ixName = match[1].toLowerCase();
                // Map account indices to actual addresses
                const resolvedAccounts = ix.accounts.map(accIndex => 
                  (accIndex >= 0 && accIndex < allAccountKeys.length) ? allAccountKeys[accIndex] : null
                ).filter(Boolean);

                return {
                  ixName: ixName,
                  accounts: resolvedAccounts,
                  data: null
                };
              }
            }
          }
        } else {
          // Successfully decoded the instruction
          const resolvedAccounts = ix.accounts.map(accIndex => 
            (accIndex >= 0 && accIndex < allAccountKeys.length) ? allAccountKeys[accIndex] : null
          ).filter(Boolean);

          return {
            ixName: decodedIx.name,
            accounts: resolvedAccounts,
            data: decodedIx.data
          };
        }
      } catch (e) {
        // If decoding fails, try to get instruction name from logs
        const logs = transactionDetail.meta?.logMessages || [];
        for (const log of logs) {
          if (log.includes('Instruction:')) {
            const match = log.match(/Instruction: (\w+)/);
            if (match && match[1]) {
              const ixName = match[1].toLowerCase();
              // Map account indices to actual addresses
              const resolvedAccounts = ix.accounts.map(accIndex => 
                (accIndex >= 0 && accIndex < allAccountKeys.length) ? allAccountKeys[accIndex] : null
              ).filter(Boolean);

              return {
                ixName: ixName,
                accounts: resolvedAccounts,
                data: null
              };
            }
          }
        }
      }
    }
  }

  return null;
} 