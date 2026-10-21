# ION 0.31 — Purchased access and Other Accounts
Non-dev access to paid features requires a ledger-backed unreversed purchase, even if older state says available or unlocked. Free features and dev access remain free; Library and saved-game viewing remain available. Paid active-game requests, rules, entry and matchmaking enforce the same rule. Existing unmatched unlock rows remain as records but confer no access. A new legitimate purchase replaces a stale association.

Other remembered accounts now appear inside Other Accounts; the current remembered account stays at root. Device isolation and fixed existing ILs are preserved. Tests cover grace-flag rejection, missing-product denial, purchase-only access, account grouping, stale parent migration and reconnect behavior.

Verification: all 48 helper spec files pass, hosted TypeScript is clean, and browser checks verify paid denial, free Gliński and Other Accounts navigation. DESIGN.md lint is clean. The static audit retains only its known React Form-provider false positive in login.tsx. No purchase, balance or ledger record was deleted or altered.
