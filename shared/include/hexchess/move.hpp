#pragma once
#include "geometry.hpp"
#include "pieces.hpp"

namespace hexchess {
struct Move {
    Hex from;
    Hex to;
    PieceType promotion{PieceType::None};
    bool pass{false};
    auto operator<=>(const Move&) const = default;
};
}
