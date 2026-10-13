#pragma once
#include <cstdint>

namespace hexchess {
using PlayerId = std::uint8_t;
enum class PieceType : std::uint8_t { None, Pawn, Knight, Bishop, Rook, Queen, King };
struct Piece {
    PieceType type{PieceType::None};
    PlayerId player{0};
    bool hasMoved{false};
    bool empty() const { return type == PieceType::None; }
};
}
