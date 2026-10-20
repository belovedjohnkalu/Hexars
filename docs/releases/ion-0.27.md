# ION 0.27 — Time

Time is the sixth default ION word, opening a layered banking space with Balance, Activity, Send, Receive, Earn and Prices. It reuses the black/Inter identity, spatial packing, glass Back control, fitted text pages and existing accessible input/dialog components. Dev-only Treasury and Estimates use the same interface.

The server issues active-use earnings to authenticated, visible, focused sessions, pauses after three minutes without interaction and permits one earning lease per account. Account-specific private realtime updates keep balances current without refreshing the chess engine. Transfers use public player names and exact microseconds, with explicit review and idempotent confirmation. Journal entries are balanced, append-only and corrected only by linked reversals.

Creation price is the full approved direct-work estimate plus an equal share of free development, divided by unique accounts with valid issued sign-in credentials. Purchases do not reduce it. Thirty-second quotes retain the original cost and buyer-count proof. Owner approval freezes a cost; no historical values are invented. A 24-hour production count warm-up and approved costs are both required before charging.

Gliński and Universal remain free. Other variants and engines have separate permanent account entitlements. Online participants need variant access, saved viewing remains free, and continuing a paid-feature saved game requires its unlocks. Legacy games keep their engine identity. New engine games default to Universal.

Remembered-account rotation revokes the consumed session while preserving independent sessions on other devices. This prevents superseded credentials from inflating the buyer count after sign-out.

See [Time policy and architecture](../time/README.md) for exact accounting, eligibility, privacy and rollout rules. The economic paper is presented in 26 abridged sections; its broader institutional questions remain outside this first release.

Verification: hosted TypeScript is clean; all 42 helper spec files pass, including actual React recovery and account-mismatch tests. Live database checks verify earning, lease replay protection, concurrent transfers, once-only permanent purchases, stored pricing proof, expiry, receipt privacy and sign-out counting. SQL tests cover immutable and exactly balanced entries, overspending, idempotency and exact single reversals. Mobile browser checks verify real earning, reviewed transfers, an interrupted committed payment followed by the same idempotent Retry, cross-account privacy, WCAG A/AA checks and no page overflow.

The static premium audit retains its pre-existing React Form-provider false positive at login.tsx:45; the actual nested native form already has noValidate. No new audit findings were introduced. Test financial effects are reversed through the journal, sessions/passwords revoked and their isolated wallets closed. No real user content or journal rows are erased. Production warm-up began October 20, 2026 at 20:44:22 UTC and ends October 21 at that time. No creation estimates have been approved.

Production chess regression passes with real Universal and Unconventional replies, undo, offline reset failure/retry, per-engine resume, keyboard navigation and phone/desktop layouts. Reconnecting authentication and failed balance refreshes preserve the mounted game and its dialog. The final live banking run also passes after account-bound snapshot validation.
