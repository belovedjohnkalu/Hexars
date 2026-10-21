# ION 0.30 — Revisable estimates
Dev accounts can save a new total estimate after publication. Owner approval explicitly publishes the new version. The previous proposal remains and every publication appends immutable before/after snapshots. Revising the free-work pool atomically updates the shared allocation of all published features. Quotes keep the cost/amount from one snapshot; existing quotes, purchases, journal entries and entitlements are unchanged. No live costs are approved as part of this release.

Verification: hosted TypeScript, revision/permission/arithmetic/entitlement tests and a browser check of the published-estimate revision form. Tests use mocked financial data; no real prices or balances are changed.
