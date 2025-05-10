const SOLANA_MAINNET_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

export async function getFirstTransactionTimestamp(address) {
  try {
    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [
        address,
        {
          limit: 1000, // Fetch up to 1000, a common limit
          commitment: 'confirmed',
        },
      ],
    };

    const response = await fetch(SOLANA_MAINNET_RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error fetching signatures for address ${address}: ${response.status} ${response.statusText}`,
        errorText
      );
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error(
        `RPC Error for getSignaturesForAddress for ${address}:`,
        data.error
      );
      return null;
    }

    const signatures = data.result;
    if (!signatures || signatures.length === 0) {
      // console.log('No transactions found for this address via RPC:', address);
      return null;
    }

    // Signatures are ordered from newest to oldest.
    // We need the one with the smallest blockTime.
    // Some transactions might not have blockTime, so filter them out.
    const oldestTx = signatures
      .filter(sig => sig.blockTime !== null && typeof sig.blockTime !== 'undefined')
      .reduce((earliest, current) => {
        return !earliest || current.blockTime < earliest.blockTime ? current : earliest;
      }, null);

    if (!oldestTx) {
      // console.log(
      //   'Could not determine the oldest transaction with a valid blockTime via RPC:',
      //   address
      // );
      return null;
    }

    const timestamp = oldestTx.blockTime;
    // console.log(
    //   'First transaction timestamp for address',
    //   address,
    //   ':',
    //   new Date(timestamp * 1000)
    // );
    return timestamp; // Return the Unix timestamp (seconds)

  } catch (error) {
    console.error(
      'Network or other error fetching first transaction timestamp for address',
      address,
      ':',
      error
    );
    return null;
  }
} 