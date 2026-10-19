// Independent strategic beam/MaxN search. The protocol's SearchResult ABI and
// authoritative rules are shared; Tactical's alpha-beta/quiescence code is not.
#include "../engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
namespace hexchess::engine_one {
using Utility=std::array<int,3>;
static Utility structure(const GameState& state){
 Utility score{};constexpr int value[]{0,100,330,350,530,1050,0};const auto& rules=variantDefinition(state.variant);const auto& cells=rules.cells();
 for(std::size_t i=0;i<state.occupants.size();++i){const auto p=state.occupants[i];if(p.empty())continue;const auto h=cells[i];const int central=6-std::max({std::abs(h.q),std::abs(h.r),std::abs(h.q+h.r)});int amount=value[static_cast<int>(p.type)];
  // Coordination and compact pawn chains, rather than forcing-move ordering.
  if(p.type!=PieceType::King)amount+=central*(p.type==PieceType::Knight?14:6);
  int support=0;for(std::size_t j=0;j<state.occupants.size();++j){const auto other=state.occupants[j];if(j==i||other.empty()||other.player!=p.player)continue;const auto n=cells[j];const int distance=std::max({std::abs(h.q-n.q),std::abs(h.r-n.r),std::abs(h.q+h.r-n.q-n.r)});if(distance==1){support++;if(p.type==PieceType::Pawn&&other.type==PieceType::Pawn)amount+=14;if(p.type==PieceType::King&&other.type==PieceType::Pawn)amount+=24;}}
  if(p.type==PieceType::Pawn&&support==0)amount-=18;
  if(p.type==PieceType::King)amount+=support*8;
  score[p.player]+=amount;
 }
 return score;
}
int evaluate(const GameState& state){const auto values=structure(state);int others=0,count=0;for(const auto player:state.turnOrder)if(player!=state.activePlayer){others+=values[player];count++;}return values[state.activePlayer]-(count?others/count:0);}
struct StrategicSearch{
 SearchLimits limits;std::chrono::steady_clock::time_point deadline;int nodes{0};bool stopped{false};
 bool expired(){return stopped=stopped||nodes>=limits.nodeLimit||std::chrono::steady_clock::now()>=deadline;}
 Utility visit(const GameState& state,int depth){
  ++nodes;auto utility=structure(state);if(expired())return utility;
  const auto moves=generateLegalMoves(state);const auto result=getGameResult(state,moves);
  if(result.type!=ResultType::Ongoing){for(int p=0;p<3;++p)utility[p]=static_cast<int>(result.scores[p]*100000);return utility;}
  utility[state.activePlayer]+=static_cast<int>(moves.size())*3;
  if(depth==0)return utility;
  struct Branch{GameState state;int rank;};std::vector<Branch> candidates;
  for(const auto& move:moves){if(expired())return utility;auto next=applyCandidateMove(state,move);const auto score=structure(next);candidates.push_back({std::move(next),score[state.activePlayer]});}
  std::stable_sort(candidates.begin(),candidates.end(),[](const auto& a,const auto& b){return a.rank>b.rank;});
  // Widen near the root; at each node the actual player maximizes its own
  // utility. This remains MaxN for Wellisch rather than two-player negamax.
  const auto width=std::min(candidates.size(),static_cast<std::size_t>(depth>1?8:5));Utility best=utility;int bestScore=-1000000000;
  for(std::size_t i=0;i<width;++i){if(expired())break;auto child=visit(candidates[i].state,depth-1);int comparison=child[state.activePlayer];for(auto p:state.turnOrder)if(p!=state.activePlayer)comparison-=child[p]/static_cast<int>(state.turnOrder.size());if(comparison>bestScore){bestScore=comparison;best=child;}}
  return best;
 }
};
SearchResult search(const GameState& state,SearchLimits limits){
 const auto started=std::chrono::steady_clock::now();limits.timeMs=std::clamp(limits.timeMs,1,4000);limits.nodeLimit=std::max(1,limits.nodeLimit);limits.depth=std::clamp(limits.depth,1,5);StrategicSearch context{limits,started+std::chrono::milliseconds(limits.timeMs)};SearchResult out;const auto moves=generateLegalMoves(state);if(moves.empty()||getGameResult(state,moves).type!=ResultType::Ongoing)return out;out.move=moves.front();out.score=evaluate(state);
 for(int depth=1;depth<=limits.depth;++depth){int best=-1000000000;auto chosen=*out.move;bool complete=true;for(const auto& move:moves){if(context.expired()){complete=false;break;}auto child=context.visit(applyCandidateMove(state,move),depth-1);int score=child[state.activePlayer];for(auto p:state.turnOrder)if(p!=state.activePlayer)score-=child[p]/static_cast<int>(state.turnOrder.size());if(score>best){best=score;chosen=move;}}if(complete){out.move=chosen;out.score=best;out.depth=depth;}else break;}
 out.nodes=context.nodes;out.timeMs=static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-started).count());return out;
}
}
