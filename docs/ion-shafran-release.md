# ION — Shafran, long Private names, Public colors and responsive moves

Live: https://ion.floot.app. Source: cloud/floot. Native Tactical 0.7.1 runs in the cloud.

Shafran appears beside Gliński and McCooey in Boards and Rules. The C++ library
supplies its 70-cell shape, 36-piece setup, oblique notation, legal moves and result.
All six Tactical levels, saved links, Pass and Play, Undo and swipe history are shared.
The board renderer fits native coordinates around their geometric center, so the
between-cell center rotates without clipping. Existing colors and controls remain.
Twenty-two separate rule clouds cover setup, all pieces, first advances of up to
three cells, both crossed en passant cells, promotion, short/long castles on either
flank, king safety and game endings. Pictures appear only in opened paragraphs.

The rules follow Green Chess’s illustrated four castling choices; the original
manuscript was not located. References and the chosen interpretation are in
[Shafran](variants/shafran.md). Equal stalemate and the existing labeled low-material
house draw are enforced; this is not historical certification.

Private creation, editing and saved drafts no longer cap names at 80 characters.
Names longer than the cloud preview retain their complete stored and accessible
text. Opening one shows fitted reading pages above its droplets. Even an unbroken
long word is paged without losing characters or requiring scrolling. Public/Chess
direct name entry still uses 80 characters. The separate capacity of 1,024 direct
droplets remains. A general 1 MiB request guard is independent of word count.

Public creation and permitted edits have the same eight-color wheel as Private.
Colors persist with branches and update through the existing realtime channel.
Author/owner permissions are unchanged. Home from a deep droplet opens its owning
space; Home at that space root opens ION, making two consecutive presses return home.

Native legal moves now include precise changed-cell data. Human moves animate
immediately from those C++ changes while the cloud validates and saves. The client
never advances the saved turn, move counter or result before confirmation. Pending
boards reject extra moves; a failed save restores the saved position and offers
Retry. Castling, captures, en passant and promotion use the same visual delta path.
Piece/rotation durations are 220/320 ms, replacing 420/540 ms and a 480 ms wait.
Tactical search budgets are unchanged. Network access is still required.

Saved-game hash/popstate navigation now switches games without reloading the page,
cancels previous requests, deduplicates browser navigation events and ignores stale
responses. The URL capability and native legality checks remain authoritative.

## Validation

Validation results: 14 Shafran browser flows, six Private-name flows and seven Public/latency flows pass. Records are in docs/screenshots/ion-shafran-live-qa.json,
ion-private-names-qa.json and ion-public-speed-qa.json. Native checkmate and stable-Home regressions also pass; game/long-name axe reports have zero violations. A real browser measured a 59 ms click-to-preview with an intentional 1,000 ms save delay, and 787 ms from confirmation to the next playable turn under test load. This measures immediate feedback; it does not claim cloud network round trips disappeared. The same delayed-save test verifies rollback and Retry after a simulated 503. Temporary QA accounts, shared words and seven explicitly tracked game fixtures were removed.
Native rules tests passed: Gliński 5,735 checks and eight random/two engine games;
McCooey 4,304 checks and nine random/two engine games; Shafran 3,020 checks and eight
random/two engine games. The native protocol/manager suite passes 23 tests, including
projected-cell equality against the actual result for every initial legal move of
all three variants, castling’s four changed cells and en passant’s three.

Floot typecheck is clean. Thirteen default helper spec files plus useCloudGame and
useCloudSpace pass, including exact capacity, name validation, native visual previews,
failed-save rollback, link changes and stale responses. Official design-document
lint reports zero errors and warnings. The Premium static auditor runs in strict
mode but reports 20 false positives: it case-folds shared JSX Form/Button owners as
literal HTML, so it misses asChild links and each actual form’s noValidate. Every
reported link has a real router destination; Button supplies native type=button.
These findings were reviewed against rendered browser behavior; no strict-pass
claim is made. Tokens and canonical primitives remain unchanged.

Browser emulation checks the live API and interface. It does not establish a real
phone installation/keyboard test, measured engine rating or universal network latency.
