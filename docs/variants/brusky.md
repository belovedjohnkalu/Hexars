# Brusky — playable

Playable in ION with native-authoritative rules, Tactical, pass-and-play,
cloud save/resume, undo/review and illustrated paragraph clouds.

## References checked on 2026-10-18

- [Brusky overview and original pawn examples](https://en.wikipedia.org/wiki/Hexagonal_chess#Brusky's_hexagonal_chess).
- [Hexagonal Chess — Brusky](https://en.wikibooks.org/wiki/Chess_Variants/Hexagonal_Chess).
- [Green Chess board, setup and castling diagrams](https://www.greenchess.net/en/rules.php?v=brusky).

Green Chess explicitly simplifies the pawn rules. Its board/setup and castling
diagrams were checked against the overview, but its pawn behavior must **not**
be copied as the original rules. The inventor’s original manuscript was not
located; the movement implementation still needs independent fixture review.
No reference images or third-party code are shipped.

## Board and setup implemented

84 pointy hexagons in eight horizontal ranks, with lengths
9,10,11,12,12,11,10,9. Twelve oblique files use **a through l**, including j.
For file index f=0..11, valid ranks run from max(1,f−7) to min(8,f+5).
Axial coordinates are q=f−5 and r=4−rank. Rendering must use
x=√3(q+r/2), y=1.5r, with 30-degree polygon vertex offset. A half-turn maps
(q,r) to (1−q,−1−r).

Each side starts with 19 pieces: ten pawns, two rooks, two knights, three
bishops, one queen and one king. White’s a1–i1 row is
R N B Q B K B N R; pawns occupy a2–j2. Black’s d8–l8 row is
R N B K B Q B N R; pawns occupy c7–l7. Tests check these rows independently
rather than simply mirroring the implementation.

The `hexchess::brusky` namespace supplies this ordered cell list,
notation/index conversions, a `GameState` setup, the two forward pawn axes,
starting/promotion cells, and the two castling destination plans per player.
The setup validates and records its own repetition key, including movement rights.

## Implemented rules and verification

Native fixtures independently cover:

- Two noncapturing forward directions, with an unmoved starting pawn allowed
  two steps along either individual direction. All traversed cells must be empty.
- Enemy occupancy of either immediately forward cell blocks both forward
  advances; friendly occupancy blocks only its own path.
- Two forward vertex captures, plus a third straight-forward vertex capture
  available only to an unmoved pawn on its original starting cell.
- Immediate en passant after either kind of double advance, including pins,
  expiry, serialization, repetition rights and move-change previews.
- Promotion on the opposite horizontal back rank, rather than a slanted edge.
- Castling: White f1→h1 / i1→g1 or f1→c1 / a1→d1;
  Black g8→e8 / d8→f8 or g8→j8 / l8→i8. Movement history, empty
  paths, check and every king transit cell must be validated.
- Checkmate and equal-score stalemate; preserve the app’s explicitly labeled
  low-material house draw.
- Native protocol and Tactical support; pointy board rendering/previews/rule
  diagrams; pass-and-play, undo/review, saved games and engine games.

The shared protocol exposes pointy orientation, full movement history and native legal-move deltas. Original three-variant hashes and saved states remain compatible. `npm run test:native`, protocol tests and CMake/CTest cover the module; the shared horizontal suite covers full random and Tactical games.


Presentation clarification (0.48): the two immediately adjacent forward edge cells are movement destinations only and never captures. Preserve the historical exception: an unmoved pawn on its original starting cell can also capture the farther straight-ahead vertex cell between its two normal side captures. The rules paragraphs and teaching diagrams distinguish these cells explicitly; native move generation is unchanged.
