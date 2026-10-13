#include "hexchess/rules.hpp"
#include "../../engines/engine-1/search.hpp"
#include <algorithm>
#include <iostream>
#include <random>
#include <stdexcept>

using namespace hexchess;
static int assertions = 0;
static void require(bool value, const char* message) { ++assertions; if (!value) throw std::runtime_error(message); }
template<class F> static void rejects(F fn,const char* message) { bool rejected=false;try{fn();}catch(const std::invalid_argument&){rejected=true;}require(rejected,message); }
static Move move(std::string_view from,std::string_view to,PieceType promotion=PieceType::None) { return {glinskiFromNotation(from),glinskiFromNotation(to),promotion}; }
static void put(GameState& state,std::string_view cell,PieceType type,PlayerId player,bool moved=false) { state.occupants[glinskiIndex(glinskiFromNotation(cell))]={type,player,moved}; }
static GameState fixture(std::string_view white="a2",std::string_view black="l5",PlayerId active=0) {
    auto state=createGame("mccooey");state.occupants.assign(91,{});state.activePlayer=active;state.positionHistory.clear();
    put(state,white,PieceType::King,0);put(state,black,PieceType::King,1);return state;
}
static bool has(const GameState& state,const Move& move,bool candidate=false) { const auto moves=candidate?generateCandidateMoves(state):generateLegalMoves(state);return std::find(moves.begin(),moves.end(),move)!=moves.end(); }
static GameState publishedGame(std::initializer_list<std::string_view> notation) {
    auto state=createGame("mccooey");
    for(auto token:notation) {
        while(!token.empty()&&(token.back()=='+'||token.back()=='#'||token.back()=='?'||token.back()=='!'))token.remove_suffix(1);
        std::size_t rank=token.size()-1;while(rank>0&&token[rank-1]>='0'&&token[rank-1]<='9')--rank;
        std::string target(token.substr(rank-1));
        // The inventor's sample games use a–k; the shared board uses a–l without j.
        if(target[0]=='j')target[0]='k';else if(target[0]=='k')target[0]='l';
        const PieceType type=token[0]=='N'?PieceType::Knight:token[0]=='B'?PieceType::Bishop:token[0]=='R'?PieceType::Rook:token[0]=='Q'?PieceType::Queen:token[0]=='K'?PieceType::King:PieceType::Pawn;
        char fromFile=0;
        const auto prefix=token.substr(type==PieceType::Pawn?0:1,rank-1-(type==PieceType::Pawn?0:1));
        for(const char c:prefix)if(c>='a'&&c<='k'){fromFile=c=='j'?'k':c=='k'?'l':c;break;}
        std::vector<Move> matches;
        for(const auto& value:generateLegalMoves(state)) {
            const auto piece=state.occupants[glinskiIndex(value.from)];
            if(piece.type==type&&glinskiNotation(value.to)==target&&(!fromFile||glinskiNotation(value.from)[0]==fromFile))matches.push_back(value);
        }
        if(matches.size()!=1)throw std::runtime_error("Published move cannot be uniquely resolved: "+std::string(token)+" at ply "+std::to_string(state.ply));
        state=applyMove(state,matches.front());validatePosition(state);++assertions;
    }
    return state;
}
int main() {
    auto initial=createGame("mccooey");
    require(initial.variant=="mccooey"&&initial.occupants.size()==91,"Wrong board or variant");
    int counts[2][7]{};for(const auto piece:initial.occupants)if(!piece.empty())++counts[piece.player][static_cast<int>(piece.type)];
    for(int player=0;player<2;++player){require(counts[player][1]==7,"Seven pawns required");require(counts[player][2]==2&&counts[player][3]==3&&counts[player][4]==2&&counts[player][5]==1&&counts[player][6]==1,"Wrong piece counts");}
    for(const auto cell:{"c1","d2","e3","f4","g3","h2","i1"})require(initial.occupants[glinskiIndex(glinskiFromNotation(cell))].type==PieceType::Pawn,"Wrong white pawn setup");
    for(const auto cell:{"c8","d8","e8","f8","g8","h8","i8"})require(initial.occupants[glinskiIndex(glinskiFromNotation(cell))].type==PieceType::Pawn,"Wrong black pawn setup");
    require(initial.occupants[glinskiIndex(glinskiFromNotation("d1"))].type==PieceType::Rook&&initial.occupants[glinskiIndex(glinskiFromNotation("e2"))].type==PieceType::Knight,"Wrong back-rank setup");
    require(initial.occupants[glinskiIndex(glinskiFromNotation("b1"))].empty(),"Gliński pawn leaked into setup");
    require(!isInCheck(initial,0)&&!isInCheck(initial,1),"Starting king in check");
    require(has(initial,move("f4","f5"))&&!has(initial,move("f4","f6")),"White centre pawn double advance allowed");
    auto black=initial;black.activePlayer=1;black.positionHistory.clear();require(has(black,move("f8","f7"))&&!has(black,move("f8","f6")),"Black centre pawn double advance allowed");
    for(const auto& pair:{std::pair{"c1","c3"},std::pair{"d2","d4"},std::pair{"e3","e5"},std::pair{"g3","g5"},std::pair{"h2","h4"},std::pair{"i1","i3"}})require(has(initial,move(pair.first,pair.second)),"White pawn first double move missing");
    for(const auto cell:{"c8","d8","e8","g8","h8","i8"}) { std::string target(cell);target.back()='6';require(has(black,move(cell,target)),"Black pawn first double move missing"); }
    auto moved=fixture();put(moved,"d2",PieceType::Pawn,0,true);require(!has(moved,move("d2","d4"))&&has(moved,move("d2","d3")),"Moved pawn regained first-move option");
    auto unmoved=moved;unmoved.occupants[glinskiIndex(glinskiFromNotation("d2"))].hasMoved=false;require(positionKey(moved)!=positionKey(unmoved),"First-move right missing from repetition key");
    auto glinski=unmoved;glinski.variant="glinski";require(positionKey(glinski)!=positionKey(unmoved),"Variants share repetition domain");
    auto pawn=fixture();put(pawn,"f6",PieceType::Pawn,0);put(pawn,"e7",PieceType::Rook,1);put(pawn,"g7",PieceType::Rook,1);put(pawn,"e6",PieceType::Pawn,1);put(pawn,"g6",PieceType::Pawn,1);
    require(has(pawn,move("f6","e7"))&&has(pawn,move("f6","g7")),"Bishop-diagonal pawn capture missing");
    require(!has(pawn,move("f6","e6"))&&!has(pawn,move("f6","g6")),"Gliński pawn capture leaked into McCooey");
    require(isAttacked(pawn,glinskiFromNotation("e7"),0)&&!isAttacked(pawn,glinskiFromNotation("e6"),0),"Pawn attack detection differs from capture rules");
    auto bp=fixture("a2","l5",1);put(bp,"f6",PieceType::Pawn,1);put(bp,"e4",PieceType::Pawn,0);put(bp,"g4",PieceType::Pawn,0);require(has(bp,move("f6","e4"))&&has(bp,move("f6","g4")),"Black diagonal captures wrong");
    auto blocked=initial;put(blocked,"d3",PieceType::Pawn,1);require(!has(blocked,move("d2","d3"))&&!has(blocked,move("d2","d4")),"Pawn jumped a forward blocker");
    auto friendly=pawn;put(friendly,"e7",PieceType::Knight,0);require(!has(friendly,move("f6","e7")),"Friendly capture accepted");
    // Published example: ...e8–e6 can be captured d5×e7 en passant.
    auto ep=fixture("a2","l5",1);put(ep,"e8",PieceType::Pawn,1);put(ep,"d5",PieceType::Pawn,0);ep=applyMove(ep,move("e8","e6"));validatePosition(ep);require(has(ep,move("d5","e7")),"Published en-passant example missing");
    auto captured=applyMove(ep,move("d5","e7"));require(captured.occupants[glinskiIndex(glinskiFromNotation("e6"))].empty(),"En-passant victim not removed");require(captured.enPassantTarget==-1,"En passant persisted after capture");
    auto expired=applyMove(ep,move("a2","a3"));expired=applyMove(expired,move("l5","l4"));require(!has(expired,move("d5","e7")),"Expired en passant accepted");
    auto epPin=fixture("d4","l5",1);put(epPin,"d5",PieceType::Pawn,0);put(epPin,"d8",PieceType::Rook,1);put(epPin,"e8",PieceType::Pawn,1);epPin=applyMove(epPin,move("e8","e6"));require(!has(epPin,move("d5","e7")),"Pinned en passant accepted");
    auto malformed=ep;malformed.occupants[malformed.enPassantPawn].hasMoved=false;rejects([&]{validatePosition(malformed);},"False moved right accepted after double advance");
    auto promotion=fixture();put(promotion,"f10",PieceType::Pawn,0);for(const auto type:{PieceType::Queen,PieceType::Rook,PieceType::Bishop,PieceType::Knight})require(has(promotion,move("f10","f11",type)),"Promotion option missing");rejects([&]{applyMove(promotion,move("f10","f11"));},"Missing promotion accepted");
    auto stale=fixture("h8","f11",1);put(stale,"e8",PieceType::Queen,0);const auto result=getGameResult(stale);require(result.type==ResultType::Stalemate&&result.winner==-1&&result.scores[0]==.5&&result.scores[1]==.5,"McCooey stalemate must score half each");require(!engine_one::search(stale,{10,1,100}).move,"Search continued after stalemate");
    // Inventor's historical sample games C and D independently exercise setup,
    // captures, jumps, diagonal blocking, checks and delivered checkmate.
    auto mate=publishedGame({"g5","f7","Ne4","fxg5","Ng6","Ne7","Ni7+","Kg9","Bi5+","h7","Be6+","Kh8","Bj7+","Kg7","Qh5"});require(getGameResult(mate).type==ResultType::Checkmate&&getGameResult(mate).winner==0,"Published Game C mate not recognized");
    auto mate2=publishedGame({"d4","f7","e5","fxe5","fxe5","Nh6","Ne4","Ng7","Be3","e6","d5","Nxe5","Bj5","Rg9","g5","Nxf3","Qxf3","Nf5","Ng6","Nxe2","Ni7+","Kh9","Nf8"});require(getGameResult(mate2).type==ResultType::Checkmate,"Published Game D mate not recognized");
    auto low=fixture();put(low,"f6",PieceType::Bishop,0);require(getGameResult(low).type==ResultType::LowMaterialDraw,"HEXARS house draw missing in McCooey");
    const auto decision=engine_one::search(initial,{100,2,2000});require(decision.move&&has(initial,*decision.move),"Tactical returned illegal McCooey move");require(decision.timeMs<700,"Search exceeded budget");
    std::mt19937 random(20261014);int games=0,plies=0;
    for(int game=0;game<10;++game){auto state=initial;for(int ply=0;ply<600;++ply){const auto legal=generateLegalMoves(state);if(getGameResult(state,legal).type!=ResultType::Ongoing){++games;break;}const auto next=applyMove(state,legal[random()%legal.size()]);require(!isInCheck(next,state.activePlayer),"Random legal move left king in check");validatePosition(next);state=next;++plies;}}
    require(games>0,"Random McCooey games did not finish");int engineGames=0,enginePlies=0;
    for(int game=0;game<2;++game){auto state=initial;for(int ply=0;ply<600;++ply){const auto legal=generateLegalMoves(state);if(getGameResult(state,legal).type!=ResultType::Ongoing){++engineGames;break;}auto selected=legal[random()%legal.size()];if(state.activePlayer==game%2){const auto found=engine_one::search(state,{15,2,400});require(found.move&&has(state,*found.move),"Invalid engine move in full game");selected=*found.move;}state=applyMove(state,selected);validatePosition(state);++enginePlies;}}
    require(engineGames>0,"No engine versus random McCooey game completed");
    std::cout<<"McCooey rules/search: "<<assertions<<" assertions passed; "<<plies<<" random plies; "<<games<<" completed random games; "<<enginePlies<<" engine plies; "<<engineGames<<" completed engine games.\n";
}
