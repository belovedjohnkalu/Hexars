# Brusky — implementation started

Status: native board, conventional notation, starting position and special-rule
geometry are implemented and tested. Brusky is **not yet playable**, registered
in `createGame`, advertised by Tactical, or offered in the live board chooser.
This prevents the common generator from silently applying another variant’s
pawn rules to an unfinished variant.

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

The experimental `hexchess::brusky` namespace supplies this ordered cell list,
notation/index conversions, a `GameState` setup, the two forward pawn axes,
starting/promotion cells, and the two castling destination plans per player.
The setup deliberately has no repetition key until Brusky’s rights are implemented.

## Next implementation gate

Before enabling the variant, implement and independently test:

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

No frontend authority, database rows, engine asset, or saved game hash was changed
for this foundation. `npm run test:native` and CMake/CTest both include its tests.
