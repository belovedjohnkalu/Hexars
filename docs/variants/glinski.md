# Gliński rules and coordinate conventions

References consulted: [Gliński overview](https://en.wikipedia.org/wiki/Hexagonal_chess#Gli%C5%84ski's_hexagonal_chess) and [Chess Variants hexagonal chess](https://www.chessvariants.org/hexagonal.dir/hexagonal.html). The independent historical seven-ply checkmate below is also an integration fixture.

## Coordinates and starting position

Axial regular hex radius five: 91 cells. Files are `a b c d e f g h i k l`, omitting j. For file q = index − 5, `rMin = max(-5, -q-5)` and rank = r − rMin + 1. White advances (0,+1); the flat-top UI renders White at the bottom.

White: Qe1, Kg1, Rc1/Ri1, Nd1/Nh1, Bf1/Bf2/Bf3; pawns b1,c2,d3,e4,f5,g4,h3,i2,k1.

Black: Qe10, Kg10, Rc8/Ri8, Nd9/Nh9, Bf11/Bf10/Bf9; pawns b7,c7,d7,e7,f7,g7,h7,i7,k7.

Each player has 18 pieces, including three bishops and nine pawns.

## Movement and endings

Rooks follow six edge directions. Bishops follow six vertex diagonals and stay on their cell colour. Queen combines both; king takes one step in either pattern. Knights have twelve jumps. All moves enforce blockers, friendly occupancy and king safety.

White pawns capture (+1,0) and (−1,+1); Black uses the opposite directions. A pawn on any original friendly pawn cell may make a clear double advance, including after a capture onto that cell. En passant is available only immediately after a double advance; removing the captured pawn must not expose the moving king. Promotion is mandatory at the forward boundary, to queen, rook, bishop or knight. There is no castling.

Checkmate scores 1–0; stalemate scores ¾ for the delivering player and ¼ for the stalemated player. This application automatically adjudicates threefold repetition and the fifty-move threshold rather than offering claim buttons. Bare kings are drawn. It conservatively does not classify other low-material endings as automatic draws; a lone minor can mate in exceptional hexagonal configurations.

## Independent fixtures

Historical fool’s mate: e1–c3, e10–c6, b1–b2, b7–b6, f3–b1, e7–e6, c3×f9#.

Stalemate: White Kh8/Qe8; Black Kf11, Black to move → White ¾, Black ¼.

Lone-bishop mate: White Kf9/Bg9; Black Kf11, Black to move. This guards against copying ordinary chess insufficient-material assumptions.

Native tests also exercise pins, king adjacency, twelve knight jumps, blocking, en-passant discovered checks, restored double advances, every promotion option, repetition hashing, result handling and full games. Random game tests supplement independent fixtures; they are not a substitute for an external certified rules implementation.
