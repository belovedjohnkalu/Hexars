#pragma once
#include "move.hpp"
#include <cstdint>
#include <string>
#include <vector>

namespace hexchess {
using VariantId = std::string;
struct GameState {
    VariantId variant{"glinski"};
    // Occupants follow the variant's explicit ordered valid-cell list.
    // This is not an 11x11 rectangular board or a Boolean side-to-move.
    std::vector<Piece> occupants;
    std::vector<PlayerId> turnOrder{0, 1};
    PlayerId activePlayer{0};
    int enPassantTarget{-1};
    int enPassantPawn{-1};
    int halfmoveClock{0};
    int ply{0};
    std::vector<std::uint64_t> positionHistory;
};
enum class ResultType { Ongoing, Checkmate, Stalemate, Repetition, FiftyMove, InsufficientMaterial, LowMaterialDraw };
struct GameResult {
    ResultType type{ResultType::Ongoing};
    int winner{-1};
    double scores[2]{0.5, 0.5};
};
}
