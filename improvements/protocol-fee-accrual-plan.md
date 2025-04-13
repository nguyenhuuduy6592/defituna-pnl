**Plan: Calculate DefiTuna Protocol Fee Accrual**

1.  **Objective:**
    *   Determine the total amount of fees collected by the DefiTuna protocol, broken down by individual token types. This involves identifying the protocol's fee recipient address and summing up all token transfers sent to that address.

2.  **Prerequisites:**
    *   **DefiTuna Program ID:** The public key of the deployed DefiTuna Solana program.
    *   **DefiTuna IDL (`tuna.json`):** The Interface Definition Language file for the DefiTuna program, defining account structures and instruction layouts. ([Link to IDL](https://github.com/DefiTuna/tuna-sdk/blob/main/idl/tuna.json))
    *   **Helius API Key & Access:** Credentials and necessary setup to interact with the Helius API for fetching Solana blockchain data.
    *   **Development Environment:** Node.js environment with necessary libraries (e.g., `@helius-labs/helius-sdk`, `@solana/web3.js`, potentially `@coral-xyz/anchor` for IDL interaction).

3.  **Implementation Steps:**

    *   **Step 1: Identify the `TunaConfig` Account Address**
        *   **Action:** Determine the public key of the main `TunaConfig` account for the DefiTuna protocol.
        *   **Method:** This address is often a Program Derived Address (PDA) derived from known seeds and the Program ID, or it might be a well-known constant address provided by the DefiTuna team. Consult DefiTuna documentation or SDK examples if the derivation method isn't immediately obvious from the IDL. The IDL (`tuna.json`) defines the `TunaConfig` account structure.
        *   **Store:** Save this address as a constant in the implementation.

    *   **Step 2: Fetch `TunaConfig` Account Data**
        *   **Action:** Retrieve the account data for the identified `TunaConfig` address.
        *   **Method:** Use the Helius API (e.g., the `getAccountInfo` RPC method via Helius or a dedicated Helius SDK function) to fetch the raw account data.

    *   **Step 3: Decode `TunaConfig` Data and Extract `fee_recipient`**
        *   **Action:** Parse the raw account data to find the protocol's designated fee recipient address.
        *   **Method:** Use the `TunaConfig` account structure definition from the `tuna.json` IDL (specifically the `accounts` section defining `TunaConfig`) to decode the data fetched in Step 2. Libraries like `@coral-xyz/anchor` can simplify this decoding. Extract the public key stored in the `fee_recipient` field.
        *   **Store:** Save the extracted `fee_recipient` public key.

    *   **Step 4: Fetch Transaction History for `fee_recipient`**
        *   **Action:** Retrieve all relevant transactions involving the `fee_recipient` address.
        *   **Method:** Utilize Helius's transaction history APIs. A recommended approach:
            *   Use the Helius `getTransactions` API or equivalent, filtering by the `fee_recipient` address.
            *   Crucially, focus on *parsed* transaction data, specifically looking for `transfer` instructions (both SPL Token transfers and potentially SOL native transfers if applicable) where the `destination` field matches the `fee_recipient` address. Helius's Parsed Transaction History API is ideal here as it simplifies identifying relevant transfers.
            *   Implement pagination (`before`, `limit` parameters) to handle potentially large transaction histories. Fetch data in batches.

    *   **Step 5: Aggregate Fees per Token**
        *   **Action:** Sum the amounts of each token transferred *to* the `fee_recipient`.
        *   **Method:**
            *   Initialize an empty object/map (e.g., `totalFeesByMint = {}`).
            *   Iterate through the parsed transfer transactions obtained in Step 4.
            *   For each transaction representing a token transfer *to* the `fee_recipient`:
                *   Identify the `mint` address of the token being transferred.
                *   Extract the `amount` transferred (ensure you use the correct amount field, e.g., `tokenAmount.uiAmount` or `amount` depending on the Helius response structure, and consider token decimals for accurate representation).
                *   If the mint address is not yet a key in `totalFeesByMint`, initialize it to 0.
                *   Add the extracted `amount` to `totalFeesByMint[mintAddress]`.

    *   **Step 6: Output/Store Results**
        *   **Action:** Present or store the calculated fee totals.
        *   **Method:** Output the `totalFeesByMint` object, showing the total fees collected for each distinct token mint address. This data can be logged, saved to a file, or stored in a database for further analysis.

4.  **Implementation Details & Libraries:**
    *   **Primary Tool:** Helius API/SDK (`@helius-labs/helius-sdk` recommended) for fetching account info and parsed transaction history.
    *   **IDL Decoding:** `@coral-xyz/anchor` can be used for convenient decoding based on the `tuna.json` IDL, although manual decoding using `@solana/buffer-layout` is also possible.
    *   **Language:** TypeScript (Node.js).

5.  **Considerations:**
    *   **Data Volume:** The transaction history for the fee recipient could be large. Implement robust pagination and potentially run fetches asynchronously or in batches.
    *   **Rate Limits:** Be mindful of Helius API rate limits during history fetching. Implement appropriate delays or backoff mechanisms if needed.
    *   **Token Decimals:** Ensure token amounts are handled correctly according to their respective mint decimals (fetchable via Helius/RPC if not cached). Use `uiAmount` from Helius parsed data where possible.
    *   **New Fee Tokens:** The implementation should dynamically handle any new token types that might be collected as fees in the future.
    *   **Initial Fetch:** For a one-off or scheduled task, consider fetching history up to the latest transaction initially, and then subsequently only fetching transactions newer than the last processed one.
