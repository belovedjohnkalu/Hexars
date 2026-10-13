#pragma once
#include "game_state.hpp"
#include <array>
#include <string_view>

namespace hexchess {
// A variant owns its board, pawn rules and result policy. The common generator
// shares the six orthodox hexagonal piece movements used by these two variants.
struct VariantDefinition {
    VariantId id;
    const std::vector<Hex>& (*cells)();
    int (*index)(Hex);
    std::string (*notation)(Hex);
    bool (*pawnDoubleCell)(Hex, PlayerId);
    bool pawnDoubleRequiresUnmoved;
    std::array<std::array<Hex, 2>, 2> pawnCaptures;
    bool fractionalStalemate;
};
const VariantDefinition& variantDefinition(const VariantId& id);
GameState createMcCooeyStartingPosition();
bool mccooeyPawnStart(Hex position, PlayerId player);
}
