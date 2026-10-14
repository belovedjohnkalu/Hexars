#include "hexchess/rules.hpp"
#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace hexchess {
const std::vector<Hex>& shafranCells() {
    static const auto cells = [] {
        std::vector<Hex> result;
        for (int q = -4; q <= 4; ++q)
            for (int r = std::max(-5, -5-q); r <= std::min(4, 4-q); ++r)
                result.push_back({q,r});
        return result;
    }();
    return cells;
}
int shafranIndex(Hex position) {
    const auto [q,r] = position;
    if (q < -4 || q > 4 || r < -5 || r > 4 || q+r < -5 || q+r > 4) return -1;
    const int prefix = q <= 0 ? (q+4)*(q+15)/2 : 40+(q-1)*10-(q-1)*q/2;
    return prefix + r - std::max(-5,-5-q);
}
std::string shafranNotation(Hex position) {
    if (shafranIndex(position) < 0) throw std::invalid_argument("Cell outside Shafran board");
    // Unlike Gliński's ranks, Shafran uses continuous oblique ranks 1–10.
    return std::string(1,static_cast<char>('e'+position.q)) + std::to_string(position.r+position.q+6);
}
Hex shafranFromNotation(std::string_view notation) {
    if (notation.size() < 2 || notation.size() > 3 || notation[0] < 'a' || notation[0] > 'i')
        throw std::invalid_argument("Invalid Shafran notation");
    int rank = 0;
    for (const char c : notation.substr(1)) {
        if (c < '0' || c > '9') throw std::invalid_argument("Invalid Shafran rank");
        rank = rank*10+c-'0';
    }
    const int q = notation[0]-'e';
    const Hex cell{q,rank-q-6};
    if (shafranIndex(cell) < 0 || shafranNotation(cell) != notation)
        throw std::invalid_argument("Invalid Shafran cell");
    return cell;
}
bool shafranPawnStart(Hex position, PlayerId player) {
    if (shafranIndex(position) < 0 || player > 1) return false;
    const int start = player == 0 ? std::max(-5,-5-position.q)+1 : std::min(4,4-position.q)-1;
    return position.r == start;
}
int shafranPawnInitialAdvance(Hex position, PlayerId player) {
    if (!shafranPawnStart(position,player)) return 1;
    const int file = std::abs(position.q);
    return file <= 1 ? 3 : file <= 3 ? 2 : 1;
}
GameState createShafranStartingPosition() {
    GameState state;
    state.variant = "shafran";
    state.occupants.resize(shafranCells().size());
    const auto placeBoth = [&](std::string_view notation, PieceType type) {
        const auto white = shafranFromNotation(notation);
        const Hex black{-white.q,-white.r-1};
        state.occupants[shafranIndex(white)] = {type,0,false};
        state.occupants[shafranIndex(black)] = {type,1,false};
    };
    placeBoth("e1",PieceType::King); placeBoth("d1",PieceType::Queen);
    for (const auto cell : {"a1","i5"}) placeBoth(cell,PieceType::Rook);
    for (const auto cell : {"b1","g3"}) placeBoth(cell,PieceType::Knight);
    for (const auto cell : {"c1","f2","h4"}) placeBoth(cell,PieceType::Bishop);
    for (const auto cell : {"a2","b2","c2","d2","e2","f3","g4","h5","i6"}) placeBoth(cell,PieceType::Pawn);
    state.positionHistory.push_back(positionKey(state));
    validatePosition(state);
    return state;
}
}
