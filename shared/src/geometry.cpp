#include "hexchess/geometry.hpp"

#include <algorithm>
#include <array>
#include <stdexcept>

namespace hexchess {

std::vector<Hex> generateRegularHexBoard(int radius) {
    if (radius < 0 || radius > 100) {
        throw std::invalid_argument("Board radius must be between 0 and 100");
    }
    std::vector<Hex> cells;
    for (int q = -radius; q <= radius; ++q) {
        const int rMin = std::max(-radius, -q - radius);
        const int rMax = std::min(radius, -q + radius);
        for (int r = rMin; r <= rMax; ++r) cells.push_back({q, r});
    }
    return cells;
}

bool isValidCell(const Board& board, Hex position) {
    return board.cells.contains(position);
}

template <std::size_t N>
static std::vector<Hex> neighbours(const Board& board, Hex position,
                                   const std::array<Hex, N>& directions) {
    std::vector<Hex> result;
    if (!isValidCell(board, position)) return result;
    for (const auto direction : directions) {
        const Hex destination{position.q + direction.q, position.r + direction.r};
        if (isValidCell(board, destination)) result.push_back(destination);
    }
    return result;
}

std::vector<Hex> getEdgeNeighbours(const Board& board, Hex position) {
    constexpr std::array<Hex, 6> directions{{{1, 0}, {1, -1}, {0, -1},
                                            {-1, 0}, {-1, 1}, {0, 1}}};
    return neighbours(board, position, directions);
}

std::vector<Hex> getVertexNeighbours(const Board& board, Hex position) {
    constexpr std::array<Hex, 6> directions{{{2, -1}, {1, -2}, {-1, -1},
                                            {-2, 1}, {-1, 2}, {1, 1}}};
    return neighbours(board, position, directions);
}

int cellColour(Hex position) {
    return ((position.q - position.r) % 3 + 3) % 3;
}

} // namespace hexchess
