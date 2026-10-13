#include "hexchess/rules.hpp"
#include "hexchess/variant.hpp"
#include <algorithm>

namespace hexchess {
bool mccooeyPawnStart(Hex position, PlayerId player) {
    if (position.q < -3 || position.q > 3 || position.q == 0 || player > 1) return false;
    const int whiteR = position.q <= 0 ? -2 : -2 - position.q;
    const int blackR = 7 + std::max(-5, -position.q - 5);
    return position.r == (player == 0 ? whiteR : blackR);
}
GameState createMcCooeyStartingPosition() {
    GameState state;
    state.variant = "mccooey";
    state.occupants.resize(glinskiCells().size());
    const auto place = [&](std::string_view notation, PieceType type, PlayerId player) {
        state.occupants[glinskiIndex(glinskiFromNotation(notation))] = {type, player, false};
    };
    place("e1", PieceType::Queen, 0); place("g1", PieceType::King, 0);
    place("d1", PieceType::Rook, 0); place("h1", PieceType::Rook, 0);
    place("e2", PieceType::Knight, 0); place("g2", PieceType::Knight, 0);
    for (const auto cell : {"f1", "f2", "f3"}) place(cell, PieceType::Bishop, 0);
    for (const auto cell : {"c1", "d2", "e3", "f4", "g3", "h2", "i1"}) place(cell, PieceType::Pawn, 0);
    place("e10", PieceType::Queen, 1); place("g10", PieceType::King, 1);
    place("d9", PieceType::Rook, 1); place("h9", PieceType::Rook, 1);
    place("e9", PieceType::Knight, 1); place("g9", PieceType::Knight, 1);
    for (const auto cell : {"f11", "f10", "f9"}) place(cell, PieceType::Bishop, 1);
    for (const auto cell : {"c8", "d8", "e8", "f8", "g8", "h8", "i8"}) place(cell, PieceType::Pawn, 1);
    state.positionHistory.push_back(positionKey(state));
    validatePosition(state);
    return state;
}
}
