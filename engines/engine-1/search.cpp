#include "search.hpp"
#include <algorithm>
#include <chrono>
#include <cmath>

namespace hexchess::engine_one {
static constexpr int values[]{0,100,350,325,525,1000,0};
int evaluate(const GameState& state) {
    int score = 0;
    const auto& cells = variantDefinition(state.variant).cells();
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (piece.empty()) continue;
        const auto cell = cells[index];
        const int distance = std::max({std::abs(cell.q),std::abs(cell.r),std::abs(cell.q + cell.r)});
        int value = values[static_cast<int>(piece.type)];
        if (piece.type == PieceType::Knight || piece.type == PieceType::Bishop) value += (5 - distance) * 7;
        if (piece.type == PieceType::Pawn) value += (piece.player == 0 ? cell.r + 5 : 5 - cell.r) * 4;
        if (piece.type == PieceType::Queen) value += (5 - distance) * 2;
        score += piece.player == state.activePlayer ? value : -value;
    }
    return score;
}

struct Search {
    SearchLimits limits;
    std::chrono::steady_clock::time_point deadline;
    int nodes{0};
    bool stopped{false};

    bool expired() {
        if (nodes >= limits.nodeLimit || std::chrono::steady_clock::now() >= deadline) stopped = true;
        return stopped;
    }

    int ordering(const GameState& state, const Move& move) {
        const auto source = state.occupants[variantDefinition(state.variant).index(move.from)];
        const auto target = state.occupants[variantDefinition(state.variant).index(move.to)];
        const bool enPassant = isEnPassantCapture(state,move);
        return (target.empty() ? (enPassant ? 1000 : 0) : values[static_cast<int>(target.type)] * 10 - values[static_cast<int>(source.type)]) +
               (move.promotion == PieceType::None ? 0 : values[static_cast<int>(move.promotion)] * 10);
    }

    void order(const GameState& state, std::vector<Move>& moves) {
        std::stable_sort(moves.begin(),moves.end(),[&](const auto& a,const auto& b){return ordering(state,a)>ordering(state,b);});
    }

    int terminal(const GameState& state, const GameResult& result, int ply) {
        if (result.type == ResultType::Checkmate) return -100000 + ply;
        if (result.type == ResultType::Stalemate) return result.winner < 0 ? 0 : -10000 + ply;
        (void)state;
        return 0;
    }

    int quiescence(const GameState& state, int alpha, int beta, int remaining, int ply) {
        ++nodes;
        if (expired()) return evaluate(state);
        auto moves = generateLegalMoves(state);
        const auto result = getGameResult(state,moves);
        if (result.type != ResultType::Ongoing) return terminal(state,result,ply);
        const int standPat = evaluate(state);
        const bool check = isInCheck(state,state.activePlayer);
        if (remaining <= 0) return standPat;
        if (!check) {
            if (standPat >= beta) return beta;
            alpha = std::max(alpha,standPat);
            moves.erase(std::remove_if(moves.begin(),moves.end(),[&](const auto& move){return ordering(state,move)==0;}),moves.end());
        }
        order(state,moves);
        for (const auto& move : moves) {
            const int score = -quiescence(applyCandidateMove(state,move),-beta,-alpha,remaining-1,ply+1);
            if (stopped) return alpha;
            if (score >= beta) return beta;
            alpha = std::max(alpha,score);
        }
        return alpha;
    }

    int negamax(const GameState& state, int depth, int alpha, int beta, int ply) {
        if (depth <= 0) return quiescence(state,alpha,beta,2,ply);
        ++nodes;
        if (expired()) return evaluate(state);
        auto moves = generateLegalMoves(state);
        const auto result = getGameResult(state,moves);
        if (result.type != ResultType::Ongoing) return terminal(state,result,ply);
        order(state,moves);
        for (const auto& move : moves) {
            const int score = -negamax(applyCandidateMove(state,move),depth-1,-beta,-alpha,ply+1);
            if (stopped) return alpha;
            if (score >= beta) return beta;
            alpha = std::max(alpha,score);
        }
        return alpha;
    }
};

SearchResult search(const GameState& state, SearchLimits limits) {
    validatePosition(state);
    limits.timeMs = std::clamp(limits.timeMs,1,5000);
    limits.depth = std::clamp(limits.depth,1,5);
    limits.nodeLimit = std::clamp(limits.nodeLimit,1,1000000);
    const auto start = std::chrono::steady_clock::now();
    Search context{limits,start + std::chrono::milliseconds(limits.timeMs)};
    SearchResult result;
    auto moves = generateLegalMoves(state);
    if (getGameResult(state,moves).type != ResultType::Ongoing) return result;
    context.order(state,moves);
    result.move = moves.front();
    result.score = evaluate(state);
    for (int depth = 1; depth <= limits.depth; ++depth) {
        if (context.expired()) break;
        int alpha = -200000;
        auto best = moves.front();
        for (const auto& move : moves) {
            const int score = -context.negamax(applyCandidateMove(state,move),depth-1,-200000,-alpha,1);
            if (context.stopped) break;
            if (score > alpha) { alpha = score; best = move; }
        }
        if (context.stopped) break; // Keep the best fully completed iteration.
        result.move = best;
        result.score = alpha;
        result.depth = depth;
        const auto found = std::find(moves.begin(),moves.end(),best);
        if (found != moves.end()) std::rotate(moves.begin(),found,found+1);
    }
    result.nodes = context.nodes;
    result.timeMs = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-start).count());
    return result;
}
}
