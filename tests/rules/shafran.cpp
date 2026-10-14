#include "hexchess/rules.hpp"
#include "../../engines/engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <iostream>
#include <random>
#include <stdexcept>
using namespace hexchess;
static int assertions=0;
static void require(bool ok,const char* message){++assertions;if(!ok)throw std::runtime_error(message);}
template<class F> static void rejects(F fn,const char* message){bool no=false;try{fn();}catch(const std::invalid_argument&){no=true;}require(no,message);}
static Move mv(std::string_view a,std::string_view b,PieceType p=PieceType::None){return {shafranFromNotation(a),shafranFromNotation(b),p};}
static void put(GameState& s,std::string_view cell,PieceType type,PlayerId player,bool moved=false){s.occupants[shafranIndex(shafranFromNotation(cell))]={type,player,moved};}
static GameState fixture(std::string_view white="a1",std::string_view black="i10",PlayerId active=0){GameState s;s.variant="shafran";s.occupants.resize(70);s.activePlayer=active;put(s,white,PieceType::King,0,true);put(s,black,PieceType::King,1,true);return s;}
static bool has(const GameState& s,const Move& m){const auto ms=generateLegalMoves(s);return std::find(ms.begin(),ms.end(),m)!=ms.end();}
static GameState castles(PlayerId player){auto s=fixture("e1","e10",player);put(s,"e1",PieceType::King,0);put(s,"e10",PieceType::King,1);if(player==0){put(s,"a1",PieceType::Rook,0);put(s,"i5",PieceType::Rook,0);}else{put(s,"a6",PieceType::Rook,1);put(s,"i10",PieceType::Rook,1);}return s;}
int main(){try{
    const auto& cells=shafranCells();require(cells.size()==70,"Shafran has 70 cells");
    const int lengths[]{6,7,8,9,10,9,8,7,6};
    for(int q=-4;q<=4;++q){int count=0;for(const auto h:cells)if(h.q==q)++count;require(count==lengths[q+4],"Independent file lengths mismatch");}
    for(std::size_t i=0;i<cells.size();++i){require(shafranIndex(cells[i])==static_cast<int>(i),"Index does not match ordered cells");require(shafranFromNotation(shafranNotation(cells[i]))==cells[i],"Notation roundtrip failed");require(shafranIndex({-cells[i].q,-cells[i].r-1})>=0,"Board is not centrally symmetric");}
    require(shafranFromNotation("a1")==Hex{-4,-1}&&shafranFromNotation("i5")==Hex{4,-5}&&shafranFromNotation("e10")==Hex{0,4},"Diagram landmarks differ");
    for(const auto cell:{"a7","i4","j1","e11","e01","d0"})rejects([&]{shafranFromNotation(cell);},"Invalid notation accepted");
    auto initial=createGame("shafran");int count[2]{0,0};for(const auto p:initial.occupants)if(!p.empty())++count[p.player];require(count[0]==18&&count[1]==18,"Setup must have 18 pieces per side");
    for(const auto& [notation,type]:std::array<std::pair<const char*,PieceType>,9>{{{"e10",PieceType::King},{"f10",PieceType::Queen},{"a6",PieceType::Rook},{"i10",PieceType::Rook},{"b7",PieceType::Bishop},{"d9",PieceType::Bishop},{"g10",PieceType::Bishop},{"c8",PieceType::Knight},{"h10",PieceType::Knight}}}){const auto p=initial.occupants[shafranIndex(shafranFromNotation(notation))];require(p.type==type&&p.player==1,"Black diagram setup differs");}
    for(const auto player:{0,1}){auto s=initial;s.activePlayer=player;s.positionHistory.clear();const char* starts[2][9]{{"a2","b2","c2","d2","e2","f3","g4","h5","i6"},{"a5","b6","c7","d8","e9","f9","g9","h9","i9"}};for(int file=0;file<9;++file){const auto from=shafranFromNotation(starts[player][file]);const int maximum=file==0||file==8?1:file>=3&&file<=5?3:2;for(int step=1;step<=4;++step){Move m{from,{from.q,from.r+(player==0?step:-step)}};require(has(s,m)==(step<=maximum),"Pawn first advance range wrong");}}}
    auto blocked=initial;put(blocked,"e3",PieceType::Pawn,1,true);require(!has(blocked,mv("e2","e4"))&&!has(blocked,mv("e2","e5")),"Pawn jumped a blocker");
    auto used=fixture();put(used,"e2",PieceType::Pawn,0,true);require(has(used,mv("e2","e3"))&&!has(used,mv("e2","e4")),"Moved pawn regained initial rights");auto fresh=used;put(fresh,"e2",PieceType::Pawn,0);require(positionKey(used)!=positionKey(fresh),"Pawn rights omitted from repetition");
    auto pawn=fixture();put(pawn,"e5",PieceType::Pawn,0,true);put(pawn,"d6",PieceType::Pawn,1,true);put(pawn,"f7",PieceType::Pawn,1,true);require(has(pawn,mv("e5","d6"))&&has(pawn,mv("e5","f7")),"Bishop-direction pawn captures missing");
    put(pawn,"d6",PieceType::Bishop,0,true);require(!has(pawn,mv("e5","d6")),"Friendly pawn capture allowed");
    // Documented ...d8-d5 can be captured on either crossed hex d7/d6.
    auto ep=fixture("a1","i10",1);put(ep,"d8",PieceType::Pawn,1);put(ep,"e6",PieceType::Pawn,0,true);put(ep,"c4",PieceType::Pawn,0,true);ep=applyMove(ep,mv("d8","d5"));validatePosition(ep);
    require(shafranNotation(shafranCells()[ep.enPassantTarget])=="d7"&&ep.additionalEnPassantTargets.size()==1&&shafranNotation(shafranCells()[ep.additionalEnPassantTargets[0]])=="d6","Triple advance exposes wrong crossed cells");
    require(has(ep,mv("e6","d7"))&&has(ep,mv("c4","d6")),"Triple advance needs both en-passant captures");
    for(const auto m:{mv("e6","d7"),mv("c4","d6")}){const auto captured=applyMove(ep,m);require(captured.occupants[shafranIndex(shafranFromNotation("d5"))].empty(),"En passant failed to remove victim");validatePosition(captured);}
    auto pinnedEp=fixture("c1","i10",1);put(pinnedEp,"c4",PieceType::Pawn,0,true);put(pinnedEp,"c8",PieceType::Rook,1,true);put(pinnedEp,"d8",PieceType::Pawn,1);pinnedEp=applyMove(pinnedEp,mv("d8","d5"));require(!has(pinnedEp,mv("c4","d6")),"Triple en passant exposed a pinned king");
    auto expired=applyMove(ep,mv("a1","a2"));expired=applyMove(expired,mv("i10","i9"));require(!has(expired,mv("e6","d7"))&&!has(expired,mv("c4","d6")),"En passant lasted more than one turn");
    auto bad=ep;bad.additionalEnPassantTargets.clear();bad.positionHistory.clear();rejects([&]{validatePosition(bad);},"Missing second crossed cell accepted");bad=ep;bad.additionalEnPassantTargets={1000};bad.positionHistory.clear();rejects([&]{validatePosition(bad);},"Malformed extra target accepted");
    // Mirror the triple advance and captures for White.
    auto mirror=fixture("a1","i10",0);put(mirror,"f3",PieceType::Pawn,0);put(mirror,"e6",PieceType::Pawn,1,true);put(mirror,"g6",PieceType::Pawn,1,true);mirror=applyMove(mirror,mv("f3","f6"));require(has(mirror,mv("e6","f5"))&&has(mirror,mv("g6","f4")),"White triple en-passant symmetry wrong");
    const char* target[2][4]{{"c1","b1","g3","h4"},{"g10","h10","c8","b7"}};const char* rookTo[2][4]{{"d1","c1","f2","g3"},{"f10","g10","d9","c8"}};
    for(PlayerId player=0;player<=1;++player){const auto s=castles(player);const char* home=player==0?"e1":"e10";for(int option=0;option<4;++option){const auto m=mv(home,target[player][option]);require(has(s,m),"One of four castling options missing");auto next=applyMove(s,m);validatePosition(next);const auto king=next.occupants[shafranIndex(shafranFromNotation(target[player][option]))];const auto rook=next.occupants[shafranIndex(shafranFromNotation(rookTo[player][option]))];require(king.type==PieceType::King&&king.hasMoved&&rook.type==PieceType::Rook&&rook.hasMoved,"Castling failed to move both pieces");require(next.halfmoveClock==1,"Castling resets non-capture clock");}}
    auto castle=castles(0);auto noKing=castle;put(noKing,"e1",PieceType::King,0,true);for(const auto to:target[0])require(!has(noKing,mv("e1",to)),"Moved king can castle");require(positionKey(castle)!=positionKey(noKing),"Castling rights omitted from repetition");
    auto noRook=castle;put(noRook,"a1",PieceType::Rook,0,true);require(!has(noRook,mv("e1","b1"))&&!has(noRook,mv("e1","c1"))&&has(noRook,mv("e1","h4")),"Rook rights do not belong to their flank");
    auto obstructed=castle;put(obstructed,"d1",PieceType::Knight,0,true);require(!has(obstructed,mv("e1","c1"))&&!has(obstructed,mv("e1","b1")),"Castling jumped an occupied path");
    auto attacked=castle;put(attacked,"c4",PieceType::Rook,1,true);require(!isInCheck(attacked,0)&&!has(attacked,mv("e1","c1"))&&!has(attacked,mv("e1","b1")),"Castling crossed an attacked destination");
    auto transit=castle;put(transit,"f6",PieceType::Rook,1,true);require(!isInCheck(transit,0)&&!has(transit,mv("e1","g3"))&&!has(transit,mv("e1","h4")),"Castling crossed attacked intermediate cell");
    auto check=castle;put(check,"e6",PieceType::Rook,1,true);for(const auto to:target[0])require(!has(check,mv("e1",to)),"Castling out of check accepted");
    auto promotion=fixture("a1","i10");put(promotion,"e9",PieceType::Pawn,0,true);for(const auto type:{PieceType::Queen,PieceType::Rook,PieceType::Bishop,PieceType::Knight})require(has(promotion,mv("e9","e10",type)),"Promotion choice missing");rejects([&]{applyMove(promotion,mv("e9","e10"));},"Unpromoted last-cell pawn allowed");
    auto pinned=fixture("e1","i10");put(pinned,"e3",PieceType::Rook,0,true);put(pinned,"e8",PieceType::Rook,1,true);require(!has(pinned,mv("e3","d3")),"Pinned rook exposed king");
    auto mate=fixture("a1","e10",1);put(mate,"e8",PieceType::Queen,0,true);require(isInCheck(mate,1)&&generateLegalMoves(mate).empty()&&getGameResult(mate).type==ResultType::Checkmate,"Five covered corner escapes should be mate");
    auto stale=fixture("b7","e10",1);put(stale,"g9",PieceType::Queen,0,true);const auto staleResult=getGameResult(stale);require(!isInCheck(stale,1)&&generateLegalMoves(stale).empty()&&staleResult.type==ResultType::Stalemate&&staleResult.winner==-1&&staleResult.scores[0]==.5,"Protected fifth escape should be a drawn stalemate");require(!engine_one::search(stale,{10,1,100}).move,"Search continued after stalemate");
    auto draw=fixture();require(getGameResult(draw).type==ResultType::InsufficientMaterial,"Bare kings not drawn");
    const auto search=engine_one::search(initial,{100,2,2000});require(search.move&&has(initial,*search.move),"Tactical returned illegal Shafran move");
    std::mt19937 random(20261016);int plies=0,finished=0;
    for(int game=0;game<8;++game){auto s=initial;for(int ply=0;ply<700;++ply){const auto legal=generateLegalMoves(s);if(getGameResult(s,legal).type!=ResultType::Ongoing){++finished;break;}const auto next=applyMove(s,legal[random()%legal.size()]);require(!isInCheck(next,s.activePlayer),"Random legal move exposed king");validatePosition(next);s=next;++plies;}}
    require(finished>=1,"No full random game completed");
    int enginePlies=0,engineGames=0;for(int game=0;game<2;++game){auto s=initial;for(int ply=0;ply<400;++ply){const auto ms=generateLegalMoves(s);if(getGameResult(s,ms).type!=ResultType::Ongoing){++engineGames;break;}const auto result=engine_one::search(s,{20,1,500});require(result.move&&has(s,*result.move),"Self-play produced illegal move");s=applyMove(s,*result.move);validatePosition(s);++enginePlies;}}
    require(engineGames>=1,"No full engine game completed");
    std::cout<<"Shafran: "<<assertions<<" checks, "<<plies<<" random plies, "<<finished<<" complete random games; "<<enginePlies<<" engine plies, "<<engineGames<<" complete engine games\n";
}catch(const std::exception& error){std::cerr<<"Shafran failure: "<<error.what()<<'\n';return 1;}}
