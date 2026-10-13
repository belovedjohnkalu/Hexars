#pragma once
#include "hexchess/rules.hpp"
#include <optional>

namespace hexchess::engine_one {
struct SearchLimits { int timeMs{750}; int depth{3}; int nodeLimit{30000}; };
struct SearchResult {
    std::optional<Move> move;
    int score{0};
    int depth{0};
    int nodes{0};
    int timeMs{0};
};
SearchResult search(const GameState& state, SearchLimits limits = {});
int evaluate(const GameState& state);
}
