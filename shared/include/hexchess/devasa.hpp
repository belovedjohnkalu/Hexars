#pragma once
#include "game_state.hpp"
#include <array>
#include <string_view>

// Variant-specific board, setup and special-move geometry.
namespace hexchess::devasa {
const std::vector<Hex>& cells();
int index(Hex position);
std::string notation(Hex position);
Hex fromNotation(std::string_view value);
GameState startingPosition();
std::array<Hex,2> pawnForwardDirections(PlayerId player);
std::array<Hex,2> pawnCaptureDirections(PlayerId player);
bool pawnStartingCell(Hex position,PlayerId player);
bool promotionCell(Hex position,PlayerId player);
struct CastlePlan { Hex kingFrom,kingTo,rookFrom,rookTo; };
std::array<CastlePlan,2> castlePlans(PlayerId player);
}
