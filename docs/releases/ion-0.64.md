# ION 0.64 — Whole tiles and independent navigation

The directly requested IL0A00A2 branch contained twenty original nodes under Other, Tiles, Games and General. This release completes that bounded snapshot and polishes the shared tile implementation.

## Whole tiles

Descendant-character ratios now add complete cells: twice the smallest positive sibling weight gives two cells, three times gives three. Growth retains every previous cell, without half-cell subdivisions or decorative empty faces. A named leaf remains visible. Own label length reserves space but changes neither its font hierarchy nor its relative cell count. Labels wrap after eight words per usable cell width; two cells across allow sixteen. Names remain unchanged in storage.

Content sits near adjoining edges, with measured media, IL and publication-status footprints. The opening camera uses printed bounds rather than the empty extent of a large merged shape. Small cloud pages retain a readable scale and panning; Home fits its complete printed composition. Font family, light default, dark preference and blue boards remain unchanged.

Ordinary accounts see words and multimedia without tile fills or outlines. Only the printed content receives their pointer hits, leaving blank regions pannable. Keyboard focus underlines words or outlines pictures. Server-confirmed dev accounts see the geometric faces and permanent ILs. This presentation flag grants no permissions.

## Tiles, screens and history

Each account/tile/screen has an independent visit list, Back/Forward cursor and camera namespace. Switching restores that tile's journey before navigation. Split screens copy their source history once and diverge thereafter. Closing the primary screen promotes the companion with its own history. Native browser Back respects the selected tile, and contextual Controls stays out of return navigation. View metadata retains the existing device-session scope; cloud content remains server-backed.

Tile weight sums already-received authorized page content across its screens, without fetching unvisited or private material. Renaming a tile does not increase its weight. Default tile numbers advance independently of split-screen IDs. Double-tapping the tile name or pressing F2 opens Rename Tile directly; one tap opens Tiles, and holding selects Rename/Delete. All four tile functions retain canonical registered-dev editing and permanent identities. Closing a view never deletes cloud data, and unsaved-media guards remain.

The overview fits metadata that arrives during opening, then preserves deliberate pan/zoom. Composer focus cannot reset a cloud's chosen zoom; refitting follows actual screen-frame changes.

## Remaining prompt changes

Wide variant pages place navigation clouds left of the board and play controls right of it. Phones keep top/bottom actions. Native chess/checkers rules and cell hitboxes are unchanged. The two removed offline HexDame concession ILs remain reserved and unavailable everywhere; online Forfeit/Draw use separate identities.

Games (IL0A3) now has matching blue chess-and-checkers artwork. Publishing feedback uses CloudUpload and CircleAlert with accessible status text, stable dimensions and reduced-motion support. Real media upload failure, Retry and retained typing focus were checked on the hosted app.

## Verification and delivery

All 113 helper suites passed, with focused reruns after the final camera and overview fixes. Hosted TypeScript is clean. Eighteen browser/API checks passed across desktop and phone emulation, covering integer growth, 8/16-word rows, ordinary/dev presentation, direct rename, tile and split-screen history, native Back, reload, independent zoom, deletion, simulated keyboard placement, media Retry, artwork and retired ILs. No uncaught browser exceptions or document overflow occurred in those flows. Phone emulation does not substitute for a physical iPhone test.

The strict premium audit retains 38 reviewed findings, zero unresolved findings and no new finding categories. Four pre-existing hosting notices and seven externally consumed ChatGPT integration endpoints are unchanged by this release. Reproduction harnesses are the four tests/e2e/ion-0.64.*.cjs files; credentials and disposable fixtures stay outside Git.

After verified publication, the unchanged twenty-node prompt snapshot was compared under a row lock and moved into active Completed. Every original text, descendant, color, identity and birth IL was preserved; concurrent edits elsewhere in Home were retained. The temporary QA account was retired, its sessions and credentials revoked, fixture nodes cleared, saved game hidden, uploaded asset removed and each earning entry individually reversed through the append-only ledger. Its wallet is zero and closed.

The web release is live at https://ion.floot.app. Work-session timing and exact release evidence are in docs/verification/ion-0.64.json. Observed agent work is not described as independently verified human labor.
