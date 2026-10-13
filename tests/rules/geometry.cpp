#include "hexchess/geometry.hpp"

#include <algorithm>
#include <cmath>
#include <iostream>
#include <stdexcept>

static void require(bool condition, const char* message) {
    if (!condition) throw std::runtime_error(message);
}

int main() {
    using namespace hexchess;
    for (int radius = 0; radius <= 10; ++radius) {
        const auto cells = generateRegularHexBoard(radius);
        const Board board{{cells.begin(), cells.end()}};
        require(cells.size() == static_cast<std::size_t>(3 * radius * (radius + 1) + 1), "Incorrect cell count");
        require(board.cells.size() == cells.size(), "Duplicate cells");
        for (const auto cell : cells) {
            require(std::max({std::abs(cell.q), std::abs(cell.r), std::abs(cell.q + cell.r)}) <= radius, "Cell out of bounds");
            for (const auto edge : getEdgeNeighbours(board, cell)) {
                require(cellColour(edge) != cellColour(cell), "Edge neighbours must have different colours");
                const auto reverse = getEdgeNeighbours(board, edge);
                require(std::find(reverse.begin(), reverse.end(), cell) != reverse.end(), "Asymmetric neighbour relationship");
            }
            for (const auto vertex : getVertexNeighbours(board, cell)) {
                require(cellColour(vertex) == cellColour(cell), "Vertex neighbours must preserve colour");
            }
        }
    }
    const auto cells = generateRegularHexBoard(5);
    const Board board{{cells.begin(), cells.end()}};
    require(cells.size() == 91, "Gliński must have 91 cells");
    require(getEdgeNeighbours(board, {0, 0}).size() == 6, "Centre must have six edge neighbours");
    require(getVertexNeighbours(board, {0, 0}).size() == 6, "Centre must have six vertex neighbours");
    require(getEdgeNeighbours(board, {5, 0}).size() == 3, "Corner must have three edge neighbours");
    require(!isValidCell(board, {6, 0}), "Invalid cell accepted");
    require(getEdgeNeighbours(board, {6, 0}).empty(), "Invalid source has neighbours");
    bool rejected = false;
    try { generateRegularHexBoard(-1); } catch (const std::invalid_argument&) { rejected = true; }
    require(rejected, "Negative radius accepted");
    const Board irregular{{{0, 0}, {1, 0}, {2, -1}}};
    require(getEdgeNeighbours(irregular, {0, 0}).size() == 1, "Irregular boundary ignored");
    require(getVertexNeighbours(irregular, {0, 0}).size() == 1, "Irregular vertex boundary ignored");
    std::cout << "Geometry tests passed: 91 cells, neighbours, colours, irregular boards, bounds\n";
}
