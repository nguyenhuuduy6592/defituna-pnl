1. ✓ Tooltip on position history modal on mobile - DONE (added position options including bottom-center for correct mobile positioning)
2. ✓ Postion name on PnL modal - DONE
3. Ref line on chart should have exact value = 0 shown
4. ✓ Percentage on PnL card - DONE (reused displayPnlPercentage from the table)
5. ✓ Reference line is not explain on the chart - DONE (added "Break-even ($0)" label to the reference line)
6. ✓ Always show Ref line on the chart - DONE (forced domain to include 0 and added ifOverflow="extendDomain" to reference line)
7. ✓ if there is saved wallet, on page reload, the wallet address is filled into the wallet form input - DONE (modified useWallet hook to not set the input value on initialization)
8. ✓ Fix export pnl card. - DONE (Simplified styles and export config for consistency)
9. ✓ Add Total yield card - DONE
10. Add chart for total values
11. ✓ Add position status into the PnL card - DONE
12. ✓ Improve chart to add position pair and allow exporting - DONE
13. Show bigger/better chart on tooltip for price range which can make it easier to quickly understand the range. Readonly, no interaction, should has same indicators as what are already provided on the tooltip
14. Fix total values UI on mobile - IGNORED
15. ✓ Align position status with position pair to optimize space - DONE
16. ✓ Display percentage on the Total PnL Card - DONE
17. ✓ Add more details to the PnL Card modal: - DONE
    - **Layout:** Compact, two-column grid for details, header with inline status.
    - **Data Source:** Uses existing DefiTuna position data and shared formatters.
    - **Displayed Info:**
      * **Header:** Pair Name, Status Badge (inline).
      * **Performance Block:** Net PnL (USD & %), Position Duration.
      * **Financials Column:** Collateral, Leverage, Fees Earned, Compounded.
      * **Parameters Column:** Range, LL/UL (Lower Limit / Upper Limit), Liq Price, Duration, Closed At (if available).
    - **Removed:** Size, Current Price, Platform/Address details, Section Headers.