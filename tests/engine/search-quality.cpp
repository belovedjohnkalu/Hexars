#include "hexchess/rules.hpp"
#include "hexchess/wellisch.hpp"
#include "../../engines/engine-1/search.hpp"
#include <algorithm>
#include <iostream>
#include <random>
#include <stdexcept>
using namespace hexchess;
void require(bool ok,const char* why){if(!ok)throw std::runtime_error(why);}
Move move(const char* from,const char* to){return {glinskiFromNotation(from),glinskiFromNotation(to)};}
int main(){
 std::cout<<std::unitbuf;
 // Independent published fool's mate: the final move must be found, not merely
 // legal. This also verifies terminal utilities outrank material/structure.
 auto mate=createGame("glinski");
 for(auto pair:{std::pair{"e1","c3"},std::pair{"e10","c6"},std::pair{"b1","b2"},std::pair{"b7","b6"},std::pair{"f3","b1"},std::pair{"e7","e6"}})mate=applyMove(mate,move(pair.first,pair.second));
 const auto answer=engine_one::search(mate,{800,1,20000});require(answer.move.has_value(),"No mate move");
 mate=applyMove(mate,*answer.move);require(getGameResult(mate).type==ResultType::Checkmate,"Missed mate in one");require(!engine_one::search(mate,{10,2,100}).move,"Moved after checkmate");
 auto invalid=createGame("glinski");invalid.occupants.clear();bool rejected=false;try{engine_one::search(invalid);}catch(const std::exception&){rejected=true;}require(rejected,"Malformed board accepted");

 // Wellisch has mandatory promotions that preserve the active player. Both
 // search architectures must handle that extra action without negating turns.
 auto waiting=createGame("wellisch");
 for(auto& p:waiting.occupants)p={};
 std::fill(waiting.wellisch->origins.begin(),waiting.wellisch->origins.end(),255);
 const auto put=[&](const char* at,PieceType type,PlayerId player){const int i=wellisch::index(wellisch::fromNotation(at));waiting.occupants[i]={type,player,false};waiting.wellisch->origins[i]=player;};
 put("d1",PieceType::King,0);put("c8",PieceType::King,1);put("k9",PieceType::King,2);put("f11",PieceType::Pawn,0);
 waiting.wellisch->reserves[0]={PieceType::Knight};waiting.positionHistory.clear();
 const auto promotion=engine_one::search(waiting,{80,2,500});require(promotion.move&&promotion.move->from==promotion.move->to&&promotion.move->promotion==PieceType::Knight,"Missed mandatory same-turn promotion");
 auto promoted=applyMove(waiting,*promotion.move);require(promoted.activePlayer==0,"Promotion consumed the turn");
 const auto continuation=engine_one::search(promoted,{40,2,500});require(continuation.move.has_value(),"No move after delayed promotion");applyMove(promoted,*continuation.move);
 auto stale=GameState{};stale.occupants.resize(91);stale.activePlayer=1;
 stale.occupants[glinskiIndex(glinskiFromNotation("h8"))]={PieceType::King,0,false};
 stale.occupants[glinskiIndex(glinskiFromNotation("f11"))]={PieceType::King,1,false};
 stale.occupants[glinskiIndex(glinskiFromNotation("e8"))]={PieceType::Queen,0,false};
 const auto stalemate=engine_one::search(stale,{10,2,100});require(!stalemate.move&&stalemate.score<0,"Fractional stalemate scoring ignored");
 std::mt19937 random(14921);
 int games=0,movesPlayed=0;
 for(const auto variant:{"glinski","mccooey","shafran","brusky","devasa","wellisch"}){
  for(int opponent=0;opponent<2;++opponent){
   auto state=createGame(variant);bool complete=false;
   for(int ply=0;ply<2200;++ply){
    const auto legal=generateLegalMoves(state);const auto ending=getGameResult(state,legal);
    if(ending.type!=ResultType::Ongoing){complete=true;break;}
    Move selected;
    if(opponent && state.activePlayer!=0)selected=legal[random()%legal.size()];
    else{const auto answer=engine_one::search(state,{3,2,150});require(answer.move.has_value(),"No move in ongoing game");require(answer.nodes<=150,"Node budget exceeded");require(answer.timeMs<500,"Time budget exceeded");require(std::find(legal.begin(),legal.end(),*answer.move)!=legal.end(),"Illegal engine move");selected=*answer.move;}
    state=applyMove(state,selected);++movesPlayed;
   }
   require(complete,"Full game did not terminate");++games;
   std::cout<<variant<<" "<<(opponent?"random":"self-play")<<" completed at "<<state.ply<<" plies\n";
  }
 }
 // Every variant must return a legal fallback at a one-node deadline and
 // return no move after its own automatic draw clock expires.
 for(const auto variant:{"glinski","mccooey","shafran","brusky","devasa","wellisch"}){
  auto state=createGame(variant);const auto legal=generateLegalMoves(state);
  const auto tiny=engine_one::search(state,{1,5,1});require(tiny.move&&std::find(legal.begin(),legal.end(),*tiny.move)!=legal.end(),"No legal budget fallback");
  state.halfmoveClock=state.variant=="wellisch"?150:100;require(!engine_one::search(state,{10,1,100}).move,"Moved after draw");
 }
 std::cout<<games<<" complete games; "<<movesPlayed<<" legal moves\n";
}
