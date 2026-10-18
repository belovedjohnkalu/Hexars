# Wellisch — Three-Handed Hexagonal Chess

Playable native implementation of the original army-takeover form, with explicit
ION adjudication rules. 91 cells, three players, 45 starting pieces, no bishops.
The frontend presents native positions and moves; it does not authorize chess.

## Sources checked October 18, 2026

- [Ludii description](https://ludii.games/details.php?keyword=Wellisch+Chess)
- [Ludii formal rules](https://ludii.games/lud/games/Wellisch%20Chess.lud)
- [Chess Variant Pages: Wellisch](https://www.chessvariants.com/play/erf/Wellisch.html)
- [Wikipedia movement overview](https://en.wikipedia.org/wiki/Hexagonal_chess#Three-Handed_Hexagonal_Chess)

The 1912 manuscript was not obtained. Ludii and the Chess Variant Pages both
distinguish their first-king-capture-wins adaptations from Wellisch's original
army takeover. The latter explicitly says the remaining game finishes normally.
ION implements takeover followed by two-player checkmate/stalemate. It does not
claim that the automatic draw policies below are verbatim 1912 rules. No
third-party source code or imagery is shipped.

## Rules

White (0), Black (1), Gold (2), in that order. Notation a–k includes j; rank is
6−r. White: Kd1, Qc1, Rb1/e1, Na1/d2/f1, Pa2/b2/c2/d3/e3/e2/f2/g2.
Other armies are 120-degree rotations. Every original army has K,Q,2R,3N,8P.

Rook: six edge rays, stopping at occupancy. Knight: six adjacent vertex jumps,
color bound. Queen: rook plus those short knight jumps. King: six edge steps.
Pawns step OR capture on either forward edge axis, one cell only, with no double
advance and no en passant. They stop on their opposite promotion edge.

Castling swaps the unmoved king and original unmoved rook on their home cells.
Any intervening cell must be empty; the king may not start in, cross, or finish
in check. Both movement flags are consumed. Paths and all three rotations are
tested independently of the frontend.

Captures of Q/R/N add that piece to its original army's reserve. An arriving
pawn promotes to an available captured piece of that same army. If none exists,
it waits at the edge and cannot move. When a reserve becomes available, delayed
promotion is compulsory at the beginning of the controller's next turn. This is
a separately recorded from==to promotion action followed by the same player's
normal move; it never grants an extra normal move. If multiple pawns can promote,
the player chooses which one consumes each reserve piece.

Normal moves must leave the moving player's king safe from both opponents.
While three kings remain, no legal escape forces a pass; this does not itself end
the game. A discovered threat need not wait for the threatened king's turn before
capture. The first king capture removes that king and transfers all armies
controlled by that player to the captor. Original pawn directions, promotion
edges and reserves stay with their original armies. The defeated turn is skipped.
With two kings remaining, kings are not captured: checkmate wins and stalemate
draws. Scores remain White–Black–Gold: winner 1, other two 0; surviving draw ½/½
with 0 for the eliminated side; three-way draw ⅓ each.

## Explicit app adjudications

Threefold repetition includes controller maps, original armies, reserves,
movement flags and active player. Fifty rounds without a capture or pawn move
draw (150 turns with three survivors, 100 with two); captures reset the count at
takeover. Three consecutive forced passes draw while three kings remain.
Bare kings draw. The other variants' minor/rook early material house draw is
not extended to Wellisch, where army transfer changes material control.
These policies are exposed in Rules, rather than attributed to the manuscript.

## Implementation

GameState::wellisch stores original army for every occupied cell, controllers,
captured reserves and consecutive passes. Empty cells carry origin 255. Native
validation checks players, kings, controller consistency, piece counts, reserve
types and rights, board shape, history and forbidden en passant. Standard
two-player hashes and serialized fields are preserved.

Tactical 0.9.0 dispatches Wellisch to iterative-deepening MaxN, carrying three
utilities and choosing each turn's best utility for that player. It observes the
existing time/node limits and provides a legal fallback if interrupted. Ordinary
two-player variants retain their negamax/quiescence search.

The game endpoint persists full native state and each action in the same
version-checked timeline. The existing 30-day retention applies. Undo in engine
mode restores the state before the latest human action, including both Tactical
replies. The board uses the existing renderer and 120-degree pass-and-play
rotations; pawn direction marks and accessible labels survive takeover.

## Verification

npm run test:native includes all six variants. Wellisch tests cover independent
45-piece setup, all cells/notation, rotational geometry, blocking, captures,
king safety against both opponents, swaps, promotion reserves, delayed promotion,
takeover and retained pawn directions, serialization rejection, draw clocks,
random complete games and MaxN self-play. tests/engine/wellisch-protocol.test.mjs
verifies correlated three-player moves, full state round trips, native changes,
reserve consumption and malformed rights. Release/browser evidence is recorded
in docs/ion-wellisch-release.md.
