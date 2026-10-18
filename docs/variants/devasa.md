# De Vasa — implementation started

The experimental native foundation implements the revised **81-cell rhombus**,
notation a–i / 1–9, the 36-piece starting arrangement and special-move geometry.
It is intentionally absent from `createGame`, Tactical capabilities and the live
chooser. Legal moves, game results, protocol and web gameplay are not implemented.

## References checked on 2026-10-18

- [Green Chess: De Vasa](https://www.greenchess.net/en/rules.php?v=de-vasa),
  including its board, starting position, two forward pawn directions and
  castling diagrams. Its independently maintained playable board supplies
  explicit cell coordinates and piece placements.
- [Hexagonal chess: De Vasa](https://en.wikipedia.org/wiki/Hexagonal_chess#De_Vasa's_hexagonal_chess),
  covering the revised arrangement, third-rank pawns and en-passant example.

The 1954 Boyer publication and inventor’s original manuscript were not obtained.
The sources describe a revised setup; this module targets that setup, not an
unverified earlier arrangement. The Pritchard chapter PDF could not be downloaded
(403), so it is not claimed as a checked source. No third-party image/code is shipped.

## Geometry and setup

Every file and rank has nine cells. Axial q is file−e; r is 5−rank, both −4..4.
Hexagons are pointy, projected by x=√3(q+r/2), y=1.5r. Rotation maps (q,r) to
(−q,−r). Cell storage is the ordered explicit valid-cell vector, with its own
index/notation functions; this does not introduce a fixed board assumption
into the shared rules API.

White’s a1–i1 row is R N B Q B K B N R, with pawns on a3–i3. Black’s
a9–i9 row is R N B K B Q B N R, with pawns on a7–i7. The second ranks are
empty. Both sides have one king, one queen, two rooks, two knights, three
bishops and nine pawns.

The foundation records both forward pawn axes and same-color side-capture
axes, starting cells, opposite horizontal promotion ranks, and castle plans:
White Kf1→h1 / Ri1→g1 or Kf1→c1 / Ra1→d1; Black Kd9→b9 / Ra9→c9 or
Kd9→g9 / Ri9→f9. These are geometric destinations, **not permission to castle**.

## Next gate before enabling play

Implement unmoved-pawn double moves along either individual forward axis,
blockers, both side captures, immediate en passant with king-safety filtering,
promotion choices, and castling with movement rights, empty paths and safe
king transit. Independently verify mate/stalemate and historical draw policy;
keep the app’s low-material house draw explicitly labeled. Do not inherit
Brusky’s extra initial capture or enemy blocking of both forward paths.

Then add protocol validation, native move-change previews, Tactical search,
pointy-board rendering, rule illustrations, pass-and-play, undo/review, saved
games and complete-game tests. The experimental setup has no repetition hash
until its own movement rights and descriptor exist. Tests require unsupported
play to reject explicitly rather than applying another variant’s rules.
