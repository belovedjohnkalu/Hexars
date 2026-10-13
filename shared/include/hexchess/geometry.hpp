#pragma once

#include <compare>
#include <set>
#include <vector>

namespace hexchess {

struct Hex {
    int q;
    int r;
    auto operator<=>(const Hex&) const = default;
};

// Valid cells, rather than a rectangular array, accommodate future board shapes.
struct Board {
    std::set<Hex> cells;
};

std::vector<Hex> generateRegularHexBoard(int radius);
bool isValidCell(const Board& board, Hex position);
std::vector<Hex> getEdgeNeighbours(const Board& board, Hex position);
std::vector<Hex> getVertexNeighbours(const Board& board, Hex position);
int cellColour(Hex position);

} // namespace hexchess
