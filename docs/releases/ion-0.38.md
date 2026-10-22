# ION 0.38 — Visitor recovery and touch accuracy

A visitor could return from Chess to ION and remain behind a loader if Library was still opening. Library now masks account-specific state immediately, cancels stale work when disabled or the account changes, and exposes Retry. A failed Library page shows unavailable instead of a false empty message. Receipt Retry now refetches the receipt that failed. Settled missing pages use Not found rather than Opening.

Online waiting rooms reconcile on their first socket connection, reconnect, foreground and online events. They also reconcile every five visible seconds while the user-started wait is active, serialize requests, time out at ten seconds and stop on exit or match start. Transient saved-room failures retain that room rather than opening a second match, and initialization retries in place. Existing server match authority and sign-in requirements are unchanged.

Phone word canvases reserve 56px minimum boxes and a minimum 0.8 opening fit (44.8px targets), preserving relative type, pictures, organic collision-free packing, desktop layout, cached cameras and manual overview zoom. Large touch pages may need more panning. Offline chess uses the empty footer for Back, keeping Board Reset unobstructed; online keeps Back above chat.

Hosted TypeScript and ten targeted helper suites pass. Preview browser checks cover auth/Remember, Time price and quote recovery without confirmation, receipt recovery, Library cancellation/error retry, and three online reconnection cases. The preview tunnel became intermittent before final new-game and in-place online retry checks; production validation is recorded after publication. The strict static UX audit retains the same 32 known Button-asChild/Form-provider false positives, and design lint passes.

See [visitor verification report](../verification/visitor-journey-2026-10-22.md) for live-versus-fixture evidence and explicit verification limits. No accounts, actual trades, estimates, entitlement policies or permanent ILs were changed. Native anonymous QA positions are isolated from customer game membership.
