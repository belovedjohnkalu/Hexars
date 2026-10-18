#pragma once
#include "game_state.hpp"
#include <array>
#include <string_view>

// Work in progress: board/setup only. Not registered with createGame or Tactical.
// Calling the shared move generator on this setup deliberately rejects the
// unsupported variant rather than applying another variant's pawn rules.
namespace hexchess::brusky {
const std::vector<Hex>& cells();
int index(Hex position);
std::string notation(Hex position);
Hex fromNotation(std::string_view notation);
GameState startingPosition();
std::array<Hex,2> pawnForwardDirections(PlayerId player);
bool pawnStartingCell(Hex position,PlayerId player);
bool promotionCell(Hex position,PlayerId player);
struct CastlePlan { Hex kingFrom,kingTo,rookFrom,rookTo; };
std::array<CastlePlan,2> castlePlans(PlayerId player);
}
