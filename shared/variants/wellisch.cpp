#include "hexchess/wellisch.hpp"
#include <algorithm>
#include <charconv>
#include <stdexcept>

namespace hexchess::wellisch {
static void checkPlayer(PlayerId player){if(player>2)throw std::invalid_argument("Invalid Wellisch player");}
const std::vector<Hex>& cells(){static const auto value=generateRegularHexBoard(5);return value;}
int index(Hex position){const auto it=std::find(cells().begin(),cells().end(),position);return it==cells().end()?-1:static_cast<int>(it-cells().begin());}
Hex rotate(Hex position,int thirds){thirds=(thirds%3+3)%3;for(int i=0;i<thirds;++i)position={-position.q-position.r,position.q};return position;}
std::string notation(Hex position){if(index(position)<0)throw std::invalid_argument("Cell outside Wellisch board");return std::string(1,static_cast<char>('f'+position.q))+std::to_string(6-position.r);}
Hex fromNotation(std::string_view value){
 if(value.size()<2||value.size()>3)throw std::invalid_argument("Invalid Wellisch notation");
 char file=value[0];if(file>='A'&&file<='K')file+=32;
 int rank=0;const auto parsed=std::from_chars(value.data()+1,value.data()+value.size(),rank);
 if(file<'a'||file>'k'||parsed.ec!=std::errc{}||parsed.ptr!=value.data()+value.size()||rank<1||rank>11||std::to_string(rank)!=value.substr(1))throw std::invalid_argument("Invalid Wellisch notation");
 const Hex position{file-'f',6-rank};if(index(position)<0)throw std::invalid_argument("Cell outside Wellisch board");return position;
}
GameState startingPosition(){
 GameState state;state.variant="wellisch";state.turnOrder={0,1,2};state.activePlayer=0;state.occupants.resize(cells().size());
 const auto put=[&](std::string_view at,PieceType type,PlayerId player){const int i=index(rotate(fromNotation(at),player));if(i<0||!state.occupants[i].empty())throw std::logic_error("Invalid Wellisch starting arrangement");state.occupants[i]={type,player,false};};
 for(PlayerId player=0;player<3;++player){
  put("d1",PieceType::King,player);put("c1",PieceType::Queen,player);
  for(const auto at:{"b1","e1"})put(at,PieceType::Rook,player);
  for(const auto at:{"a1","d2","f1"})put(at,PieceType::Knight,player);
  for(const auto at:{"a2","b2","c2","d3","e3","e2","f2","g2"})put(at,PieceType::Pawn,player);
 }
 // No two-player repetition key or result is synthesized for this foundation.
 return state;
}
Position startingGame(){Position position;position.game=startingPosition();position.pawnOrigins.resize(cells().size(),noPlayer);for(std::size_t i=0;i<cells().size();++i)if(position.game.occupants[i].type==PieceType::Pawn)position.pawnOrigins[i]=position.game.occupants[i].player;return position;}
std::array<Hex,2> pawnForwardDirections(PlayerId player){checkPlayer(player);return {rotate({0,-1},player),rotate({1,-1},player)};}
bool promotionCell(Hex position,PlayerId player){checkPlayer(player);return index(position)>=0&&rotate(position,3-player).r==-5;}
std::vector<Hex> geometricDestinations(PieceType type,PlayerId player,Hex from){
 checkPlayer(player);if(index(from)<0)return {};
 if(type==PieceType::Bishop)throw std::invalid_argument("Wellisch has no bishops");
 const Board board{std::set<Hex>(cells().begin(),cells().end())};
 if(type==PieceType::King)return getEdgeNeighbours(board,from);
 if(type==PieceType::Knight)return getVertexNeighbours(board,from);
 std::vector<Hex> moves;
 if(type==PieceType::Pawn){for(const auto d:pawnForwardDirections(player)){const Hex to{from.q+d.q,from.r+d.r};if(index(to)>=0)moves.push_back(to);}return moves;}
 if(type==PieceType::Rook||type==PieceType::Queen){
  for(const auto d:std::array<Hex,6>{{{1,0},{1,-1},{0,-1},{-1,0},{-1,1},{0,1}}})for(int n=1;;++n){const Hex to{from.q+d.q*n,from.r+d.r*n};if(index(to)<0)break;moves.push_back(to);}
  if(type==PieceType::Queen){const auto jumps=getVertexNeighbours(board,from);moves.insert(moves.end(),jumps.begin(),jumps.end());}
 }
 return moves;
}
std::vector<PieceType> promotionChoices(const Position& position,PlayerId player){checkPlayer(player);std::vector<PieceType> choices;for(const auto type:{PieceType::Queen,PieceType::Rook,PieceType::Knight})if(std::find(position.promotionReserves[player].begin(),position.promotionReserves[player].end(),type)!=position.promotionReserves[player].end())choices.push_back(type);return choices;}
std::array<CastleSwap,2> castleSwaps(PlayerId player){checkPlayer(player);return {{{rotate(fromNotation("d1"),player),rotate(fromNotation("b1"),player)},{rotate(fromNotation("d1"),player),rotate(fromNotation("e1"),player)}}};}
}
