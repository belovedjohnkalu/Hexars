#include "hexchess/rules.hpp"
#include "../../engines/engine-1/search.hpp"
#include <algorithm>
#include <iostream>
#include <stdexcept>
using namespace hexchess;
// Independent full-width oracle, intentionally without caches, pruning,
// zero-window probes or exchange extensions. This quiet fixture has no captures
// or checks within the tested horizon, so its leaf values are directly comparable.
int oracle(const GameState& state,int depth,PlayerId root) {
    const auto moves=generateLegalMoves(state);
    const auto result=getGameResult(state,moves);
    if(result.type!=ResultType::Ongoing)return static_cast<int>((result.scores[root]*2-1)*1000000);
    if(depth==0) {auto view=state;view.activePlayer=root;return engine_one::evaluate(view);}
    const bool maximize=state.activePlayer==root;int best=maximize?-2000000:2000000;
    for(const auto& move:moves) {
        const int score=oracle(applyCandidateMove(state,move),depth-1,root);
        best=maximize?std::max(best,score):std::min(best,score);
    }
    return best;
}
int main() {
    GameState state;state.occupants.resize(91);
    const auto put=[&](const char* at,PieceType t,PlayerId p){state.occupants[glinskiIndex(glinskiFromNotation(at))]={t,p,false};};
    put("a2",PieceType::King,0);put("l5",PieceType::King,1);put("f3",PieceType::Pawn,0);put("f9",PieceType::Pawn,1);
    for(const auto root:{PlayerId{0},PlayerId{1}})for(int depth=1;depth<=3;++depth) {
        state.activePlayer=root;
        const int expected=oracle(state,depth,root);
        const auto answer=engine_one::search(state,{2000,depth,200000});
        if(!answer.move||answer.depth!=depth||answer.score!=expected)throw std::runtime_error("Materialist MTD(f) disagrees with exhaustive search");
        const auto child=applyMove(state,*answer.move);
        if(oracle(child,depth-1,root)!=expected)throw std::runtime_error("Materialist returned a move inconsistent with its score");
    }
    std::cout<<"Materialist matches exhaustive depth 1-3 search for both players\n";
}
