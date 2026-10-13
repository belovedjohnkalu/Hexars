# McCooey rules and implementation

Primary references: [Dave McCooey’s rules](https://www.chessvariants.com/hexagonal.dir/hexchess2.html) and [the inventor’s sample games](https://www.chessvariants.com/hexagonal.dir/sample1.html). The setup is also independently listed in the [published board illustration](https://commons.wikimedia.org/wiki/File:McCooey_chess_setup.svg).

## Board and setup

The same radius-five, 91-cell axial board and conventional a–l files without j are used by Gliński and McCooey. Each side has 16 pieces: king, queen, two rooks, two knights, three bishops and seven pawns.

White: Kg1, Qe1, Rd1/Rh1, Ne2/Ng2, Bf1/Bf2/Bf3; pawns c1,d2,e3,f4,g3,h2,i1.

Black: Kg10, Qe10, Rd9/Rh9, Ne9/Ng9, Bf11/Bf10/Bf9; pawns c8,d8,e8,f8,g8,h8,i8.

## Differences from Gliński

White still advances (0,+1); Black advances (0,−1). White pawn captures are (+1,+1) and (−1,+2); Black captures are their opposites. These are one-step bishop diagonals. Adjacent off-diagonal pieces do not block a diagonal capture.

An unmoved pawn on its original starting cell may advance two cells when both cells are empty, except for the center f-file pawn. Moving pawns never regain the first-move option. Effective unmoved-pawn rights are part of McCooey’s repetition key and serialized positions must include pawn `hasMoved` values.

En passant applies on the immediately following turn when a double advance crosses an attacked cell. Published example: Black e8–e6 permits White d5×e7, removing the pawn on e6. Applying the capture still must preserve king safety.

Promotion at the far end of a file offers queen, rook, bishop or knight. Rook, bishop, queen, king and knight movements are shared with Gliński. There is no castling. McCooey stalemate scores ½–½ with no winner; search treats it as an equal draw. Gliński retains ¾–¼ stalemate scoring.

HEXARS’s previously requested automatic low-material house draw applies to both playable variants. It is explicitly separate from historical rules. Actual checkmate already delivered takes precedence.

## Architecture and compatibility

`shared/variants/mccooey.cpp` owns the setup and eligible double-advance cells. `variant.cpp` supplies a board/movement/result descriptor. The generic `shared/src/hex_rules.cpp` validates and applies every move. Tactical searches this same library. The native protocol and saved cloud states carry the actual variant; React only renders the supplied board and legal moves.

Gliński’s existing position hashes are preserved, so older saved game histories remain valid. McCooey has a separate hash domain and incorporates first-move pawn rights. Unsupported variants remain rejected.

## Independent verification

Native tests replay both complete historical sample games C and D through the public legal-move API and verify their checkmates. The original sample notation includes j and k; tests map them to the current k and l file labels.

Tests also cover both pawn colors, the center restriction, blockers, friendly restrictions, attack detection, en passant and its expiration, a pinned en-passant capture, malformed rights, promotion, equal stalemate scoring, the automatic house draw, bounded legal engine moves, full random games and Tactical-versus-random games. CMake/CTest includes a separate McCooey target alongside Gliński regression and geometry tests.
