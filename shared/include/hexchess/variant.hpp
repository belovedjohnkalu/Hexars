#pragma once
#include "game_state.hpp"
#include <array>
#include <string_view>

namespace hexchess {
// A variant owns its board, pawn rules and result policy. The common generator
// shares the six orthodox hexagonal piece movements used by these variants.
struct CastlingPlan { Hex kingFrom,kingTo,rookFrom,rookTo; };
struct VariantDefinition {
    VariantId id;
    const std::vector<Hex>& (*cells)();
    int (*index)(Hex);
    std::string (*notation)(Hex);
    bool (*pawnDoubleCell)(Hex, PlayerId);
    bool pawnDoubleRequiresUnmoved;
    std::array<std::array<Hex, 2>, 2> pawnCaptures;
    bool fractionalStalemate;
    int (*pawnInitialAdvance)(Hex, PlayerId){nullptr};
    bool castling{false};
    std::vector<Hex> (*pawnForwards)(PlayerId){nullptr};
    bool (*promotionCell)(Hex,PlayerId){nullptr};
    std::vector<CastlingPlan> (*castlePlans)(PlayerId){nullptr};
    bool pawnInitialExtraCapture{false};
    bool enemyBlocksBothPawnAdvances{false};
    bool pointyBoard{false};
};
const VariantDefinition& variantDefinition(const VariantId& id);
GameState createMcCooeyStartingPosition();
bool mccooeyPawnStart(Hex position, PlayerId player);
const std::vector<Hex>& shafranCells();
int shafranIndex(Hex position);
std::string shafranNotation(Hex position);
Hex shafranFromNotation(std::string_view notation);
bool shafranPawnStart(Hex position, PlayerId player);
int shafranPawnInitialAdvance(Hex position, PlayerId player);
GameState createShafranStartingPosition();
}
