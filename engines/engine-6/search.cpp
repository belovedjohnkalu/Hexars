// Universal: phase-adaptive principal variation search for two players and
// selective MaxN for three. No search/evaluation implementation is linked from
// another engine. Shared search.hpp is only the protocol ABI.
#include "../engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>

namespace hexchess::engine_one {
namespace {
constexpr int infinity=2000000;
constexpr int values[]{0,100,320,340,520,1000,0};
using Scores=std::array<int,3>;
bool active(const GameState& s,PlayerId p) {return !s.wellisch||s.wellisch->controllers[p]==p;}
int participants(const GameState& s) {int n=0;for(auto p:s.turnOrder)n+=active(s,p);return n;}
Scores assessment(const GameState& s) {
    Scores out{};const auto& rules=variantDefinition(s.variant);const auto& cells=rules.cells();
    int phase=0;for(const auto p:s.occupants)if(!p.empty()&&p.type!=PieceType::King&&p.type!=PieceType::Pawn)phase+=values[static_cast<int>(p.type)];
    // Opening: coordination and cover. Endgame: king activity and pawn races.
    const int opening=std::min(256,phase*256/(participants(s)==3?11000:8000));
    constexpr Hex ring[]{{1,0},{1,-1},{0,-1},{-1,0},{-1,1},{0,1}};
    for(std::size_t i=0;i<s.occupants.size();++i) {
        const auto p=s.occupants[i];if(p.empty())continue;
        const int center=6-std::max({std::abs(cells[i].q),std::abs(cells[i].r),std::abs(cells[i].q+cells[i].r)});
        int v=values[static_cast<int>(p.type)];
        if(p.type==PieceType::King) {
            int cover=0,danger=0;
            for(auto d:ring) {Hex h{cells[i].q+d.q,cells[i].r+d.r};const int j=rules.index(h);if(j<0)continue;
                if(!s.occupants[j].empty()&&s.occupants[j].player==p.player)cover+=s.occupants[j].type==PieceType::Pawn?15:3;
                for(auto opponent:s.turnOrder)if(opponent!=p.player&&active(s,opponent)&&isAttacked(s,h,opponent))danger+=18;
            }
            v+=((cover-danger)*opening+center*22*(256-opening))/256;
            if(isInCheck(s,p.player))v-=50;
        } else {
            v+=center*(p.type==PieceType::Knight?9:4);
            if(p.type==PieceType::Pawn) {
                // Army-relative progress survives Wellisch takeovers.
                auto origin=p.player;if(s.wellisch)origin=s.wellisch->origins[i];
                const int progress=s.variant=="wellisch"?(origin==0?-cells[i].r:origin==1?cells[i].q:cells[i].r-cells[i].q):(p.player==0?-cells[i].r:cells[i].r);
                v+=progress*(5+(256-opening)/28);
            }
            bool attacked=false;for(auto opponent:s.turnOrder)if(opponent!=p.player&&active(s,opponent)&&isAttacked(s,cells[i],opponent)){attacked=true;break;}
            if(attacked)v-=v*(isAttacked(s,cells[i],p.player)?6:20)/100;
        }
        out[p.player]+=v;
    }
    Scores relative{};for(auto p:s.turnOrder) {
        if(!active(s,p)){relative[p]=-1000000;continue;}
        int enemy=0,n=0;for(auto other:s.turnOrder)if(other!=p&&active(s,other)){enemy+=out[other];++n;}
        relative[p]=out[p]-(n?enemy/n:0);
    }
    return relative;
}
Scores terminal(const GameResult& r) {Scores out{};for(int p=0;p<3;++p)out[p]=static_cast<int>((r.scores[p]*2-1)*1000000);return out;}
bool forcing(const GameState& s,const Move& m) {
    if(m.pass||m.promotion!=PieceType::None)return true;
    const auto i=variantDefinition(s.variant).index(m.to);
    return i>=0&&!s.occupants[i].empty()&&s.occupants[i].player!=s.activePlayer;
}
void order(const GameState& s,std::vector<Move>& moves,const std::optional<Move>& principal={}) {
    const auto& rules=variantDefinition(s.variant);
    auto rank=[&](const Move& m) {const int i=rules.index(m.to),j=rules.index(m.from);
        const auto target=i>=0?s.occupants[i]:Piece{};
        const bool capture=!target.empty()&&target.player!=s.activePlayer;
        return (principal&&m==*principal?100000:0)+(capture?(target.type==PieceType::King?50000:values[static_cast<int>(target.type)]*10-(j>=0?values[static_cast<int>(s.occupants[j].type)]:0)):0)+(m.promotion!=PieceType::None?2000+values[static_cast<int>(m.promotion)]:0);
    };
    std::stable_sort(moves.begin(),moves.end(),[&](const auto& a,const auto& b){return rank(a)>rank(b);});
}
struct Search {
    PlayerId root;SearchLimits limits;std::chrono::steady_clock::time_point deadline;int nodes=0;bool stopped=false;
    bool expired(){return stopped=stopped||nodes>=limits.nodeLimit||std::chrono::steady_clock::now()>=deadline;}
    // Root-relative PVS handles same-player promotion actions without negating
    // their value, and re-searches any null-window improvement at full width.
    int pvs(const GameState& s,int depth,int alpha,int beta,int extension=1) {
        if(expired())return 0;
        ++nodes;
        auto moves=generateLegalMoves(s);const auto result=getGameResult(s,moves);
        if(result.type!=ResultType::Ongoing)return terminal(result)[root];
        const bool maximize=s.activePlayer==root;
        if(depth<=0) {
            // One bounded forcing layer; stand-pat is forbidden when checked,
            // passing, or a compulsory same-cell reserve promotion is pending.
            if(!extension)return assessment(s)[root];
            const bool compulsory=isInCheck(s,s.activePlayer)||std::all_of(moves.begin(),moves.end(),[](auto m){return m.pass||m.from==m.to;});
            if(!compulsory) {
                const int score=assessment(s)[root];
                if(maximize){if(score>=beta)return score;alpha=std::max(alpha,score);}else{if(score<=alpha)return score;beta=std::min(beta,score);}
                moves.erase(std::remove_if(moves.begin(),moves.end(),[&](auto m){return !forcing(s,m);}),moves.end());
                if(moves.empty())return score;
            }
        }
        order(s,moves);int best=maximize?-infinity:infinity;bool first=true;
        for(const auto& move:moves) {
            if(expired())return 0;
            auto next=applyCandidateMove(s,move);int score;
            const int childDepth=depth>0?depth-1:0,childExtension=depth>0?extension:0;
            if(first||depth<=1)score=pvs(next,childDepth,alpha,beta,childExtension);
            else if(maximize){score=pvs(next,childDepth,alpha,std::min(beta,alpha+1),childExtension);if(!stopped&&score>alpha&&score<beta)score=pvs(next,childDepth,alpha,beta,childExtension);}
            else{score=pvs(next,childDepth,std::max(alpha,beta-1),beta,childExtension);if(!stopped&&score<beta&&score>alpha)score=pvs(next,childDepth,alpha,beta,childExtension);}
            if(stopped)return 0;
            first=false;
            if(maximize){best=std::max(best,score);alpha=std::max(alpha,best);}else{best=std::min(best,score);beta=std::min(beta,best);}
            if(alpha>=beta)break;
        }
        // Quiet standing value also competes with optional horizon captures.
        if(depth<=0&&!isInCheck(s,s.activePlayer)&&!std::all_of(moves.begin(),moves.end(),[](auto m){return m.pass||m.from==m.to;}))best=maximize?std::max(best,assessment(s)[root]):std::min(best,assessment(s)[root]);
        return best;
    }
    Scores maxn(const GameState& s,int depth) {
        if(expired())return {};
        ++nodes;
        auto moves=generateLegalMoves(s);const auto result=getGameResult(s,moves);
        if(result.type!=ResultType::Ongoing)return terminal(result);
        if(depth<=0)return assessment(s);
        order(s,moves);
        // Every root and every forcing action is eligible. Quiet interior
        // breadth grows with available depth; checked positions are full width.
        const bool inCheck=isInCheck(s,s.activePlayer);int quiet=0;Scores best{};best.fill(-infinity);
        for(auto move:moves) {
            if(!inCheck&&!forcing(s,move)&&++quiet>12+depth*4)continue;
            if(expired())return {};
            auto scores=maxn(applyCandidateMove(s,move),depth-1);if(stopped)return {};
            if(scores[s.activePlayer]>best[s.activePlayer])best=scores;
        }
        return best;
    }
};
}
int evaluate(const GameState& s){return assessment(s)[s.activePlayer];}
SearchResult search(const GameState& s,SearchLimits limits) {
    validatePosition(s);const auto start=std::chrono::steady_clock::now();
    limits.timeMs=std::clamp(limits.timeMs,1,4000);limits.depth=std::clamp(limits.depth,1,5);limits.nodeLimit=std::clamp(limits.nodeLimit,1,1000000);
    Search context{s.activePlayer,limits,start+std::chrono::milliseconds(limits.timeMs)};
    SearchResult out;auto moves=generateLegalMoves(s);const auto result=getGameResult(s,moves);
    if(result.type!=ResultType::Ongoing){out.score=terminal(result)[s.activePlayer];return out;}
    order(s,moves);out.move=moves.front();out.score=evaluate(s);
    for(int depth=1;depth<=limits.depth;++depth) {
        int best=-infinity;Move chosen=*out.move;bool complete=true;
        for(const auto& move:moves) {
            if(context.expired()){complete=false;break;}
            auto next=applyCandidateMove(s,move);
            const int score=participants(s)>2?context.maxn(next,depth-1)[context.root]:context.pvs(next,depth-1,best,infinity);
            if(context.stopped){complete=false;break;}
            if(score>best){best=score;chosen=move;}
            if(best>=1000000)break;
        }
        if(!complete)break;
        out.move=chosen;out.score=best;out.depth=depth;order(s,moves,chosen);
        if(best>=1000000)break;
    }
    out.nodes=context.nodes;out.timeMs=static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-start).count());return out;
}
}
