#include "hexchess/rules.hpp"
#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace hexchess {
const std::vector<Hex>& glinskiCells() {
    static const auto cells = generateRegularHexBoard(5);
    return cells;
}

int glinskiIndex(Hex position) {
    const int q = position.q, r = position.r;
    if (std::max({std::abs(q), std::abs(r), std::abs(q + r)}) > 5) return -1;
    const int prefix = q <= 0 ? (q + 5) * (q + 16) / 2 : 51 + (q - 1) * 11 - (q - 1) * q / 2;
    return prefix + r - std::max(-5, -q - 5);
}

std::string glinskiNotation(Hex position) {
    if (glinskiIndex(position) < 0) throw std::invalid_argument("Cell outside Gliński board");
    constexpr char files[] = "abcdefghikl";
    const int rank = position.r - std::max(-5, -position.q - 5) + 1;
    return std::string(1, files[position.q + 5]) + std::to_string(rank);
}

Hex glinskiFromNotation(std::string_view notation) {
    constexpr std::string_view files = "abcdefghikl";
    if (notation.size() < 2 || notation.size() > 3) throw std::invalid_argument("Invalid board notation");
    const auto file = files.find(notation.front());
    if (file == std::string_view::npos) throw std::invalid_argument("Invalid file");
    int rank = 0;
    for (const char digit : notation.substr(1)) {
        if (digit < '0' || digit > '9') throw std::invalid_argument("Invalid rank");
        rank = rank * 10 + digit - '0';
    }
    const int q = static_cast<int>(file) - 5;
    const Hex position{q, rank + std::max(-5, -q - 5) - 1};
    if (rank < 1 || glinskiIndex(position) < 0 || glinskiNotation(position) != notation) throw std::invalid_argument("Invalid cell");
    return position;
}

bool glinskiPawnStart(Hex position, PlayerId player) {
    if (position.q < -4 || position.q > 4 || player > 1) return false;
    const int whiteR = position.q <= 0 ? -1 : -1 - position.q;
    // Black's nine pawns all begin on conventional rank seven.
    const int blackR = 6 + std::max(-5, -position.q - 5);
    return position.r == (player == 0 ? whiteR : blackR);
}

bool glinskiPromotionCell(Hex position, PlayerId player) {
    const int direction = player == 0 ? 1 : -1;
    return glinskiIndex(position) >= 0 && glinskiIndex({position.q, position.r + direction}) < 0;
}

GameState createGlinskiStartingPosition() {
    GameState state;
    state.occupants.resize(glinskiCells().size());
    const auto place = [&](std::string_view notation, PieceType type, PlayerId player) {
        state.occupants[glinskiIndex(glinskiFromNotation(notation))] = {type, player, false};
    };
    place("e1", PieceType::Queen, 0); place("g1", PieceType::King, 0);
    place("c1", PieceType::Rook, 0); place("i1", PieceType::Rook, 0);
    place("d1", PieceType::Knight, 0); place("h1", PieceType::Knight, 0);
    for (const auto cell : {"f1", "f2", "f3"}) place(cell, PieceType::Bishop, 0);
    for (const auto cell : {"b1", "c2", "d3", "e4", "f5", "g4", "h3", "i2", "k1"}) place(cell, PieceType::Pawn, 0);
    place("e10", PieceType::Queen, 1); place("g10", PieceType::King, 1);
    place("c8", PieceType::Rook, 1); place("i8", PieceType::Rook, 1);
    place("d9", PieceType::Knight, 1); place("h9", PieceType::Knight, 1);
    for (const auto cell : {"f11", "f10", "f9"}) place(cell, PieceType::Bishop, 1);
    for (const auto cell : {"b7", "c7", "d7", "e7", "f7", "g7", "h7", "i7", "k7"}) place(cell, PieceType::Pawn, 1);
    state.positionHistory.push_back(positionKey(state));
    validatePosition(state);
    return state;
}

GameState createGame(const VariantId& variant) {
    if (variant != "glinski") throw std::invalid_argument("Variant not implemented");
    return createGlinskiStartingPosition();
}
}
