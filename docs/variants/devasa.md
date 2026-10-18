# De Vasa — playable

Playable in ION with native-authoritative rules, Tactical, pass-and-play,
cloud save/resume, undo/review and illustrated paragraph clouds.

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

The module implements both forward pawn axes and same-color side-capture
axes, starting cells, opposite horizontal promotion ranks, and castle plans:
White Kf1→h1 / Ri1→g1 or Kf1→c1 / Ra1→d1; Black Kd9→b9 / Ra9→c9 or
Kd9→g9 / Ri9→f9. Permission depends on unmoved king/rook, vacant paths and safe king transit.

## Implemented rules and verification

Unmoved starting pawns may double along either individual forward axis. Pieces
block only their own path; there is no Brusky initial third capture or enemy
blocking of both paths. Immediate en passant validates the crossed cell, victim,
movement history, expiry and king safety on both axes for both colors. Promotion
is on the opposite horizontal rank, with all four choices. Castling validates
king/rook rights, empty paths and every king transit cell.

Checkmate, equal-score stalemate, repetition and automatic draw policy are
implemented. The app’s low-material house draw is explicitly labeled. The native
protocol round-trips complete rights, rejects malformed positions, and supplies
visual deltas for immediate previews, including castling and en passant. Tactical
uses these same rules. Full random games and engine self-play complete legally.
The shared horizontal suite contains 5,071 assertions across both variants,
besides each module’s independent geometry/setup and protocol tests.
