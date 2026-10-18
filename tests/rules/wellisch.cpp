#include "hexchess/wellisch.hpp"
#include "hexchess/rules.hpp"
#include <algorithm>
#include <iostream>
#include <set>
#include <stdexcept>
using namespace hexchess;
static int assertions=0;
static void require(bool ok,const char* message){++assertions;if(!ok)throw std::runtime_error(message);}
template<class F>static void rejects(F action){bool failed=false;try{action();}catch(const std::invalid_argument&){failed=true;}require(failed,"Invalid Wellisch input accepted");}
int main(){try{
 using namespace wellisch;const auto position=startingGame();const auto& s=position.game;
 require(cells().size()==91,"Wrong board size");require(s.turnOrder==std::vector<PlayerId>{0,1,2}&&s.activePlayer==0,"Turn model is not three-player");require(s.positionHistory.empty(),"Unverified repetition rules were supplied");
 for(const auto h:cells()){require(fromNotation(notation(h))==h,"Notation roundtrip failed");require(rotate(h,3)==h&&rotate(rotate(h))==rotate(h,2),"Third turn failed");require(index(rotate(h))>=0,"Rotation left the board");}
 for(const auto invalid:{"a7","k5","l6","j4","a01","a0","f12","f1x"})rejects([&]{fromNotation(invalid);});
 const std::array<const char*,3> kings{{"d1","c8","k9"}},queens{{"c1","d9","k8"}};
 const std::array<std::array<const char*,2>,3> rooks{{{{"b1","e1"}},{{"b7","e10"}},{{"k7","k10"}}}};
 const std::array<std::array<const char*,3>,3> knights{{{{"a1","d2","f1"}},{{"a6","d8","f11"}},{{"k11","j8","k6"}}}};
 const std::array<std::array<const char*,8>,3> pawns{{{{"a2","b2","c2","d3","e3","e2","f2","g2"}},{{"a5","b6","c7","d7","e8","e9","f10","g11"}},{{"j11","j10","j9","i8","i7","j7","j6","j5"}}}};
 const auto piece=[&](const char* at,PieceType type,PlayerId player){const auto p=s.occupants[index(fromNotation(at))];require(p.type==type&&p.player==player&&!p.hasMoved,"Independent setup fixture failed");};
 for(PlayerId player=0;player<3;++player){int count=0;for(const auto p:s.occupants)if(!p.empty()&&p.player==player){++count;require(p.type!=PieceType::Bishop,"Unexpected bishop");}require(count==15,"Wrong army size");piece(kings[player],PieceType::King,player);piece(queens[player],PieceType::Queen,player);for(auto at:rooks[player])piece(at,PieceType::Rook,player);for(auto at:knights[player])piece(at,PieceType::Knight,player);for(auto at:pawns[player]){piece(at,PieceType::Pawn,player);require(position.pawnOrigins[index(fromNotation(at))]==player,"Pawn movement origin missing");}
  int promotionCount=0;for(auto h:cells())if(promotionCell(h,player))++promotionCount;require(promotionCount==6,"Wrong promotion edge");const auto swaps=castleSwaps(player);require(swaps.size()==2&&swaps[0].king==fromNotation(kings[player]),"Wrong castle king");for(const auto swap:swaps)require(s.occupants[index(swap.rook)].type==PieceType::Rook,"Wrong castle rook");
  const auto king=geometricDestinations(PieceType::King,player,{0,0}),knight=geometricDestinations(PieceType::Knight,player,{0,0}),rook=geometricDestinations(PieceType::Rook,player,{0,0}),queen=geometricDestinations(PieceType::Queen,player,{0,0}),pawn=geometricDestinations(PieceType::Pawn,player,{0,0});require(king.size()==6&&knight.size()==6&&rook.size()==30&&queen.size()==36&&pawn.size()==2,"Wellisch movements inherited another variant");for(auto h:knight)require(cellColour(h)==cellColour({0,0}),"Knight left its color");
  require(promotionChoices(position,player).empty(),"Promotion created an uncaptured piece");auto captured=position;captured.promotionReserves[player]={PieceType::Rook,PieceType::Rook,PieceType::Knight};require(promotionChoices(captured,player)==std::vector<PieceType>{PieceType::Rook,PieceType::Knight},"Promotion reserve choices failed");
  for(const auto type:{PieceType::King,PieceType::Queen,PieceType::Rook,PieceType::Knight,PieceType::Pawn})for(const auto from:cells()){const auto moves=geometricDestinations(type,player,from);require(std::set<Hex>(moves.begin(),moves.end()).size()==moves.size(),"Duplicate geometric move");for(const auto to:moves)require(index(to)>=0,"Geometric move outside board");const auto rotated=geometricDestinations(type,(player+1)%3,rotate(from));std::set<Hex> expected;for(auto to:moves)expected.insert(rotate(to));require(expected==std::set<Hex>(rotated.begin(),rotated.end()),"Player geometry lost rotational symmetry");}
 }
 auto allegiance=position;const auto pawnIndex=index(fromNotation("a2"));allegiance.game.occupants[pawnIndex].player=1;require(allegiance.pawnOrigins[pawnIndex]==0,"Takeover would erase pawn direction");
 rejects([&]{pawnForwardDirections(3);});rejects([&]{geometricDestinations(PieceType::Bishop,0,{0,0});});rejects([&]{createGame("wellisch");});
 std::cout<<"Wellisch foundation: "<<assertions<<" assertions passed; legal play remains disabled\n";
}catch(const std::exception& error){std::cerr<<error.what()<<'\n';return 1;}}
