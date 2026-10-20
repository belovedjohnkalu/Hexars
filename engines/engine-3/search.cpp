// Defensive: independent threat-first, paranoid alpha-beta search. In Wellisch
// opponents form a conservative coalition, unlike Positional's selfish MaxN.
#include "../engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>

namespace hexchess::engine_one {
namespace {
constexpr int infinity=2000000;
constexpr int values[]{0,100,330,350,530,1050,0};
bool active(const GameState& s,PlayerId p) {return !s.wellisch || s.wellisch->controllers[p]==p;}
bool threatened(const GameState& s,Hex h,PlayerId owner) {
    for(const auto p:s.turnOrder) if(p!=owner && active(s,p) && isAttacked(s,h,p)) return true;
    return false;
}
int safety(const GameState& s,PlayerId root) {
    std::array<int,3> utility{};
    const auto& rules=variantDefinition(s.variant); const auto& cells=rules.cells();
    constexpr Hex ring[]{{1,0},{1,-1},{0,-1},{-1,0},{-1,1},{0,1}};
    for(std::size_t i=0;i<s.occupants.size();++i) {
        const auto p=s.occupants[i]; if(p.empty()) continue;
        int value=values[static_cast<int>(p.type)];
        if(p.type==PieceType::King) {
            int danger=0, cover=0;
            for(const auto d:ring) {
                const Hex h{cells[i].q+d.q,cells[i].r+d.r}; const int j=rules.index(h);
                if(j<0) continue;
                if(threatened(s,h,p.player)) danger+=28;
                if(!s.occupants[j].empty() && s.occupants[j].player==p.player) cover+=s.occupants[j].type==PieceType::Pawn?18:5;
            }
            if(isInCheck(s,p.player)) danger+=80;
            value+=cover-danger;
        } else {
            // Discount exposed material even if it is nominally defended. The
            // threatened side is penalized most when it cannot move immediately.
            if(threatened(s,cells[i],p.player)) {
                const bool defended=isAttacked(s,cells[i],p.player);
                value-=values[static_cast<int>(p.type)]*(defended?12:40)/100;
            }
            const int central=6-std::max({std::abs(cells[i].q),std::abs(cells[i].r),std::abs(cells[i].q+cells[i].r)});
            value+=central*3;
        }
        utility[p.player]+=value;
    }
    if(!active(s,root)) return -1000000;
    int opponents=0;
    for(const auto p:s.turnOrder) if(p!=root && active(s,p)) opponents+=utility[p];
    // Coalition material: unsafe expansion against either opponent costs value.
    return utility[root]-opponents;
}
struct Search {
    PlayerId root; SearchLimits limits;
    std::chrono::steady_clock::time_point deadline;
    int nodes=0; bool stopped=false;
    bool expired() {return stopped=stopped || nodes>=limits.nodeLimit || std::chrono::steady_clock::now()>=deadline;}
    int visit(const GameState& s,int depth,int alpha,int beta) {
        ++nodes;
        if(expired()) return 0;
        auto moves=generateLegalMoves(s);
        const auto result=getGameResult(s,moves);
        if(result.type!=ResultType::Ongoing) return static_cast<int>((result.scores[root]*2-1)*1000000);
        if(!active(s,root)) return -1000000;
        if(depth==0) return safety(s,root);
        const bool maximize=s.activePlayer==root;
        const auto& rules=variantDefinition(s.variant);
        // Search threats and escapes first; every legal move remains eligible.
        std::stable_sort(moves.begin(),moves.end(),[&](const Move& a,const Move& b) {
            auto rank=[&](const Move& m) {const int i=rules.index(m.to); return (m.promotion!=PieceType::None?2000:0)+(i<0?0:values[static_cast<int>(s.occupants[i].type)]);};
            return rank(a)>rank(b);
        });
        int best=maximize?-infinity:infinity;
        for(const auto& move:moves) {
            if(expired()) return 0;
            const auto next=applyCandidateMove(s,move);
            const int score=visit(next,depth-1,alpha,beta);
            if(stopped) return 0;
            if(maximize) {best=std::max(best,score); alpha=std::max(alpha,best);}
            else {best=std::min(best,score); beta=std::min(beta,best);}
            if(beta<=alpha) break;
        }
        return best;
    }
};
}
int evaluate(const GameState& s) {return safety(s,s.activePlayer);}
SearchResult search(const GameState& s,SearchLimits limits) {
    validatePosition(s);
    const auto start=std::chrono::steady_clock::now();
    limits.timeMs=std::clamp(limits.timeMs,1,4000); limits.depth=std::clamp(limits.depth,1,5); limits.nodeLimit=std::clamp(limits.nodeLimit,1,1000000);
    Search context{s.activePlayer,limits,start+std::chrono::milliseconds(limits.timeMs)};
    SearchResult out; auto moves=generateLegalMoves(s);
    const auto result=getGameResult(s,moves);
    if(result.type!=ResultType::Ongoing) {out.score=static_cast<int>((result.scores[s.activePlayer]*2-1)*1000000); return out;}
    out.move=moves.front(); out.score=evaluate(s);
    for(int depth=1;depth<=limits.depth;++depth) {
        int best=-infinity; Move chosen=*out.move; bool complete=true;
        for(const auto& move:moves) {
            if(context.expired()) {complete=false; break;}
            const int score=context.visit(applyCandidateMove(s,move),depth-1,best,infinity);
            if(context.stopped) {complete=false; break;}
            if(score>best) {best=score; chosen=move;}
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
