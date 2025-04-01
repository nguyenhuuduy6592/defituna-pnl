1. ✓ Tooltip on position history modal on mobile - DONE (added position options including bottom-center for correct mobile positioning)
2. ✓ Postion name on PnL modal - DONE
3. Ref line on chart should have exact value = 0 shown
4. ✓ Percentage on PnL card - DONE (reused displayPnlPercentage from the table)
5. ✓ Reference line is not explain on the chart - DONE (added "Break-even ($0)" label to the reference line)
6. ✓ Always show Ref line on the chart - DONE (forced domain to include 0 and added ifOverflow="extendDomain" to reference line)
7. ✓ if there is saved wallet, on page reload, the wallet address is filled into the wallet form input - DONE (modified useWallet hook to not set the input value on initialization)
8. Fix export pnl card.
9. ✓ Add Total yield card - DONE
10. Add chart for total values
11. ✓ Add position status into the PnL card - DONE
12. ✓ Improve chart to add position pair and allow exporting - DONE
13. Show bigger/better chart on tooltip for price range which can make it easier to quickly understand the range. Readonly, no interaction, should has same indicators as what are already provided on the tooltip
14. Fix total values UI on mobile
15. Align position status with position pair to optimize space
16. Display percentage on the Total PnL Card
17. ✓ Add more details to the PnL Card modal: - DONE (added comprehensive sections with financial details, position parameters, and timeline using existing data and formatters)
    - **Reuse existing data and components:**
      * Leverage the existing position data from DefiTuna API response
      * Reuse existing utility functions for formatting/displaying values
      * Use existing formatters for displaying percentages, prices, and USD values
    - **Content sections (all using existing data where available):**
      * **Header:**
        - Pool pair name (reuse existing pair name resolver from PositionTable)
        - Position Status badge (reuse existing status formatter)
      * **Performance Metrics:**
        - Net PnL in USD (reuse `position.pnl.usd` and existing formatter)
        - Net PnL percentage (reuse `displayPnlPercentage` function)
        - Position Duration (reuse existing duration calculator if available)
      * **Financial Details:**
        - Initial Deposit (reuse `position.deposited_collateral_usd.amount` formatter)
        - Leverage (reuse existing leverage calculation if implemented in PositionTable)
        - Fees Earned (reuse existing yield formatter for `yield_a.usd` and `yield_b.usd`)
        - Current Value (reuse existing formatter for total position value)
      * **Position Parameters:**
        - Platform indicator (reuse existing platform detection)
        - Price Range (reuse existing tick-to-price conversion utility)
        - Current Price in Range indicator (reuse existing in-range detection)
      * **Timeline:**
        - Opened At timestamp (reuse existing timestamp formatter)
        - Closed At timestamp (reuse existing closed position detection)