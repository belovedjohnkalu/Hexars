# ION dev namespaces and nickname sharing — October 20, 2026

First deployment: Back traverses the previous same-app visited entry, using the
existing safe fallback only for direct entry. The floating glass control stays
unchanged. Nicknames are unique case-insensitively after trimming, including
concurrent registrations; a taken name returns 409 without losing form input.
Saved views and saved-game Controls expose Share to nickname. Delivery creates
the existing read-only Received record; no email or gameplay capability is shared.

The first dev has immutable namespace 0. ION is IL0, with Chess IL01, Public IL02,
Private IL03, Controls IL04 and Accounts IL05. Descendant suffixes remain fixed:
old IL201 is now IL0301. Historical raw registry paths/counters remain intact;
namespaceIdentifier combines the stored dev_number and one-based root for display.
New registry rows retain their birth namespace across moves. Namespace assignment
is server-owned and cannot be supplied through cloud mutations. Only the configured
owner dev can edit shared Home/Chess. Other devs retain their own Private/Accounts
permissions and can read but not edit the first dev's Home/Chess.

Validation: 32 helper suites passed, hosted TypeScript clean. API tests verify
concurrent nickname arbitration, case/space normalization, Received delivery,
unknown/self recipient errors, first-account IL01–IL05, dev write isolation and
private namespaces. Phone browser checks verify visited-page Back through a
non-parent route, the Share to nickname cloud/form, primary labels and read-only
Home for another dev. No real accounts were renamed; existing nicknames were unique.

Automatic one-child traversal was deliberately retained in this first deployment.
Its removal is a separate second deployment, as requested.
