#include "../../engines/engine-1/protocol.hpp"
#include "hexchess/rules.hpp"
#include <algorithm>
#include <fstream>
#include <iostream>
#include <random>
#include <set>
using namespace hexchess;
using Json=nlohmann::json;
static Json compact(Json view){
 Json pieces=Json::array();auto cells=view["board"]["cells"];
 for(std::size_t i=0;i<cells.size();++i)if(!cells[i]["piece"].is_null())pieces.push_back(Json::array({i,cells[i]["piece"]}));
 view.erase("board");view["pieces"]=pieces;
 for(auto& m:view["legalMoves"])m.erase("changes");
 return view;
}
static Json moveJson(const Move& m){Json r={{"from",{{"q",m.from.q},{"r",m.from.r}}},{"to",{{"q",m.to.q},{"r",m.to.r}}}};return r;}
static int distance(Hex a,Hex b){return std::max({std::abs(a.q-b.q),std::abs(a.r-b.r),std::abs(a.q+a.r-b.q-b.r)});}
int main(int argc,char** argv){
 if(argc<3)return 2;const int requested=argc>3?std::stoi(argv[3]):64;
 const std::string variant=argv[1];std::mt19937 rng(20261027+variant[0]*31+variant.back());const auto base=createGame(variant);const auto& cells=variantDefinition(variant).cells();
 std::vector<int> edge;for(std::size_t i=0;i<cells.size();++i){int n=0;for(auto d:std::vector<Hex>{{1,0},{0,1},{-1,1},{-1,0},{0,-1},{1,-1}})if(variantDefinition(variant).index({cells[i].q+d.q,cells[i].r+d.r})>=0)++n;if(n<=4)edge.push_back(i);}
 Json puzzles=Json::array();std::set<std::string> seen;std::uint64_t tries=0;
 while(puzzles.size()<static_cast<std::size_t>(requested)&&tries++<500000){
  auto s=base;for(auto& p:s.occupants)p={};s.activePlayer=0;s.halfmoveClock=0;s.ply=20;s.positionHistory.clear();s.enPassantTarget=s.enPassantPawn=-1;s.additionalEnPassantTargets.clear();
  if(s.wellisch){std::fill(s.wellisch->origins.begin(),s.wellisch->origins.end(),255);s.wellisch->controllers={0,1,2};for(auto& r:s.wellisch->reserves)r.clear();s.wellisch->consecutivePasses=0;}
  auto put=[&](int i,PieceType t,int p){if(!s.occupants[i].empty())return false;s.occupants[i]={t,static_cast<PlayerId>(p),true};if(s.wellisch)s.wellisch->origins[i]=p;return true;};
  const int enemy=edge[rng()%edge.size()],ours=rng()%cells.size();if(distance(cells[enemy],cells[ours])<2||distance(cells[enemy],cells[ours])>5)continue;
  if(!put(enemy,PieceType::King,1)||!put(ours,PieceType::King,0))continue;
  if(s.wellisch&&!put(rng()%cells.size(),PieceType::King,2))continue;
  bool placed=true;const int extras=2+rng()%2;
  for(int i=0;i<extras;++i){int at=rng()%cells.size();if(distance(cells[enemy],cells[at])>5||!put(at,i==0?PieceType::Queen:(i==1?PieceType::Rook:PieceType::Knight),0)){placed=false;break;}}
  if(!placed)continue;
  if(!s.wellisch&&rng()%3==0&&!put(rng()%cells.size(),PieceType::Rook,1))continue;
  try{validatePosition(s);const auto legal=generateLegalMoves(s);if(getGameResult(s,legal).type!=ResultType::Ongoing||legal.size()<3)continue;
   std::vector<std::pair<Move,GameState>> wins;
   for(const auto& m:legal){auto next=applyCandidateMove(s,m);if(s.wellisch){if(std::count(next.wellisch->controllers.begin(),next.wellisch->controllers.end(),0)>1)wins.emplace_back(m,next);}else {const auto result=getGameResult(next);if(result.type==ResultType::Checkmate&&result.winner==0)wins.emplace_back(m,next);}}
   if(wins.empty()||wins.size()>3)continue;
   const auto state=engine_one::encodeState(s);const auto key=state["occupants"].dump();if(!seen.insert(key).second)continue;
   Json answers=Json::array();for(const auto& [m,next]:wins){const auto checked=applyMove(s,m);validatePosition(checked);answers.push_back({{"move",moveJson(m)},{"after",compact(engine_one::describeGame(checked))}});}
   puzzles.push_back({{"key",variant+"-"+std::to_string(puzzles.size()+1)},{"goal",s.wellisch?"king":"mate"},{"position",compact(engine_one::describeGame(s))},{"answers",answers},{"sourceState",state}});
  }catch(const std::invalid_argument&){}
 }
 if(puzzles.size()!=static_cast<std::size_t>(requested)){std::cerr<<variant<<" only "<<puzzles.size()<<" after "<<tries<<" candidates\n";return 1;}
 auto geometry=engine_one::describeGame(base)["board"];for(auto& c:geometry["cells"])c["piece"]=nullptr;
 std::ofstream out(argv[2]);out<<Json({{"variant",variant},{"geometry",geometry},{"puzzles",puzzles}}).dump();
 std::cout<<variant<<": "<<puzzles.size()<<" verified puzzles from "<<tries<<" candidates\n";
}
