# Wellisch — experimental foundation

This module is **not playable** and is not advertised by Tactical or added to
ION’s board selector. It is a separate CMake library and test target, so the five
existing native variants and their saved-state hashes remain unchanged.

## References checked on 2026-10-18

- [Ludii Wellisch Chess description](https://ludii.games/details.php?keyword=Wellisch+Chess)
- [Ludii formal game description](https://ludii.games/lud/games/Wellisch%20Chess.lud)
- [Hexagonal chess overview](https://en.wikipedia.org/wiki/Hexagonal_chess#Wellisch's_hexagonal_chess)

The original 1912 manuscript has not been independently obtained. Ludii’s default
ends at the first king capture; its description distinguishes this from the
original takeover of the captured army. That default is **not** being adopted as
ION’s historical victory rule. No reference image or third-party source code is
shipped.

## Implemented

A regular 91-cell board; a–k files including j; axial/notation conversion;
120-degree rotations; and independently checked starting fixtures for all three
players. Each army has 15 pieces: king, queen, two rooks, three knights and eight
pawns. White’s king is d1, queen c1, rooks b1/e1, knights a1/d2/f1, and pawns
 a2/b2/c2/d3/e3/e2/f2/g2. The other armies are 120-degree rotations.

The separate `wellisch::Position` keeps a three-player turn order, eliminated
player flags, each army’s promotion reserve, and each pawn’s original direction
independently of future army allegiance. Promotion choices can only come from
captured queens, rooks or knights of that pawn’s army; no reserve means no
immediate promotion choice.

Empty-board geometry supplies six edge king steps, six adjacent vertex knight
jumps, six rook rays, rook-plus-knight queen movement, and two forward edge
pawn steps. There are no bishops. Per-player promotion edges and king–rook
castling swap endpoints are recorded. These are geometric destinations and
metadata, **not legal moves**.

## Still required before play

Occupancy/captures, attack detection against two opponents, king safety, exact
castling rights and check treatment, delayed promotion/reserve consumption,
turn skipping and captured-army takeover, repetition/termination rules, full
serialization and three-player results. Historical ambiguities need independent
fixtures before implementation. Tactical needs an explicit multiplayer strategy
such as MaxN; its two-player minimax is not reused unchanged.

## Verification

The dedicated test passes 20,034 assertions covering the independently listed
45-piece setup, all cells, notation round trips, three rotations, color-bound
knights, movement bounds and rotational equivalence, promotion reserves, and
invalid inputs. It also verifies `createGame("wellisch")` still rejects the
unsupported playable variant. Run `npm run test:native` or CMake/CTest.
