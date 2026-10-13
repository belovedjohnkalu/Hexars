#pragma once
#include "hexchess/rules.hpp"
#include "json.hpp"
#include <optional>

namespace hexchess::engine_one {
using Json = nlohmann::json;
Json processRequest(const Json& request, std::optional<GameState>& state);
Json encodeState(const GameState& state);
GameState decodeState(const Json& value);
Json describeGame(const GameState& state);
}
