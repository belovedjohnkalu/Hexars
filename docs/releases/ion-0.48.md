# ION 0.48 — Home features, hidden recovery and notifications

Published at https://ion.floot.app. This release completes the five live To do items explicitly authorized by “Complete the Todo lists.” The old Complete/inbox folders were soft-deleted; no drafts outside this bounded snapshot were executed or resurrected.

Home items are features. Signed-in people can hold a Home feature and choose Delete to remove it from their Home into the pictured Hidden recovery area. Restore returns it to Home with its original ID, contents and birth IL. This preference belongs to the authenticated account, follows it across devices and does not delete another person's shared content. Hidden is recovery infrastructure rather than a removable feature. Existing dev/author editing permissions remain unchanged. Entitlement and dev-prompt privacy filters run before hidden presentation; this route cannot reveal an unavailable paid feature or someone else's prompts. Private realtime and a local refresh reconcile successful changes, including when realtime is delayed. Edit/composer/accessibility language refers to Home features without changing Journal/Safari terminology.

IL05A1 was the extra Accounts branch `a254887a-2ac9-4181-9ffc-a9fe0370abd0`. It and its stored child were soft-deleted with a locked version check in dev 0's Accounts workspace. No account, login, remembered-device capability, other workspace or permanent identifier record was deleted. Its private scope refresh remains queued until that account next loads the scope; no private session was impersonated to force delivery.

IL04A11 now requests managed push notification access on a direct tap. The accessible toggle is green after successful subscription storage, red while off, and available to retry after denied/unsupported access. Existing enabled state reconciles after reload. On iPhone web push requires the installed Home Screen app and system permission. Native token objects are supported by the same backend, but no native build or physical-device delivery is claimed.

Time transfers/payouts produce sent/received notices linking to the exact authorized receipt. Received games link to the authenticated saved game using its share ID, never its bearer token. Event/device outbox rows are recorded transactionally with the transfer/share; periodic earning and purchases do not create noise. Delivery checks active user/session bindings and skips revoked/hidden shares. Gone subscriptions are removed; transient failures get at most three attempts with event-specific tags and delayed jobs. Confirmed ledger/share operations do not fail over queue or realtime delivery failures. Account switching and password sign-in retire the previous browser session's subscription; logout deletes it through the session foreign key. Frontend callbacks reject other accounts' payloads and unexpected routes. The managed Floot worker/client supplies web/FCM/APNs support and cold-start replay; only its designated wrapper spots were customized. No custom service worker, payment, Time estimate, credit or purchase was created.

Brusky's clarified paragraphs and diagrams distinguish its two adjacent forward edge movement cells, which never permit captures, from its farther straight-ahead vertex capture. Per the user's explicit answer, preserve that historical exception for an unmoved pawn on its original cell. Native movement rules are unchanged. Paragraph IDs/order and existing game positions are preserved.

Completed original roots, moved to active Completed `df45ea97-524e-4c1c-b2f6-2a96529562e3` (IL0A01) after publication and browser verification:

| Task root | Result |
| --- | --- |
| `6891bdd1-87ea-4c61-ac27-d3067e2bf8df` | Extra Accounts branch removed |
| `2d5b32dc-0a13-4724-a4cd-3fbe720aae46` | Hidden Home recovery and removal controls |
| `973f3680-b74d-42b9-83e1-a146179aa3e9` | Home feature terminology |
| `6fb708f9-5a95-4acb-a8e8-bc550f7586cd` | Linked Time/shared-game notifications |
| `4c97ad53-5c9a-422f-bba5-779e5cb51a89` | Brusky capture clarification |

The five roots and four supporting descendants retain their original IDs/text/birth ILs. Latest-row locking and exact root-name/parent checks protected the archive move. Existing To do/Completed structure and deleted legacy branches are preserved. Home realtime refresh was delivered and its administrative queue row cleared. Hidden was persisted once as a system node and allocated permanent raw IL `ILA1` in dev 0's namespace (display IL0A2); no ordinal was recycled.

Validation:

- Hosted TypeScript clean. All eight new/affected feature, authority, subscription, delivery, geometry presentation and refresh suites pass. The complete non-hook run is 69/70 files passing; organicLayout has the same two baseline failures documented in 0.47 (two-level contrast and retained centers after deletion). Its source/expectations were not changed. No full-regression-pass claim.
- Native horizontal rules: 4,970 assertions pass, covering both colors and complete random/engine games in Brusky/De Vasa.
- Deployed desktop/phone fixtures pass personal hide/restore, failed-save retry, no edit escalation, immediate Home refresh without realtime, notification enable/reload/disable, denied access remaining clickable, account-safe receipt navigation and no document scrolling. Token/OS permission adapters are fixtures; no real notification recipient or financial transaction was used. See tests/e2e/home-features-notifications.fixture.cjs.
- Real anonymous live checks verify the new 1024px Hidden icon, Home feature semantics, dev-prompt exclusion, unauthenticated mutation rejection, Floot's managed push worker and zero page errors/scrolling. The Home archive and permanent identifiers were reread after the live refresh.
- Premium static audit: unchanged 35 composite false positives (26 Button-asChild and 9 Form providers), zero unresolved owners. No strict-clean claim. Canonical Dialog, Button, Input and Sonner components own the new flow.
- Floot's publish scanner again lists seven external ChatGPT MCP/OAuth entry points as not called by frontend components. They remain intentionally externally consumed routes, verified in 0.47; they are not pending Todo tasks or unused placeholders.

Migration: cloud/migrations/048-home-features-notifications.sql. Artwork provenance: cloud/assets/ion-0.48-artwork.json. Production DB remains Floot-managed; no hosting/database migration occurred.

Follow-up: Hidden is now omitted from Home responses until this account has an available hidden feature. Restoring the last feature removes the recovery entry and returns its view to Home. Stale, missing and entitlement-filtered IDs do not make an empty Hidden entry visible. This is presentation-only: stored contents, preferences and permanent ILs are preserved. Focused homeFeatures/featureAuthority/cloudControls suites and TypeScript pass.
