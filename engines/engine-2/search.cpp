// Positional owns its strategic evaluation and full-width MaxN search. Only the
// protocol ABI and authoritative variant rules are shared with other engines.
#include "../engine-1/search.hpp"
#include "hexchess/wellisch.hpp"
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <unordered_map>

namespace hexchess::engine_one {
namespace {
using Utility = std::array<int, 3>;
constexpr int infinity = 2000000;
constexpr int values[]{0, 100, 325, 350, 525, 1000, 0};
int distance(Hex a, Hex b = {}) {
    return std::max({std::abs(a.q-b.q), std::abs(a.r-b.r), std::abs(a.q+a.r-b.q-b.r)});
}
bool alive(const GameState& s, PlayerId p) {
    return !s.wellisch || s.wellisch->controllers[p] == p;
}
Utility position(const GameState& s) {
    Utility material{}, quality{}, result{};
    const auto& cells = variantDefinition(s.variant).cells();
    int phase = 0;
    for (const auto p : s.occupants) if (!p.empty() && p.type != PieceType::Pawn && p.type != PieceType::King)
        phase += values[static_cast<int>(p.type)];
    for (std::size_t i=0; i<s.occupants.size(); ++i) {
        const auto p = s.occupants[i]; if (p.empty()) continue;
        material[p.player] += values[static_cast<int>(p.type)];
        const int central = 6-distance(cells[i]);
        int support=0, pawnSupport=0, sameFile=0;
        for (std::size_t j=0; j<s.occupants.size(); ++j) {
            const auto other=s.occupants[j];
            if (i==j || other.empty() || other.player!=p.player) continue;
            if (distance(cells[i],cells[j])<=2) { ++support; if(other.type==PieceType::Pawn) ++pawnSupport; }
            if (other.type==PieceType::Pawn && cells[i].q==cells[j].q) ++sameFile;
        }
        int bonus=0;
        if (p.type==PieceType::Pawn) {
            // Pawn direction survives army takeover in Wellisch.
            const auto h=s.wellisch ? wellisch::rotate(cells[i],-static_cast<int>(s.wellisch->origins[i])) : cells[i];
            const int advance=s.wellisch ? h.q+h.r : (p.player==0 ? cells[i].r : -cells[i].r);
            bonus=central*4 + advance*7 + std::min(pawnSupport,3)*12;
            if(pawnSupport==0) bonus-=18;
            if(!s.wellisch && sameFile>0) bonus-=12;
        } else if(p.type==PieceType::King) {
            bonus=phase<2500 ? central*14 : pawnSupport*20-central*5;
        } else {
            bonus=central*(p.type==PieceType::Knight?15:7)+std::min(support,4)*4;
            if(p.type==PieceType::Rook && sameFile==0) bonus+=18;
        }
        quality[p.player]+=bonus;
    }
    int count=0, total=0;
    for(const auto p:s.turnOrder) if(alive(s,p)) {++count; total+=material[p]+quality[p];}
    for(const auto p:s.turnOrder) result[p]=alive(s,p)
        ? (material[p]+quality[p])*count-total : -1000000;
    return result;
}
Utility terminal(const GameResult& result) {
    Utility out{};
    for(int p=0;p<3;++p) out[p]=static_cast<int>((result.scores[p]*2-1)*1000000);
    return out;
}
// Repetition and fifty-move context are part of the cache key. A board-only
// transposition key would incorrectly reuse scores across distinct draw rights.
std::uint64_t cacheKey(const GameState& s) {
    auto key=positionKey(s) ^ (static_cast<std::uint64_t>(s.halfmoveClock)<<48);
    for(auto item:s.positionHistory) key ^= item + 0x9e3779b97f4a7c15ULL + (key<<6) + (key>>2);
    return key;
}
struct Entry {int depth; Utility utility; Move best;};
struct Search {
    SearchLimits limits;
    std::chrono::steady_clock::time_point deadline;
    int nodes=0;
    bool stopped=false;
    std::unordered_map<std::uint64_t,Entry> table;
    bool expired() { return stopped=stopped || nodes>=limits.nodeLimit || std::chrono::steady_clock::now()>=deadline; }
    Utility visit(const GameState& s,int depth) {
        ++nodes;
        if(expired()) return position(s);
        const auto key=cacheKey(s);
        const auto found=table.find(key);
        if(found!=table.end() && found->second.depth>=depth) return found->second.utility;
        const auto moves=generateLegalMoves(s);
        const auto result=getGameResult(s,moves);
        if(result.type!=ResultType::Ongoing) return terminal(result);
        if(depth==0) return position(s);
        struct Branch {GameState state; Move move; int priority;};
        std::vector<Branch> branches;
        for(const auto& move:moves) {
            if(expired()) return position(s);
            auto next=applyCandidateMove(s,move);
            int priority=position(next)[s.activePlayer];
            if(found!=table.end() && move==found->second.best) priority+=infinity;
            branches.push_back({std::move(next),move,priority});
        }
        std::stable_sort(branches.begin(),branches.end(),[](const auto& a,const auto& b){return a.priority>b.priority;});
        Utility best{}; int bestScore=-infinity; Move chosen=branches.front().move;
        for(const auto& branch:branches) {
            if(expired()) return position(s);
            const auto score=visit(branch.state,depth-1);
            if(score[s.activePlayer]>bestScore) {best=score; bestScore=score[s.activePlayer]; chosen=branch.move;}
        }
        if(!stopped && table.size()<50000) table.insert_or_assign(key,Entry{depth,best,chosen});
        return best;
    }
};
}
int evaluate(const GameState& s) {return position(s)[s.activePlayer];}
SearchResult search(const GameState& s,SearchLimits limits) {
    validatePosition(s);
    const auto start=std::chrono::steady_clock::now();
    limits.timeMs=std::clamp(limits.timeMs,1,4000);
    limits.depth=std::clamp(limits.depth,1,5);
    limits.nodeLimit=std::clamp(limits.nodeLimit,1,1000000);
    Search context{limits,start+std::chrono::milliseconds(limits.timeMs),0,false,{}};
    SearchResult out;
    auto moves=generateLegalMoves(s);
    const auto ending=getGameResult(s,moves);
    if(ending.type!=ResultType::Ongoing) {out.score=terminal(ending)[s.activePlayer]; return out;}
    out.move=moves.front(); out.score=evaluate(s);
    // Keep the result of the last complete iteration; partial iterations cannot
    // replace it with a move that benefited from an incomplete opponent reply.
    for(int depth=1;depth<=limits.depth;++depth) {
        int best=-infinity; Move chosen=*out.move; bool complete=true;
        for(const auto& move:moves) {
            if(context.expired()) {complete=false; break;}
            const auto utility=context.visit(applyCandidateMove(s,move),depth-1);
            if(context.stopped) {complete=false; break;}
            if(utility[s.activePlayer]>best) {best=utility[s.activePlayer]; chosen=move;}
        }
        if(!complete) break;
        out.move=chosen; out.score=best; out.depth=depth;
        std::stable_sort(moves.begin(),moves.end(),[&](const auto& a,const auto& b){return (a==chosen)>(b==chosen);});
        if(best>=1000000) break;
    }
    out.nodes=context.nodes;
    out.timeMs=static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-start).count());
    return out;
}
}
