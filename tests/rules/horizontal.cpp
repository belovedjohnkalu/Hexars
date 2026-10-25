#include "hexchess/rules.hpp"
#include "hexchess/brusky.hpp"
#include "hexchess/devasa.hpp"
#include "../../engines/engine-1/search.hpp"
#include <algorithm>
#include <array>
#include <iostream>
#include <random>
#include <stdexcept>
using namespace hexchess;
static int assertions=0;
static void require(bool ok,const std::string& message){++assertions;if(!ok)throw std::runtime_error(message);}
template<class F>static void rejects(F fn,const char* message){bool rejected=false;try{fn();}catch(const std::invalid_argument&){rejected=true;}require(rejected,message);}
static Hex cell(const VariantId& v,std::string_view s){return v=="brusky"?brusky::fromNotation(s):devasa::fromNotation(s);}
static Move mv(const VariantId& v,std::string_view a,std::string_view b,PieceType p=PieceType::None){return {cell(v,a),cell(v,b),p};}
static void put(GameState& s,Hex h,PieceType type,PlayerId player,bool moved=false){const int i=variantDefinition(s.variant).index(h);require(i>=0,"Fixture outside board");s.occupants[i]={type,player,moved};}
static void put(GameState& s,std::string_view h,PieceType t,PlayerId p,bool moved=false){put(s,cell(s.variant,h),t,p,moved);}
static GameState fixture(const VariantId& v,std::string_view white="a1",std::string_view black="",PlayerId active=0){GameState s;s.variant=v;s.occupants.resize(variantDefinition(v).cells().size());s.activePlayer=active;put(s,white,PieceType::King,0,true);put(s,black.empty()?(v=="brusky"?"l8":"i9"):black,PieceType::King,1,true);return s;}
static bool has(const GameState& s,Move m){const auto moves=generateLegalMoves(s);return std::find(moves.begin(),moves.end(),m)!=moves.end();}
static Hex plus(Hex a,Hex d,int n=1){return {a.q+d.q*n,a.r+d.r*n};}
static GameState mirror(const GameState& s){auto out=s;out.occupants.assign(s.occupants.size(),{});out.activePlayer=1-s.activePlayer;out.enPassantTarget=out.enPassantPawn=-1;out.positionHistory.clear();const auto& v=variantDefinition(s.variant);for(std::size_t i=0;i<s.occupants.size();++i)if(!s.occupants[i].empty()){const auto h=v.cells()[i];auto p=s.occupants[i];p.player=1-p.player;out.occupants[v.index(s.variant=="brusky"?Hex{1-h.q,-1-h.r}:Hex{-h.q,-h.r})]=p;}return out;}
static GameState castleFixture(const VariantId& v,PlayerId player){auto s=fixture(v,"f1",v=="brusky"?"g8":"d9",player);put(s,"f1",PieceType::King,0);put(s,v=="brusky"?"g8":"d9",PieceType::King,1);if(player==0){put(s,"a1",PieceType::Rook,0);put(s,"i1",PieceType::Rook,0);}else{put(s,v=="brusky"?"d8":"a9",PieceType::Rook,1);put(s,v=="brusky"?"l8":"i9",PieceType::Rook,1);}return s;}
int main(){try{for(const VariantId v:{"brusky","devasa"}){
 const auto& rules=variantDefinition(v);const auto initial=createGame(v);validatePosition(initial);require(rules.pointyBoard,"Orientation missing");
 for(PlayerId side=0;side<2;++side){auto s=initial;s.activePlayer=side;s.positionHistory.clear();for(std::size_t i=0;i<s.occupants.size();++i){const auto p=s.occupants[i];if(p.type!=PieceType::Pawn||p.player!=side)continue;const auto from=rules.cells()[i];for(const auto direction:rules.pawnForwards(side))for(int length=1;length<=3;++length){const auto to=plus(from,direction,length);require(has(s,{from,to})==(length<=2&&rules.index(to)>=0),v+" initial pawn advances differ");}}}
 auto blocking=fixture(v);put(blocking,"g5",PieceType::Pawn,0,true);put(blocking,"h6",PieceType::Pawn,1,true);
 require(has(blocking,mv(v,"g5","g6"))==(v=="devasa"),"Enemy blocking distinction lost");require(!has(blocking,mv(v,"g5","h6")),"Pawn captured through shared edge");blocking.activePlayer=1;require(has(blocking,mv(v,"h6","h5"))==(v=="devasa"),"Black enemy blocking distinction lost");
 blocking.activePlayer=0;put(blocking,"h6",PieceType::Pawn,0,true);require(has(blocking,mv(v,"g5","g6")),"Friendly blocker incorrectly blocks both axes");
 // Independent axes for friendly obstruction, both axes and both colors.
 // Brusky's historical enemy blockade intentionally differs from De Vasa.
 for(int blockedAxis=0;blockedAxis<2;++blockedAxis)for(PlayerId blocker=0;blocker<2;++blocker){
  auto base=fixture(v);const auto source=cell(v,"g5");const auto directions=rules.pawnForwards(0);
  put(base,source,PieceType::Pawn,0,true);put(base,plus(source,directions[blockedAxis]),PieceType::Knight,blocker,true);
  for(int flipped=0;flipped<2;++flipped){const auto s=flipped?mirror(base):base;const auto transform=[&](Hex h){return !flipped?h:v=="brusky"?Hex{1-h.q,-1-h.r}:Hex{-h.q,-h.r};};
   require(!has(s,{transform(source),transform(plus(source,directions[blockedAxis]))}),"Pawn entered occupied forward cell");
   const bool open=blocker==0||v=="devasa";
   require(has(s,{transform(source),transform(plus(source,directions[1-blockedAxis]))})==open,"Other pawn axis disagrees with friendly/enemy blocking policy");
  }
 }
 auto captures=fixture(v,v=="devasa"?"a2":"a1");const auto from=cell(v,v=="brusky"?"c2":"c3"),extra=plus(from,{1,-2});put(captures,from,PieceType::Pawn,0);for(const Hex direction:{Hex{-1,-1},Hex{2,-1},Hex{1,-2}})put(captures,plus(from,direction),PieceType::Knight,1,true);
 for(int flipped=0;flipped<2;++flipped){const auto s=flipped?mirror(captures):captures;const auto transform=[&](Hex h){return !flipped?h:v=="brusky"?Hex{1-h.q,-1-h.r}:Hex{-h.q,-h.r};};for(const Hex direction:{Hex{-1,-1},Hex{2,-1}})require(has(s,{transform(from),transform(plus(from,direction))}),"Side capture missing");require(has(s,{transform(from),transform(extra)})==(v=="brusky"),"Initial forward capture distinction lost");auto moved=s;const int at=rules.index(transform(from));moved.occupants[at].hasMoved=true;require(positionKey(s)!=positionKey(moved),"Pawn rights omitted from hash");require(!has(moved,{transform(from),transform(extra)}),"Moved pawn retained extra capture");for(const auto d:rules.pawnForwards(s.activePlayer))require(!has(moved,{transform(from),plus(transform(from),d,2)}),"Moved pawn retained double advance");}
 // Both advance axes, both capturers and both colors, from independent f7 examples.
 for(const auto end:{"f5","d5"})for(const auto attacker:(std::string_view(end)=="f5"?std::array<const char*,2>{"g5","d5"}:std::array<const char*,2>{"f5","c5"})){
  auto s=fixture(v,"a1","",1);put(s,"f7",PieceType::Pawn,1);put(s,attacker,PieceType::Pawn,0,true);for(int flipped=0;flipped<2;++flipped){auto before=flipped?mirror(s):s;const auto transform=[&](Hex h){return !flipped?h:v=="brusky"?Hex{1-h.q,-1-h.r}:Hex{-h.q,-h.r};};const auto start=transform(cell(v,"f7")),finish=transform(cell(v,end)),cross=transform(cell(v,std::string_view(end)=="f5"?"f6":"e6"));const auto take=Move{transform(cell(v,attacker)),cross};auto ep=applyMove(before,{start,finish});validatePosition(ep);require(ep.enPassantTarget==rules.index(cross)&&ep.enPassantPawn==rules.index(finish),"Wrong crossed cell or pawn");require(has(ep,take)&&isEnPassantCapture(ep,take),"En passant missing");const auto after=applyMove(ep,take);require(after.occupants[rules.index(finish)].empty(),"EP victim not removed");validatePosition(after);
   auto bad=ep;bad.positionHistory.clear();bad.occupants[bad.enPassantPawn].hasMoved=false;rejects([&]{validatePosition(bad);},"Malformed EP movement rights accepted");bad=ep;bad.positionHistory.clear();bad.enPassantTarget=rules.index(start);rejects([&]{validatePosition(bad);},"Malformed crossed cell accepted");
   auto expiry=ep;const auto moves=generateLegalMoves(expiry);const auto quiet=std::find_if(moves.begin(),moves.end(),[&](const Move& m){return expiry.occupants[rules.index(m.from)].type==PieceType::King;});require(quiet!=moves.end(),"No expiry king move");expiry=applyMove(expiry,*quiet);require(expiry.enPassantTarget==-1&&expiry.enPassantPawn==-1,"EP lasted beyond immediate reply");
  }
 }
 auto pinnedEp=fixture(v,"g1","",1);put(pinnedEp,"g5",PieceType::Pawn,0,true);put(pinnedEp,"g8",PieceType::Rook,1,true);put(pinnedEp,"f7",PieceType::Pawn,1);pinnedEp=applyMove(pinnedEp,mv(v,"f7","f5"));require(!has(pinnedEp,mv(v,"g5","f6")),"Pinned EP exposed king");
 for(PlayerId side=0;side<2;++side){const auto s=castleFixture(v,side);validatePosition(s);const auto plans=rules.castlePlans(side);require(plans.size()==2,"Wrong castle count");for(const auto plan:plans){const Move move{plan.kingFrom,plan.kingTo};require(has(s,move),"Legal castle missing");const auto next=applyMove(s,move);validatePosition(next);require(next.occupants[rules.index(plan.kingTo)].type==PieceType::King&&next.occupants[rules.index(plan.rookTo)].type==PieceType::Rook&&next.occupants[rules.index(plan.kingTo)].hasMoved&&next.occupants[rules.index(plan.rookTo)].hasMoved,"Castling did not move both pieces/rights");
  auto noKing=s;noKing.occupants[rules.index(plan.kingFrom)].hasMoved=true;require(!has(noKing,move)&&positionKey(noKing)!=positionKey(s),"Moved king retained rights");auto noRook=s;noRook.occupants[rules.index(plan.rookFrom)].hasMoved=true;require(!has(noRook,move)&&positionKey(noRook)!=positionKey(s),"Moved rook retained rights");
  const int sign=plan.rookFrom.q>plan.kingFrom.q?1:-1;for(int q=plan.kingFrom.q+sign;q!=plan.rookFrom.q;q+=sign){auto blocked=s;put(blocked,{q,plan.kingFrom.r},PieceType::Pawn,side,true);require(!has(blocked,move),"Castling crossed occupied path");}
  auto transit=s;put(transit,{plan.kingFrom.q+sign,0},PieceType::Rook,1-side,true);require(!isInCheck(transit,side)&&!has(transit,move),"Castling crossed attacked cell");auto check=s;put(check,{plan.kingFrom.q,0},PieceType::Rook,1-side,true);require(isInCheck(check,side)&&!has(check,move),"Castling out of check accepted");
 }}
 auto promotion=fixture(v,"a1",v=="brusky"?"a5":"a9");const auto promoteFrom=cell(v,v=="brusky"?"g7":"g8");put(promotion,promoteFrom,PieceType::Pawn,0,true);for(int flipped=0;flipped<2;++flipped){const auto s=flipped?mirror(promotion):promotion;const auto from=flipped?(v=="brusky"?Hex{1-promoteFrom.q,-1-promoteFrom.r}:Hex{-promoteFrom.q,-promoteFrom.r}):promoteFrom;for(const auto direction:rules.pawnForwards(s.activePlayer)){const auto to=plus(from,direction);for(const auto type:{PieceType::Queen,PieceType::Rook,PieceType::Bishop,PieceType::Knight}){require(has(s,{from,to,type}),"Promotion choice missing");validatePosition(applyMove(s,{from,to,type}));}rejects([&]{applyMove(s,{from,to});},"Missing promotion accepted");}}
 // Landing on a slanted side is not promotion; the pawn can continue along the other axis.
 if(v=="brusky"){auto edge=fixture(v,"f1","l8");put(edge,"a4",PieceType::Pawn,0,true);require(has(edge,mv(v,"a4","a5")),"Slanted edge caused premature promotion");}
 auto pin=fixture(v,"f1");put(pin,"f3",PieceType::Rook,0,true);put(pin,"f7",PieceType::Rook,1,true);require(!has(pin,mv(v,"f3","e3")),"Pinned rook exposed king");rejects([&]{applyMove(initial,mv(v,"f1","f5"));},"Illegal browser move accepted");
 auto mate=fixture(v,v=="brusky"?"a5":"a9",v=="brusky"?"l4":"i1",1);
 put(mate,v=="brusky"?"j4":"g1",PieceType::Queen,0,true);validatePosition(mate);
 require(isInCheck(mate,1)&&generateLegalMoves(mate).empty()&&getGameResult(mate).type==ResultType::Checkmate,"Independent mate fixture failed");
 require(!engine_one::search(mate,{10,1,100}).move,"Search continued after mate");
 auto stale=fixture(v,v=="brusky"?"h2":"a9",v=="brusky"?"l4":"i1",1);
 put(stale,v=="brusky"?"k6":"g2",PieceType::Queen,0,true);validatePosition(stale);const auto result=getGameResult(stale);
 require(!isInCheck(stale,1)&&generateLegalMoves(stale).empty()&&result.type==ResultType::Stalemate&&result.winner==-1&&result.scores[0]==.5&&result.scores[1]==.5,"Independent equal-score stalemate failed");
 require(!engine_one::search(stale,{10,1,100}).move,"Search continued after stalemate");
 const auto searched=engine_one::search(initial,{80,2,1500});require(searched.move&&has(initial,*searched.move),"Tactical returned an illegal move");
 std::mt19937 random(v=="brusky"?20261018:20261019);int finished=0,plies=0;for(int game=0;game<6;++game){auto s=initial;for(int ply=0;ply<750;++ply){const auto moves=generateLegalMoves(s);if(getGameResult(s,moves).type!=ResultType::Ongoing){++finished;break;}auto next=applyMove(s,moves[random()%moves.size()]);require(!isInCheck(next,s.activePlayer),"Random move exposed king");validatePosition(next);s=next;++plies;}}require(finished>0,"No complete random game");
 int engineFinished=0,enginePlies=0;for(int game=0;game<2;++game){auto s=initial;for(int ply=0;ply<450;++ply){if(getGameResult(s).type!=ResultType::Ongoing){++engineFinished;break;}const auto result=engine_one::search(s,{15,1,300});require(result.move&&has(s,*result.move),"Illegal self-play move");s=applyMove(s,*result.move);validatePosition(s);++enginePlies;}}require(engineFinished>0,"No complete Tactical game");
 std::cout<<v<<": "<<plies<<" random plies, "<<finished<<" complete random games; "<<enginePlies<<" engine plies, "<<engineFinished<<" complete engine games\n";
 }
 std::cout<<"Horizontal rules: "<<assertions<<" assertions passed\n";
}catch(const std::exception& e){std::cerr<<"Horizontal rules failure: "<<e.what()<<'\n';return 1;}}
