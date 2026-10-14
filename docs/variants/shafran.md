# Shafran

Implemented as its own variant module, using the common hexagonal rook, bishop, queen, king and knight movements. Board coordinates, notation, setup, pawn rights, castling and endgame scoring come from the variant, not React.

References checked on 2026-10-14:

- [Green Chess: Shafran rules and castling diagrams](https://www.greenchess.net/en/rules.php?v=shafran), an independently playable implementation with explicit short/long castling diagrams.
- [Starting-position diagram](https://commons.wikimedia.org/wiki/File:Shafran_Chess_Setup.png), used for verifying the arrangement and oblique notation.
- [Hexagonal chess: Shafran section](https://en.wikipedia.org/wiki/Hexagonal_chess#Shafran's_hexagonal_chess), including the black castling and en-passant examples.

The original inventor's rules manuscript was not located. Castling summaries conflict: some omit short castling or describe an ordinary two-cell castle only. HEXARS follows Green Chess's four diagrammed options, which agree with the illustrated short/long examples in the overview. No reference image is shipped as an app asset.

## Geometry and position

Nine files a–i, with lengths 6,7,8,9,10,9,8,7,6: 70 cells. Axial q ranges from −4 to 4; r and q+r each range from −5 to 4. The board's rotational center is (0,−½), rather than a cell. Conventional rank is r+q+6. White's king is e1, queen d1, rooks a1/i5, knights b1/g3, bishops c1/f2/h4, and pawns a2/b2/c2/d2/e2/f3/g4/h5/i6. Black is the 180-degree arrangement (−q,−r−1).

## Special moves

Only an unmoved pawn on its original starting hex can advance more than once. Files d/e/f allow up to three cells, b/c/g/h up to two, and a/i one. Every traversed cell must be vacant. Pawn captures use the two forward bishop directions. A triple advance exposes both crossed hexagons to en passant, for the immediate reply only. Each possible capture must leave its own king safe. Promotion takes place on the opposite board edge, with queen, rook, bishop or knight choices.

An unmoved king on its starting hex may castle with either unmoved original rook if the intervening three cells are empty and its starting, transit and destination hexagons are safe. A short castle moves the king two edge steps toward that rook and places the rook on the preceding king-path hexagon. A long castle moves the king three steps and places the rook on the second hexagon. White's destinations are c1/b1 on the queen flank and g3/h4 on the bishop flank. Black's are g10/h10 and c8/b7. King and rook rights are included in repetition keys and serialized state. Missing movement-right fields are rejected for Shafran's kings, rooks and pawns.

Stalemate scores ½–½. Checkmate, repetition, the fifty-move counter and HEXARS' configured early low-material house draw are also enforced. The native Tactical engine supports this variant through the same versioned protocol. Legacy Gliński and McCooey position hashes remain unchanged.

## Validation

Independent fixtures cover geometry/notation landmarks, setup, both players' pawn advances, blockers, captures, promotion, pins, both crossed en-passant cells, expiry, pinned en passant, all eight castles, moved kings/rooks, occupied paths, check, transit attacks, repetition rights, checkmate and stalemate. Complete random and engine games validate every successive position. Protocol tests cover malformed rights, state round-trips, both empty-cell capture indicators, castling of both pieces and bounded legal search.
