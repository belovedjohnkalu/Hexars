# Time in ION

Time is an internal, account-backed denomination of human time. Version 0.27 implements a wallet, active-use earning, transfers, a treasury and permanent feature unlocks. It does not implement the proposed economy's lending, interest, fiat exchange or labour-verification institutions.

## Pricing policy

For a feature with approved direct creation estimate `D`, approved free-development pool `F`, and `N` unique signed-in accounts:

```
C = D + allocated share of F
price = ceil(C / N) microseconds
```

There are ten paid catalog items: McCooey, Shafran, Brusky, De Vasa, Wellisch, Tactical, Positional, Defensive, Materialist and Unconventional. The free-development pool is divided equally across them; sorted product IDs receive any leftover microseconds, preserving the pool exactly. Universal and Gliński remain free. A variant purchase includes its rules; an engine purchase includes every level and works across available variants. Devs have access without charges but earn normally.

`N` counts distinct accounts with a still-valid issued authentication credential, including devs and previous buyers. It is not a concurrent-visitor count. Additional devices do not add buyers. Credential expiry and sign-out can raise prices. Consumed remembered-account sessions are revoked when rotated, without revoking another device's independent session. An empty population produces no quote, rather than dividing by an invented minimum.

The full creation cost remains the numerator after purchases. Revenue is reported separately and can exceed creation cost. Features never become free merely because costs have been recovered. Devs can save revised total estimates after publication. Owner publication explicitly updates future prices; subsequent work never silently increases them. Each publication records immutable before/after cost snapshots. Revising the free-work pool reallocates it across every published paid feature. Existing quotes, purchases and entitlements are unchanged. Historical work is a labelled, documented estimate, never fabricated elapsed-time tracking. No estimates are seeded by this release.

Quotes last 30 seconds. Confirmation honours the stored amount, buyer count and creation-cost version even if the population changes. Expiry requires a fresh review. Confirmations and retries use the same quote and request ID; two concurrent purchases of the same entitlement charge once.

## Earning and money movement

- Start at zero. One eligible second of signed-in use earns one second of Time.
- A visible, focused tab earns until three minutes after the last trusted interaction. Reading and thinking count within that window.
- The server credits clock-bounded heartbeat intervals. No offline backfill; gaps over 30 seconds are discarded. Hidden/blurred pages settle and stop. One account has one earning lease across all devices.
- Wallet units are integer microseconds (`bigint`), serialized as decimal strings. Financial arithmetic never uses floating point.
- Sending resolves the case-insensitive unique public player name. Review displays the exact recipient and amount. Transfers have no fee; insufficient funds never create a negative wallet.
- Purchases credit ION's separate treasury. Devs can inspect treasury records; only the configured owner dev can publish creation estimates or make payouts.

Active-use earning is an ION policy, not proof that browsing constitutes productive labour under the theoretical paper. Cost estimates do not issue spendable funds.

## Banking journey

ION → Time → Balance / Activity / Send / Receive / Earn / Prices. Devs also see Treasury and Estimates. Activity and receipts are private to their participants; treasury records require dev membership. Receipt references can be copied. Earlier activity uses explicit fitted pages; there is no document scrolling. Earn → Principles contains an explicitly abridged, 26-part account of the user's paper, retaining open theoretical questions and distinguishing them from ION's implementation policy.

Activity presents three totals: Added (every positive journal entry), Spent (every negative entry) and Balance (their difference). Added/Spent open filtered receipt pages. Its second-by-second counter is a bounded display projection of the active earning interval; server-confirmed journal balances alone authorize payments. It stops with the earning session and reconciles to each posted snapshot. Private functional words and receipt fields have permanent dev identifiers; changing amounts never changes an IL.

Gliński, Universal, online coordination, saved viewing, notations and Library remain free. All players need access to an online match's variant. Random matchmaking filters to available variants. Continuing an old game requires its paid variant and engine unlocks; read-only viewing does not. Saved Tactical games retain their identity; only newly created games default to Universal.

## Rollout

After the production deployment succeeds, set `ion_time_config.production_started_at` exactly once. Prices enforce only after its 24-hour credential-count warm-up **and** owner approval of that feature's creation estimate. The free-work estimate must be approved first. Until then, features are temporarily available without granting permanent entitlements. Never reset the warm-up on later deployments.

## Implementation and verification

Canonical migration: [20261020_time.sql](../../cloud/floot/migrations/20261020_time.sql). The Floot-managed Postgres database is authoritative. `timeLedger` owns accounting views, `timeOperations` owns commands, `timeAccess` owns entitlement policy and `TimeProvider` owns the earning runtime. Native C++ retains chess authority. Separate Time realtime channels avoid reloading chess every earning heartbeat.

Every posted transaction has exactly two immutable journal entries with zero net value. Account locks are taken in deterministic order. Idempotency keys and quotes prevent duplicate effects. Corrections append an exact linked reversal; no journal edits or deletions. Account balance caches must equal journal sums. Issuance is the sole account permitted a negative balance.

Validation includes exact-precision/math and all variant-engine policy combinations, browser earning lifecycle tests, hosted transfer/purchase concurrency, expiry, cross-account privacy, session rotation and SQL immutability/balance constraints. Browser tests are under `tests/e2e/time-bank.live.cjs`; SQL invariants under `tests/cloud/time-ledger.sql`. Test accounts are archived with reversed ledger effects, never erased from the journal.

## Purchase-only access (0.31)
The user superseded temporary grace access: a non-dev must hold an entitlement backed by that account's unreversed Time purchase to the treasury for the same product. Availability/legacy unlock flags do not qualify. Unpriced or warming paid features remain locked until a purchase can be made. Free features, dev exemptions and saved-game viewing remain unchanged. No old journal entries or balances are changed by this policy.

## Affordable discovery (0.32)
An unpurchased feature appears only when its published, usable price is no greater than the account's posted balance. Purchased features and dev access remain visible. Affordable entries are struck through and open their trade page. Unpriced/warming features remain undiscoverable; no price, ledger or entitlement is altered by this presentation policy. Time's duplicate Balance page is removed in favour of Activity. The shared Time hub is owner-editable through ordinary cloud controls; financial records are not editable labels.
