#include "hexchess/wellisch.hpp"
#include <algorithm>
#include <stdexcept>

namespace hexchess::wellisch {
namespace {
constexpr std::array<Hex,6> edges{{{1,0},{1,-1},{0,-1},{-1,0},{-1,1},{0,1}}};
constexpr std::array<Hex,6> vertices{{{2,-1},{1,-2},{-1,-1},{-2,1},{-1,2},{1,1}}};
Hex add(Hex a,Hex b,int n=1){return {a.q+b.q*n,a.r+b.r*n};}
Piece at(const GameState& s,Hex h){const int i=index(h);return i<0?Piece{}:s.occupants[i];}
int survivors(const GameState& s){int n=0;for(PlayerId p=0;p<3;++p)if(s.wellisch->controllers[p]==p)++n;return n;}
bool alive(const GameState& s,PlayerId p){return p<3&&s.wellisch->controllers[p]==p;}
PlayerId nextPlayer(const GameState& s){for(int n=1;n<=3;++n){const auto p=static_cast<PlayerId>((s.activePlayer+n)%3);if(alive(s,p))return p;}throw std::logic_error("No Wellisch player");}
bool delayed(const Move& m){return !m.pass&&m.from==m.to&&m.promotion!=PieceType::None;}
std::vector<PieceType> choices(const GameState& s,PlayerId origin){std::vector<PieceType> out;for(auto t:{PieceType::Queen,PieceType::Rook,PieceType::Knight})if(std::find(s.wellisch->reserves[origin].begin(),s.wellisch->reserves[origin].end(),t)!=s.wellisch->reserves[origin].end())out.push_back(t);return out;}
bool attacksRay(const GameState& s,Hex from,Hex target){for(auto d:edges)for(int n=1;;++n){const auto h=add(from,d,n);if(index(h)<0)break;if(h==target)return true;if(!at(s,h).empty())break;}return false;}
void addMove(const GameState& s,std::vector<Move>& out,Hex from,Hex to){
 const int target=index(to);if(target<0)return;const auto p=at(s,from),victim=s.occupants[target];
 if(!victim.empty()&&(victim.player==p.player||(victim.type==PieceType::King&&survivors(s)==2)))return;
 const auto origin=s.wellisch->origins[index(from)];
 if(p.type==PieceType::Pawn&&promotionCell(to,origin)){
  const auto reserve=choices(s,origin);if(!reserve.empty()){for(auto t:reserve)out.push_back({from,to,t});return;}
 }
 out.push_back({from,to});
}
bool castle(const GameState& s,const Move& m){return !m.pass&&m.from!=m.to&&at(s,m.from).type==PieceType::King&&at(s,m.to).type==PieceType::Rook&&at(s,m.to).player==s.activePlayer;}
void addCastles(const GameState& s,std::vector<Move>& out,Hex from){
 if(at(s,from).hasMoved||inCheck(s,s.activePlayer))return;
 for(const auto swap:castleSwaps(s.activePlayer)){
  if(from!=swap.king)continue;
  const auto rook=at(s,swap.rook);if(rook.type!=PieceType::Rook||rook.player!=s.activePlayer||rook.hasMoved||s.wellisch->origins[index(swap.rook)]!=s.activePlayer)continue;
  const Hex delta{swap.rook.q-from.q,swap.rook.r-from.r};const int n=std::max({std::abs(delta.q),std::abs(delta.r),std::abs(delta.q+delta.r)});const Hex dir{delta.q/n,delta.r/n};
  bool safe=true;
  for(int step=1;step<n;++step){const auto h=add(from,dir,step);if(!at(s,h).empty()){safe=false;break;}auto probe=s;probe.occupants[index(from)]={};probe.occupants[index(h)]={PieceType::King,s.activePlayer,true};if(inCheck(probe,s.activePlayer)){safe=false;break;}}
  if(safe){auto probe=s;std::swap(probe.occupants[index(from)],probe.occupants[index(swap.rook)]);if(!inCheck(probe,s.activePlayer))out.push_back({from,swap.rook});}
 }
}
}

GameState createGame(){auto s=startingPosition();s.wellisch.emplace();s.wellisch->origins.resize(cells().size(),noPlayer);for(std::size_t i=0;i<cells().size();++i)if(!s.occupants[i].empty())s.wellisch->origins[i]=s.occupants[i].player;s.positionHistory.push_back(key(s));return s;}

bool attacked(const GameState& s,Hex target,PlayerId attacker){
 if(!alive(s,attacker))return false;
 for(std::size_t i=0;i<cells().size();++i){const auto p=s.occupants[i];if(p.empty()||p.player!=attacker)continue;const auto from=cells()[i];
  if((p.type==PieceType::Rook||p.type==PieceType::Queen)&&attacksRay(s,from,target))return true;
  if(p.type==PieceType::King)for(auto d:edges)if(add(from,d)==target)return true;
  if(p.type==PieceType::Knight||p.type==PieceType::Queen)for(auto d:vertices)if(add(from,d)==target)return true;
  if(p.type==PieceType::Pawn)for(auto d:pawnForwardDirections(s.wellisch->origins[i]))if(add(from,d)==target)return true;
 }
 return false;
}
bool inCheck(const GameState& s,PlayerId player){
 if(!alive(s,player))return false;
 for(std::size_t i=0;i<cells().size();++i)if(s.occupants[i].type==PieceType::King&&s.occupants[i].player==player){for(PlayerId p=0;p<3;++p)if(p!=player&&attacked(s,cells()[i],p))return true;return false;}
 throw std::invalid_argument("Active Wellisch player has no king");
}

std::vector<Move> candidateMoves(const GameState& s){
 std::vector<Move> out;
 // Delayed promotions are compulsory start-of-turn choices, then the same
 // player makes a normal move. Multiple waiting pawns consume reserves one by one.
 for(std::size_t i=0;i<cells().size();++i){const auto p=s.occupants[i];if(p.type==PieceType::Pawn&&p.player==s.activePlayer&&promotionCell(cells()[i],s.wellisch->origins[i]))for(auto t:choices(s,s.wellisch->origins[i]))out.push_back({cells()[i],cells()[i],t});}
 if(!out.empty())return out;
 for(std::size_t i=0;i<cells().size();++i){const auto p=s.occupants[i];if(p.empty()||p.player!=s.activePlayer)continue;const auto from=cells()[i];
  if(p.type==PieceType::Rook||p.type==PieceType::Queen)for(auto d:edges)for(int n=1;;++n){const auto to=add(from,d,n);if(index(to)<0)break;addMove(s,out,from,to);if(!at(s,to).empty())break;}
  if(p.type==PieceType::Knight||p.type==PieceType::Queen)for(auto d:vertices)addMove(s,out,from,add(from,d));
  if(p.type==PieceType::King){for(auto d:edges)addMove(s,out,from,add(from,d));addCastles(s,out,from);}
  if(p.type==PieceType::Pawn&&!promotionCell(from,s.wellisch->origins[i]))for(auto d:pawnForwardDirections(s.wellisch->origins[i]))addMove(s,out,from,add(from,d));
 }
 return out;
}
std::vector<Move> legalMoves(const GameState& s){
 std::vector<Move> out;for(const auto& m:candidateMoves(s))if(delayed(m)||!inCheck(apply(s,m,false),s.activePlayer))out.push_back(m);
 // With three kings, a player without an escape must pass and can lose its
 // king on an opponent's turn. With two kings left, normal mate/stalemate apply.
 if(out.empty()&&survivors(s)==3)out.push_back({{0,0},{0,0},PieceType::None,true});
 return out;
}

GameState apply(const GameState& s,const Move& m,bool recordHistory){
 GameState next=s;auto& rights=*next.wellisch;bool capture=false,pawn=false;
 if(m.pass){++rights.consecutivePasses;next.activePlayer=nextPlayer(next);++next.halfmoveClock;}
 else {
  rights.consecutivePasses=0;const int from=index(m.from),to=index(m.to);const auto source=s.occupants[from],target=s.occupants[to];const auto origin=rights.origins[from];pawn=source.type==PieceType::Pawn;
  if(delayed(m)){next.occupants[from].type=m.promotion;next.occupants[from].hasMoved=true;auto& reserve=rights.reserves[origin];reserve.erase(std::find(reserve.begin(),reserve.end(),m.promotion));}
  else {
   if(castle(s,m)){std::swap(next.occupants[from],next.occupants[to]);std::swap(rights.origins[from],rights.origins[to]);next.occupants[from].hasMoved=next.occupants[to].hasMoved=true;}
   else {
    capture=!target.empty();
    if(capture){const auto capturedOrigin=rights.origins[to];if(target.type==PieceType::King){for(auto& controller:rights.controllers)if(controller==target.player)controller=source.player;for(auto& p:next.occupants)if(!p.empty()&&p.player==target.player)p.player=source.player;}
     else if(target.type!=PieceType::Pawn)rights.reserves[capturedOrigin].push_back(target.type);
    }
    next.occupants[to]=source;next.occupants[to].hasMoved=true;next.occupants[from]={};rights.origins[to]=origin;rights.origins[from]=noPlayer;
    if(m.promotion!=PieceType::None){next.occupants[to].type=m.promotion;auto& reserve=rights.reserves[origin];reserve.erase(std::find(reserve.begin(),reserve.end(),m.promotion));}
   }
   next.activePlayer=nextPlayer(next);next.halfmoveClock=capture||pawn?0:s.halfmoveClock+1;
  }
 }
 ++next.ply;
 if(recordHistory){if(capture||pawn)next.positionHistory.clear();next.positionHistory.push_back(key(next));}
 return next;
}

std::uint64_t key(const GameState& s){
 std::uint64_t hash=1469598103934665603ULL;const auto mix=[&](std::uint64_t x){hash^=x;hash*=1099511628211ULL;};mix(0x77656c6c69736368ULL);
 for(std::size_t i=0;i<s.occupants.size();++i){const auto p=s.occupants[i];mix(p.empty()?0:static_cast<unsigned>(p.type)+8*p.player+32*s.wellisch->origins[i]+(p.hasMoved&&(p.type==PieceType::King||p.type==PieceType::Rook)?128:0));}
 for(PlayerId p=0;p<3;++p){mix(s.wellisch->controllers[p]);for(auto t:{PieceType::Queen,PieceType::Rook,PieceType::Knight})mix(std::count(s.wellisch->reserves[p].begin(),s.wellisch->reserves[p].end(),t));}mix(s.activePlayer);mix(s.wellisch->consecutivePasses);return hash;
}
void validate(const GameState& s){
 const auto bad=[](){throw std::invalid_argument("Invalid Wellisch position or rights");};
 if(!s.wellisch||s.occupants.size()!=91||s.wellisch->origins.size()!=91||s.turnOrder!=std::vector<PlayerId>{0,1,2}||s.activePlayer>2||s.halfmoveClock<0||s.halfmoveClock>10000||s.ply<0||s.ply>100000||s.positionHistory.size()>2048||s.enPassantTarget!=-1||s.enPassantPawn!=-1||!s.additionalEnPassantTargets.empty())bad();
 const auto& rights=*s.wellisch;for(auto controller:rights.controllers)if(controller>2||rights.controllers[controller]!=controller)bad();if(!alive(s,s.activePlayer)||rights.consecutivePasses<0||rights.consecutivePasses>3||survivors(s)<1)bad();
 int kings[3]{},counts[3][7]{};
 for(std::size_t i=0;i<91;++i){const auto p=s.occupants[i];const auto origin=rights.origins[i];if(p.empty()){if(origin!=noPlayer)bad();continue;}if(p.player>2||origin>2||static_cast<int>(p.type)>6||p.type==PieceType::Bishop||p.player!=rights.controllers[origin])bad();++counts[origin][static_cast<int>(p.type)];if(p.type==PieceType::King){if(p.player!=origin)bad();++kings[p.player];}}
 for(PlayerId p=0;p<3;++p){if(kings[p]!=(alive(s,p)?1:0))bad();for(auto t:rights.reserves[p]){if(t!=PieceType::Queen&&t!=PieceType::Rook&&t!=PieceType::Knight)bad();++counts[p][static_cast<int>(t)];}if(counts[p][1]>8||counts[p][2]>3||counts[p][4]>2||counts[p][5]>1)bad();}
 if(!s.positionHistory.empty()&&s.positionHistory.back()!=key(s))bad();
}
GameResult result(const GameState& s,const std::vector<Move>& moves){
 GameResult r;const int count=survivors(s);for(int p=0;p<3;++p)r.scores[p]=alive(s,p)?1.0/count:0;
 if(count==1){r.type=ResultType::Conquest;r.winner=s.activePlayer;return r;}
 if(count==2&&moves.empty()){r.type=inCheck(s,s.activePlayer)?ResultType::Checkmate:ResultType::Stalemate;if(r.type==ResultType::Checkmate){for(PlayerId p=0;p<3;++p){r.scores[p]=alive(s,p)&&p!=s.activePlayer?1:0;if(r.scores[p]==1)r.winner=p;}}return r;}
 if(s.wellisch->consecutivePasses>=count){r.type=ResultType::Stalemate;return r;}
 bool bare=true;for(auto p:s.occupants)if(!p.empty()&&p.type!=PieceType::King)bare=false;if(bare){r.type=ResultType::InsufficientMaterial;return r;}
 if(std::count(s.positionHistory.begin(),s.positionHistory.end(),key(s))>=3){r.type=ResultType::Repetition;return r;}
 if(s.halfmoveClock>=50*count){r.type=ResultType::FiftyMove;return r;}
 return r;
}
}
