// Materialist: memory-enhanced, repeated zero-window MTD(f) search, with
// exchange resolution. This is independent of the other engines' searches.
#include "../engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <unordered_map>

namespace hexchess::engine_one {
namespace {
constexpr int infinity=2000000;
constexpr int worth[]{0,100,320,350,525,1050,0};
bool alive(const GameState& s,PlayerId p) {return !s.wellisch||s.wellisch->controllers[p]==p;}
int ledger(const GameState& s,PlayerId root) {
    if(!alive(s,root)) return -1000000;
    std::array<int,3> army{}, advancement{};
    for(std::size_t i=0;i<s.occupants.size();++i) {
        const auto p=s.occupants[i]; if(p.empty()) continue;
        army[p.player]+=worth[static_cast<int>(p.type)];
        // A small tie-breaker, subordinate to exchanges and actual material.
        if(p.type==PieceType::Pawn && !s.wellisch) {
            const auto h=variantDefinition(s.variant).cells()[i];
            advancement[p.player]+=(p.player==0?h.r:-h.r)*2;
        }
    }
    int opponents=0, progress=0, total=0;
    for(const auto p:s.turnOrder) if(alive(s,p)) {
        total+=army[p];
        if(p!=root) {opponents+=army[p];progress+=advancement[p];}
    }
    const int balance=army[root]-opponents;
    // Equal exchanges increase the value of an existing material advantage;
    // when behind, retaining material is preferable to simplifying blindly.
    return balance+balance*std::max(0,12000-total)/48000+advancement[root]-progress;
}
int resultScore(const GameResult& r,PlayerId p) {return static_cast<int>((r.scores[p]*2-1)*1000000);}
std::uint64_t key(const GameState& s) {
    auto value=positionKey(s)^(static_cast<std::uint64_t>(s.halfmoveClock)<<48);
    for(const auto h:s.positionHistory) value^=h+0x9e3779b97f4a7c15ULL+(value<<6)+(value>>2);
    return value;
}
int order(const GameState& s,const Move& m) {
    if(m.pass) return -100000;
    const auto& rules=variantDefinition(s.variant);
    const int to=rules.index(m.to),from=rules.index(m.from);
    const auto attacker=from<0?Piece{}:s.occupants[from];
    const auto target=to<0?Piece{}:s.occupants[to];
    const auto victim=!target.empty()&&target.player!=attacker.player?target:Piece{};
    return (victim.type==PieceType::King?100000:worth[static_cast<int>(victim.type)]*16)
        +(isEnPassantCapture(s,m)?1600:0)
        +(m.promotion==PieceType::None?0:worth[static_cast<int>(m.promotion)]*12)
        -(!victim.empty()?worth[static_cast<int>(attacker.type)]:0);
}
struct Entry {int depth=-1,lower=-infinity,upper=infinity;Move best{};};
struct Search {
    PlayerId root;
    SearchLimits limits;
    std::chrono::steady_clock::time_point deadline;
    int nodes=0;bool stopped=false;
    std::unordered_map<std::uint64_t,Entry> table;
    bool expired() {return stopped=stopped||nodes>=limits.nodeLimit||std::chrono::steady_clock::now()>=deadline;}
    int exchanges(const GameState& s,int alpha,int beta,int remaining) {
        if(expired()) return 0;
        ++nodes;
        auto moves=generateLegalMoves(s);
        const auto result=getGameResult(s,moves);
        if(result.type!=ResultType::Ongoing) return resultScore(result,root);
        if(!alive(s,root)) return -1000000;
        const bool maximize=s.activePlayer==root;
        const bool compulsory=isInCheck(s,s.activePlayer)||std::any_of(moves.begin(),moves.end(),[](const auto& m){return m.pass;})
            ||std::all_of(moves.begin(),moves.end(),[](const auto& m){return m.from==m.to&&m.promotion!=PieceType::None;});
        int best=ledger(s,root);
        if(remaining==0) return best;
        if(!compulsory) {
            if(maximize) {if(best>=beta) return best;alpha=std::max(alpha,best);}
            else {if(best<=alpha) return best;beta=std::min(beta,best);}
            moves.erase(std::remove_if(moves.begin(),moves.end(),[&](const Move& m){
                const int i=variantDefinition(s.variant).index(m.to);
                return m.promotion==PieceType::None && !isEnPassantCapture(s,m) && (i<0||s.occupants[i].empty()||s.occupants[i].player==s.activePlayer);
            }),moves.end());
        } else best=maximize?-infinity:infinity;
        std::stable_sort(moves.begin(),moves.end(),[&](const auto& a,const auto& b){return order(s,a)>order(s,b);});
        for(const auto& m:moves) {
            if(expired()) return 0;
            const int score=exchanges(applyCandidateMove(s,m),alpha,beta,remaining-1);
            if(stopped) return 0;
            if(maximize) {best=std::max(best,score);alpha=std::max(alpha,best);}
            else {best=std::min(best,score);beta=std::min(beta,best);}
            if(alpha>=beta) break;
        }
        return best;
    }
    int probe(const GameState& s,int depth,int alpha,int beta) {
        if(depth==0) return exchanges(s,alpha,beta,2);
        if(expired()) return 0;
        ++nodes;
        const auto hash=key(s);const auto found=table.find(hash);
        std::optional<Move> preferred;
        if(found!=table.end()) {
            const auto entry=found->second;preferred=entry.best;
            if(entry.depth==depth) {
                if(entry.lower>=beta) return entry.lower;
                if(entry.upper<=alpha) return entry.upper;
                alpha=std::max(alpha,entry.lower);beta=std::min(beta,entry.upper);
            }
        }
        const int lower=alpha,upper=beta;
        auto moves=generateLegalMoves(s);
        const auto result=getGameResult(s,moves);
        if(result.type!=ResultType::Ongoing) return resultScore(result,root);
        if(!alive(s,root)) return -1000000;
        std::stable_sort(moves.begin(),moves.end(),[&](const auto& a,const auto& b){
            return order(s,a)+(preferred&&a==*preferred?infinity:0)>order(s,b)+(preferred&&b==*preferred?infinity:0);
        });
        const bool maximize=s.activePlayer==root;
        int best=maximize?-infinity:infinity;auto chosen=moves.front();
        for(const auto& m:moves) {
            if(expired()) return 0;
            const int score=probe(applyCandidateMove(s,m),depth-1,alpha,beta);
            if(stopped) return 0;
            if((maximize&&score>best)||(!maximize&&score<best)) {best=score;chosen=m;}
            if(maximize) alpha=std::max(alpha,best);else beta=std::min(beta,best);
            if(alpha>=beta) break;
        }
        if(table.size()<60000||table.contains(hash)) {
            auto& entry=table[hash];
            if(entry.depth!=depth) entry=Entry{depth,-infinity,infinity,chosen};
            entry.best=chosen;
            if(best<=lower) entry.upper=std::min(entry.upper,best);
            else if(best>=upper) entry.lower=std::max(entry.lower,best);
            else entry.lower=entry.upper=best;
        }
        return best;
    }
};
}
int evaluate(const GameState& state) {return ledger(state,state.activePlayer);}
SearchResult search(const GameState& state,SearchLimits limits) {
    validatePosition(state);
    const auto started=std::chrono::steady_clock::now();
    limits.timeMs=std::clamp(limits.timeMs,1,4000);limits.depth=std::clamp(limits.depth,1,5);limits.nodeLimit=std::clamp(limits.nodeLimit,1,1000000);
    Search context{state.activePlayer,limits,started+std::chrono::milliseconds(limits.timeMs),0,false,{}};
    SearchResult out;auto legal=generateLegalMoves(state);
    const auto result=getGameResult(state,legal);
    if(result.type!=ResultType::Ongoing) {out.score=resultScore(result,state.activePlayer);return out;}
    std::stable_sort(legal.begin(),legal.end(),[&](const auto& a,const auto& b){return order(state,a)>order(state,b);});
    out.move=legal.front();out.score=evaluate(state);
    const auto rootKey=key(state);
    for(int depth=1;depth<=limits.depth;++depth) {
        int guess=out.score,lower=-infinity,upper=infinity;
        while(lower<upper&&!context.expired()) {
            const int beta=guess==lower?guess+1:guess;
            guess=context.probe(state,depth,beta-1,beta);
            if(context.stopped) break;
            if(guess<beta) upper=guess;else lower=guess;
        }
        if(context.stopped||lower<upper) break;
        const auto best=context.table.find(rootKey);
        if(best!=context.table.end()&&best->second.depth==depth) {
            out.move=best->second.best;out.score=guess;out.depth=depth;
        }
        if(guess>=1000000) break;
    }
    out.nodes=context.nodes;
    out.timeMs=static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-started).count());
    return out;
}
}
