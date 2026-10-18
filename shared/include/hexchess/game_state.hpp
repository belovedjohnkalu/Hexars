#pragma once
#include "move.hpp"
#include <cstdint>
#include <array>
#include <optional>
#include <string>
#include <vector>

namespace hexchess {
using VariantId = std::string;
struct WellischRights {
    // Original army stays independent of current control (especially pawns).
    std::vector<PlayerId> origins;
    std::array<PlayerId,3> controllers{0,1,2};
    std::array<std::vector<PieceType>,3> reserves;
    int consecutivePasses{0};
};
struct GameState {
    VariantId variant{"glinski"};
    // Occupants follow the variant's explicit ordered valid-cell list.
    // This is not an 11x11 rectangular board or a Boolean side-to-move.
    std::vector<Piece> occupants;
    std::vector<PlayerId> turnOrder{0, 1};
    PlayerId activePlayer{0};
    int enPassantTarget{-1};
    int enPassantPawn{-1};
    // Shafran's three-cell advance exposes two crossed cells for one turn.
    // The first remains enPassantTarget for backward-compatible saved games.
    std::vector<int> additionalEnPassantTargets;
    int halfmoveClock{0};
    int ply{0};
    std::vector<std::uint64_t> positionHistory;
    std::optional<WellischRights> wellisch;
};
enum class ResultType { Ongoing, Checkmate, Stalemate, Repetition, FiftyMove, InsufficientMaterial, LowMaterialDraw, Conquest };
struct GameResult {
    ResultType type{ResultType::Ongoing};
    int winner{-1};
    double scores[3]{0.5, 0.5, 0};
};
}
