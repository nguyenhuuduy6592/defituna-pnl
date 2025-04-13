**Plan: Calculate DefiTuna Protocol Fee Accrual**

1.  **Objective:**
    *   Determine the total amount of fees collected by the DefiTuna protocol, broken down by individual token types. This involves identifying the protocol's fee recipient address and summing up all token transfers sent to that address.

2.  **Prerequisites:**
    *   **DefiTuna Program ID:** The public key of the deployed DefiTuna Solana program.
    *   **DefiTuna IDL (`tuna.json`):** The Interface Definition Language file for the DefiTuna program, defining account structures and instruction layouts. ([Link to IDL](https://github.com/DefiTuna/tuna-sdk/blob/main/idl/tuna.json))
    *   **Helius API Key & Access:** Credentials and necessary setup to interact with the Helius API for fetching Solana blockchain data.
    *   **Development Environment:** Node.js environment with necessary libraries (e.g., `@helius-labs/helius-sdk` or `axios`/`node-fetch`, `@solana/web3.js`, `better-sqlite3`, potentially `@project-serum/borsh` or `@solana/buffer-layout` for manual decoding).

3.  **Implementation Steps:**

    *   **Step 1: Identify the `TunaConfig` Account Address**
        *   **Action:** Determine the public key of the main `TunaConfig` account for the DefiTuna protocol.
        *   **Method:** This address is often a Program Derived Address (PDA) derived from known seeds and the Program ID, or it might be a well-known constant address provided by the DefiTuna team. Consult DefiTuna documentation or SDK examples if the derivation method isn't immediately obvious from the IDL. The IDL (`tuna.json`) defines the `TunaConfig` account structure.
        *   **Technical Detail:** If it's a PDA, typical seeds might be `['TunaConfig'.toBuffer()]`. Use `PublicKey.findProgramAddressSync` from `@solana/web3.js` with the correct seeds and the DefiTuna Program ID.
        *   **Store:** Save this address as a constant (e.g., `TUNA_CONFIG_ACCOUNT_PUBKEY`) in the implementation.

    *   **Step 2: Fetch `TunaConfig` Account Data**
        *   **Action:** Retrieve the account data for the identified `TunaConfig` address.
        *   **Method:** Use the Helius API or standard RPC.
        *   **Technical Detail (Helius SDK):** Use `helius.rpc.getAccountInfo(TUNA_CONFIG_ACCOUNT_PUBKEY)`.
        *   **Technical Detail (RPC):** Standard `connection.getAccountInfo(TUNA_CONFIG_ACCOUNT_PUBKEY)` from `@solana/web3.js`.

    *   **Step 3: Decode `TunaConfig` Data and Extract `fee_recipient`**
        *   **Action:** Parse the raw account data to find the protocol's designated fee recipient address.
        *   **Method:** Use the `TunaConfig` account structure definition from the `tuna.json` IDL.
        *   **Technical Detail (Anchor):** (Less common in JS-only projects) If using AnchorJS, instantiate a `Program` using the IDL and connection. Then use `program.account.tunaConfig.coder.accounts.decode(accountInfo.data)`.
        *   **Technical Detail (Manual JS):** Use `@solana/buffer-layout` or `@project-serum/borsh` to define the layout matching the IDL structure (consider 8-byte discriminator offset) and decode `accountInfo.data`.
        *   **Store:** Save the extracted `fee_recipient` public key (e.g., `FEE_RECIPIENT_PUBKEY`).

    *   **Step 4: Fetch and Store Relevant Transaction History in SQLite**
        *   **Action:** Retrieve relevant transactions involving the `fee_recipient` address in batches and store the necessary details locally in an SQLite database.
        *   **Method:** Utilize Helius's parsed transaction history API with pagination. Use a local SQLite database file (e.g., `data/fee_data.sqlite`).
        *   **Technical Detail (Setup):**
            *   Use a Node.js SQLite library (e.g., `better-sqlite3`).
            *   On first run, initialize the database connection: `const db = new Database('data/fee_data.sqlite');`
            *   Create a table if it doesn't exist: `db.exec(\`CREATE TABLE IF NOT EXISTS fee_transfers ( signature TEXT PRIMARY KEY, blockTime INTEGER, mint TEXT, amount TEXT, source TEXT )\`);` (Using `TEXT` for `amount` to store `BigInt.toString()`). Create an index on `blockTime` for efficient delta updates: `db.exec(\`CREATE INDEX IF NOT EXISTS idx_blockTime ON fee_transfers (blockTime)\`);`
        *   **Technical Detail (Fetching & Storing - Helius SDK):** Use `helius.transactions.getParsedTransactions({ address: FEE_RECIPIENT_PUBKEY })`. Implement a loop/recursive function for pagination:
            *   Fetch a batch of transactions.
            *   If the batch is empty or the desired history range is covered, stop.
            *   **Filter and Extract:** Process the current batch to identify relevant fee transfers (see filtering logic below). Extract `signature`, `blockTime`, `mint`, `amount` (raw), `source`.
            *   **Store Locally (SQLite):** Prepare an SQL `INSERT` statement: `const stmt = db.prepare('INSERT OR IGNORE INTO fee_transfers (signature, blockTime, mint, amount, source) VALUES (?, ?, ?, ?, ?)');`. Use `db.transaction(() => { /* loop through extracted data and stmt.run(...) */ });` for efficient batch insertion. Store the raw `amount` as `BigInt(amount).toString()`. Use `INSERT OR IGNORE` to handle potential duplicates if re-fetching overlapping ranges.
            *   Fetch the next batch using the signature of the last transaction in the current batch for the `before` parameter.
        *   **Filtering/Extraction Logic (within batch processing):**
            *   Filter the `result` array for transactions where `transaction.meta.err` is `null` (successful).
            *   Iterate through `transaction.transaction.message.instructions`.
            *   Focus on instructions where `programId` is the `TOKEN_PROGRAM_ID` or `TOKEN_2022_PROGRAM_ID`.
            *   Check if `instruction.parsed.type` is `transfer` or `transferChecked`.
            *   Verify that `instruction.parsed.info.destination` matches `FEE_RECIPIENT_PUBKEY.toBase58()`.
            *   For matching instructions, extract: `transaction.signature`, `transaction.blockTime`, `instruction.parsed.info.mint`, `instruction.parsed.info.tokenAmount.amount`, `instruction.parsed.info.source`.

    *   **Step 5: Aggregate Fees from SQLite Database**
        *   **Action:** Query the SQLite database to sum the amounts for each token.
        *   **Method:** Execute a SQL `GROUP BY` query.
        *   **Technical Detail (SQLite Query):**
            *   Connect to the database: `const db = new Database('data/fee_data.sqlite', { readonly: true });`
            *   Prepare and run the aggregation query: `const rows = db.prepare('SELECT mint, SUM(amount) AS totalAmount FROM fee_transfers GROUP BY mint').all();`
            *   Process the results: Iterate through `rows`. `row.mint` is the mint address, `row.totalAmount` is the total raw amount as a string. Convert `totalAmount` back to `BigInt`: `BigInt(row.totalAmount)`. Store these in a simple JavaScript object like `totalFeesByMint = {}`.

    *   **Step 6: Output Final Aggregated Fee Statistics**
        *   **Action:** Present the final calculated fee totals after processing the locally stored data.
        *   **Method:** Output the final state of the `totalFeesByMint` object.
        *   **Technical Detail (UI Amount):** To display user-friendly amounts, fetch mint decimals (e.g., using Helius `getAssetBatch`) for all keys in `totalFeesByMint`. Calculate `uiAmount = totalFeesByMint[mint] / (10 ** decimals)` for each mint. Output these UI amounts.
            *   This aggregated data can be logged, formatted as JSON/CSV, or used to generate static content.

4.  **Implementation Details & Libraries:**
    *   **Primary Tool:** `@helius-labs/helius-sdk` or direct Helius REST API calls using `axios`/`node-fetch`.
    *   **Local Database:** SQLite (using `better-sqlite3` recommended).
    *   **IDL Decoding:** Manual decoding using `@solana/buffer-layout` or `@project-serum/borsh` for Step 3.
    *   **Language:** JavaScript (Node.js).

5.  **Considerations:**
    *   **Local Storage (SQLite):** The single `fee_data.sqlite` file will grow over time. Ensure sufficient disk space. It's generally more efficient than large flat files.
    *   **Rate Limits:** Still relevant during fetching. Implement delays/backoff.
    *   **Token Decimals:** Needed for UI representation. Fetch once after aggregation (Step 5) using the unique mints obtained from the `GROUP BY` query.
    *   **New Fee Tokens:** Handled automatically by the `GROUP BY` query.
    *   **Delta Updates:** Find the latest `blockTime` in the `fee_transfers` table: `SELECT MAX(blockTime) as latestTime FROM fee_transfers;`. On subsequent runs, fetch Helius transactions *after* this timestamp (adjusting Helius query parameters if possible, or filtering fetched results) and `INSERT OR IGNORE` only the new transfers.

6.  **UI & Workflow:**

    *   **Local Development UI (Next.js Integration):**
        *   **Page Creation:** Create a new page component at `src/pages/admin/fees.js`. This provides the route `/admin/fees`.
        *   **Access Control:** This page and its associated API routes MUST only be accessible during local development. Implement checks using `process.env.NODE_ENV === 'development'`. Return a 404 or access denied message in production builds.
        *   **UI Component (`src/pages/admin/fees.js`):**
            *   Use React components (JSX) to build the UI with:
                *   Heading (e.g., "Protocol Fee Management").
                *   Button 1: "Fetch/Update Fee Data".
                *   Button 2: "Calculate & Generate Statistics".
                *   Status display area (using React state `useState`).
        *   **API Routes:** Create corresponding server-side API routes:
            *   `src/pages/api/admin/fetch-fee-data.js`: Implements Step 4 (Fetch & Store to SQLite).
            *   `src/pages/api/admin/generate-fee-stats.js`: Implements Step 5 & 6 (Aggregate from SQLite, Fetch Metadata, Generate JSON Output).
        *   **Button 1 Action ("Fetch/Update Fee Data"):**
            *   `onClick` handler uses `fetch` (or axios) to send a POST request to `/api/admin/fetch-fee-data`.
            *   API route (`fetch-fee-data.js`) executes the Helius fetching and SQLite insertion logic.
            *   Update UI state based on API response (success/error, progress messages).
        *   **Button 2 Action ("Calculate & Generate Statistics"):**
            *   `onClick` handler uses `fetch` to send a POST request to `/api/admin/generate-fee-stats`.
            *   API route (`generate-fee-stats.js`) executes the SQLite aggregation, metadata fetching, and JSON file generation.
            *   Update UI state based on API response.
        *   **Output File Generation:** The `generate-fee-stats.js` API route writes the static JSON file to `public/data/protocol-fees.json` (create the `data` directory if needed).
            *   **Example JSON Structure:** (Remains the same)
                    ```json
                    {
                      "lastUpdatedTimestamp": 1678886400,
                      "feesByToken": [
                        {
                          "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
                          "symbol": "USDC",
                          "decimals": 6,
                          "totalAmountRaw": "1234567890", // BigInt as string
                          "totalAmountUI": 1234.567890
                        },
                        {
                          "mint": "So11111111111111111111111111111111111111112", // SOL
                          "symbol": "SOL",
                          "decimals": 9,
                          "totalAmountRaw": "987654321000",
                          "totalAmountUI": 987.654321
                        }
                        // ... other tokens
                      ]
                    }
                    ```

    *   **Production Deployment (Vercel):**
        *   **Build Process:** Vercel automatically includes the `public` directory. Ensure `public/data/protocol-fees.json` is committed or generated *before* the build if not part of the build step itself.
        *   **Frontend (`src/pages/some-stats-page.js`):** Create a regular page for displaying stats.
            *   **Data Fetching:** Fetch `/data/protocol-fees.json` client-side OR preferably use `getStaticProps` (SSG/ISR) to read the file at build time/interval.
            *   **Visualization:** Use your existing charting library, `recharts`, to read the data from the fetched/pre-rendered JSON and display the fee statistics visually (e.g., using `BarChart`, `PieChart` components from `recharts`).
            *   **User Experience:** Users see the pre-calculated, static statistics served efficiently.
