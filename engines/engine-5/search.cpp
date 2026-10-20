// Unconventional: independent PUCT tree search with seeded, guided rollouts.
// Each actual player maximizes its own reward; three-player turns are never
// collapsed into alternating white/black negamax.
#include "../engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <memory>
#include <random>

namespace hexchess::engine_one {
namespace {
using Reward=std::array<double,3>;
constexpr int worth[]{0,100,330,350,530,1050,0};
bool alive(const GameState& s,PlayerId p) {return !s.wellisch||s.wellisch->controllers[p]==p;}
std::array<int,3> prospects(const GameState& s) {
    std::array<int,3> utility{};const auto& cells=variantDefinition(s.variant).cells();
    for(std::size_t i=0;i<s.occupants.size();++i) {
        const auto p=s.occupants[i];if(p.empty())continue;
        int score=worth[static_cast<int>(p.type)];
        if(p.type!=PieceType::King) {
            bool attacked=false;
            for(const auto enemy:s.turnOrder) if(enemy!=p.player&&alive(s,enemy)&&isAttacked(s,cells[i],enemy)) {attacked=true;break;}
            if(attacked) score-=worth[static_cast<int>(p.type)]*(isAttacked(s,cells[i],p.player)?10:45)/100;
            const int central=6-std::max({std::abs(cells[i].q),std::abs(cells[i].r),std::abs(cells[i].q+cells[i].r)});
            score+=central*(p.type==PieceType::Knight?9:2);
            // Keep pieces flexible; do not prefer undeveloped symmetry forever.
            if(p.hasMoved&&p.type!=PieceType::Pawn) score+=8;
        } else if(isInCheck(s,p.player)) score-=110;
        utility[p.player]+=score;
    }
    return utility;
}
Reward estimate(const GameState& s) {
    const auto utility=prospects(s);Reward score{};double sum=0;
    int strongest=-2000000;
    for(const auto p:s.turnOrder) if(alive(s,p)) strongest=std::max(strongest,utility[p]);
    for(const auto p:s.turnOrder) if(alive(s,p)) {score[p]=std::exp(std::clamp((utility[p]-strongest)/650.0,-25.0,0.0));sum+=score[p];}
    for(auto& value:score) value/=sum;
    return score;
}
Reward terminal(const GameResult& result) {return {result.scores[0],result.scores[1],result.scores[2]};}
std::uint64_t scramble(std::uint64_t value) {
    value^=value>>30;value*=0xbf58476d1ce4e5b9ULL;value^=value>>27;value*=0x94d049bb133111ebULL;return value^(value>>31);
}
double preference(const GameState& s,const Move& move) {
    const auto& rules=variantDefinition(s.variant);const int from=rules.index(move.from),to=rules.index(move.to);
    const auto p=from<0?Piece{}:s.occupants[from],target=to<0?Piece{}:s.occupants[to];
    const double novelty=(scramble(positionKey(s)^static_cast<std::uint64_t>((from+1)*137+to+1))%1000)/1000.0;
    double score=novelty*100;
    if(!target.empty()&&target.player!=p.player) score+=target.type==PieceType::King?5000:worth[static_cast<int>(target.type)]*.8;
    if(move.promotion!=PieceType::None) score+=worth[static_cast<int>(move.promotion)];
    if((p.type==PieceType::Knight||p.type==PieceType::Bishop)&&!p.hasMoved) score+=35;
    if(target.empty()&&move.to.q!=move.from.q) score+=12;
    return std::exp(std::clamp(score/300.0,-3.0,4.0));
}
struct Node {
    GameState state;
    std::vector<Move> pending;
    std::vector<std::unique_ptr<Node>> children;
    Move move{};
    Reward total{};
    std::optional<Reward> ending;
    double prior=1;
    int visits=0;
};
struct Search {
    SearchLimits limits;
    std::chrono::steady_clock::time_point deadline;
    std::mt19937_64 random;
    int nodes=0,maxDepth=0,treeSize=1;
    bool stopped=false;
    bool expired() {return stopped=stopped||nodes>=limits.nodeLimit||std::chrono::steady_clock::now()>=deadline;}
    void prepare(Node& node,std::vector<Move> moves) {
        const auto result=getGameResult(node.state,moves);
        if(result.type!=ResultType::Ongoing) {node.ending=terminal(result);return;}
        node.pending=std::move(moves);
        std::stable_sort(node.pending.begin(),node.pending.end(),[&](const auto& a,const auto& b){return preference(node.state,a)<preference(node.state,b);});
    }
    std::optional<Reward> rollout(const Node& node,int depth) {
        if(node.ending) return node.ending;
        if(depth>=limits.depth) return estimate(node.state);
        auto state=node.state;auto moves=node.pending;
        // Once a tree node is fully expanded its legal moves live on children.
        if(moves.empty()) for(const auto& child:node.children) moves.push_back(child->move);
        const int stopAt=std::min(limits.depth,depth+2);
        for(int level=depth;level<stopAt;++level) {
            if(expired()) return std::nullopt;
            std::vector<double> weights;weights.reserve(moves.size());
            for(const auto& move:moves) weights.push_back(preference(state,move));
            const auto choice=std::discrete_distribution<std::size_t>(weights.begin(),weights.end())(random);
            state=applyCandidateMove(state,moves[choice]);++nodes;maxDepth=std::max(maxDepth,level+1);
            moves=generateLegalMoves(state);
            const auto result=getGameResult(state,moves);
            if(result.type!=ResultType::Ongoing) return terminal(result);
        }
        return estimate(state);
    }
    std::optional<Reward> simulate(Node& node,int depth,PlayerId root,std::optional<Move>& winning) {
        if(expired()) return std::nullopt;
        ++nodes;maxDepth=std::max(maxDepth,depth);
        if(node.ending) {++node.visits;for(int p=0;p<3;++p)node.total[p]+=(*node.ending)[p];return node.ending;}
        if(depth>=limits.depth) {const auto value=estimate(node.state);++node.visits;for(int p=0;p<3;++p)node.total[p]+=value[p];return value;}
        Node* child;
        if(!node.pending.empty()&&treeSize<16000) {
            const auto move=node.pending.back();node.pending.pop_back();
            auto created=std::make_unique<Node>();created->move=move;created->prior=preference(node.state,move);created->state=applyCandidateMove(node.state,move);
            prepare(*created,generateLegalMoves(created->state));
            child=created.get();node.children.push_back(std::move(created));++treeSize;maxDepth=std::max(maxDepth,depth+1);
            if(depth==0&&child->ending&&(*child->ending)[root]>=1.0) winning=move;
            const auto value=rollout(*child,depth+1);
            if(!value) return std::nullopt;
            ++child->visits;for(int p=0;p<3;++p)child->total[p]+=(*value)[p];
            ++node.visits;for(int p=0;p<3;++p)node.total[p]+=(*value)[p];return value;
        }
        if(node.children.empty()) {
            const auto value=rollout(node,depth);
            if(value) {++node.visits;for(int p=0;p<3;++p)node.total[p]+=(*value)[p];}
            return value;
        }
        double best=-1e9,priorSum=0;
        for(const auto& candidate:node.children) priorSum+=candidate->prior;
        child=node.children.front().get();
        for(const auto& candidate:node.children) {
            const double mean=candidate->visits?candidate->total[node.state.activePlayer]/candidate->visits:.5;
            const double explore=1.8*(candidate->prior/priorSum)*std::sqrt(node.visits+1.0)/(candidate->visits+1.0);
            if(mean+explore>best) {best=mean+explore;child=candidate.get();}
        }
        const auto value=simulate(*child,depth+1,root,winning);
        if(!value) return std::nullopt;
        ++node.visits;for(int p=0;p<3;++p)node.total[p]+=(*value)[p];return value;
    }
};
}
int evaluate(const GameState& state) {
    const auto utility=prospects(state);int others=0,count=0;
    for(const auto p:state.turnOrder) if(p!=state.activePlayer&&alive(state,p)) {others+=utility[p];++count;}
    return alive(state,state.activePlayer)?utility[state.activePlayer]-(count?others/count:0):-1000000;
}
SearchResult search(const GameState& state,SearchLimits limits) {
    validatePosition(state);
    const auto started=std::chrono::steady_clock::now();
    limits.timeMs=std::clamp(limits.timeMs,1,4000);limits.depth=std::clamp(limits.depth,1,5);limits.nodeLimit=std::clamp(limits.nodeLimit,1,1000000);
    Search context{limits,started+std::chrono::milliseconds(limits.timeMs),std::mt19937_64(scramble(positionKey(state)))};
    SearchResult out;auto moves=generateLegalMoves(state);const auto result=getGameResult(state,moves);
    if(result.type!=ResultType::Ongoing) {out.score=static_cast<int>((result.scores[state.activePlayer]*2-1)*1000000);return out;}
    out.move=moves.front();out.score=evaluate(state);
    Node root;root.state=state;context.prepare(root,std::move(moves));
    std::optional<Move> winning;
    while(!context.expired()&&!winning) {
        if(!context.simulate(root,0,state.activePlayer,winning)) break;
    }
    if(winning) {out.move=winning;out.score=1000000;}
    else {
        const Node* chosen=nullptr;
        for(const auto& child:root.children) if(child->visits&&(!chosen||child->visits>chosen->visits||
            (child->visits==chosen->visits&&child->total[state.activePlayer]/child->visits>chosen->total[state.activePlayer]/chosen->visits))) chosen=child.get();
        if(chosen) {out.move=chosen->move;const double reward=std::clamp(chosen->total[state.activePlayer]/chosen->visits,.00001,.99999);out.score=static_cast<int>(650*std::log(reward/(1-reward)));}
    }
    out.depth=context.maxDepth;out.nodes=context.nodes;
    out.timeMs=static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-started).count());
    return out;
}
}
