#include "hexchess/rules.hpp"
#include "../../engines/engine-1/search.hpp"
#include <algorithm>
#include <iostream>
#include <random>
#include <stdexcept>
#include <string>

using namespace hexchess;
static int assertions=0;
static void require(bool condition,const std::string& message) { ++assertions; if(!condition) throw std::runtime_error(message); }
static void put(GameState& state,const char* cell,PieceType type,PlayerId player) { state.occupants[glinskiIndex(glinskiFromNotation(cell))]={type,player,false}; }
static GameState fixture(const char* white="a2",const char* black="l5",PlayerId active=0) {
    GameState state; state.occupants.resize(91);state.activePlayer=active;
    put(state,white,PieceType::King,0);put(state,black,PieceType::King,1);return state;
}
static Move move(const char* from,const char* to,PieceType promotion=PieceType::None) { return {glinskiFromNotation(from),glinskiFromNotation(to),promotion}; }
static bool has(const GameState& state,const Move& target,bool candidate=false) {
    const auto moves=candidate?generateCandidateMoves(state):generateLegalMoves(state);
    return std::find(moves.begin(),moves.end(),target)!=moves.end();
}
static int fromCount(const GameState& state,const char* cell) {
    const auto from=glinskiFromNotation(cell); const auto moves=generateCandidateMoves(state);
    return std::count_if(moves.begin(),moves.end(),[&](const auto& value){return value.from==from;});
}
template<class F> static void rejects(F function,const char* message) { bool rejected=false;try{function();}catch(const std::exception&){rejected=true;}require(rejected,message); }

int main() {
    for(std::size_t i=0;i<glinskiCells().size();++i) {
        const auto cell=glinskiCells()[i];
        require(glinskiIndex(cell)==static_cast<int>(i),"Packed cell index mismatch");
        require(glinskiFromNotation(glinskiNotation(cell))==cell,"Notation round trip failed");
    }
    require(glinskiFromNotation("f1")==Hex{0,-5},"f1 mismatch");
    require(glinskiFromNotation("f11")==Hex{0,5},"f11 mismatch");
    for(const auto invalid:{"j1","a7","f12","f0","f01","z3"}) rejects([&]{glinskiFromNotation(invalid);},"Invalid notation accepted");
    auto initial=createGame("glinski");
    int counts[2][7]{};for(const auto piece:initial.occupants)if(!piece.empty())++counts[piece.player][static_cast<int>(piece.type)];
    for(int player=0;player<2;++player) {
        require(counts[player][1]==9,"Must have nine pawns");require(counts[player][2]==2,"Must have two knights");
        require(counts[player][3]==3,"Must have three bishops");require(counts[player][4]==2,"Must have two rooks");
        require(counts[player][5]==1&&counts[player][6]==1,"Must have a queen and king");
    }
    require(!isInCheck(initial,0)&&!isInCheck(initial,1),"Initial king in check");
    require(!has(initial,move("f5","f7")),"Blocked central pawn double step accepted");
    rejects([&]{createGame("wellisch");},"Unimplemented variant accepted");
    for(const auto& pair:{std::pair{PieceType::Rook,30},std::pair{PieceType::Bishop,12},std::pair{PieceType::Queen,42},std::pair{PieceType::Knight,12}}) {
        auto state=fixture();put(state,"f6",pair.first,0);require(fromCount(state,"f6")==pair.second,"Centre movement count failed");
        if(pair.first==PieceType::Bishop)for(const auto& value:generateCandidateMoves(state))if(value.from==glinskiFromNotation("f6"))require(cellColour(value.from)==cellColour(value.to),"Bishop changed colour");
    }
    auto king=fixture("f6");require(fromCount(king,"f6")==12,"King must have twelve centre moves");
    auto rook=fixture();put(rook,"f6",PieceType::Rook,0);put(rook,"f8",PieceType::Pawn,0);
    require(!has(rook,move("f6","f8"),true)&&!has(rook,move("f6","f9"),true),"Friendly rook blocker ignored");
    put(rook,"f8",PieceType::Pawn,1);require(has(rook,move("f6","f8"),true)&&!has(rook,move("f6","f9"),true),"Enemy rook blocker ignored");
    auto bishop=fixture();put(bishop,"f6",PieceType::Bishop,0);put(bishop,"g7",PieceType::Pawn,1);
    require(has(bishop,move("f6","g7"),true)&&!has(bishop,move("f6","h8"),true),"Bishop blocking failed");
    auto knight=fixture();put(knight,"f6",PieceType::Knight,0);put(knight,"g6",PieceType::Pawn,0);
    require(fromCount(knight,"f6")==12,"Knight failed to jump over blocker");
    auto pawn=fixture();put(pawn,"f5",PieceType::Pawn,0);put(pawn,"g5",PieceType::Pawn,1);put(pawn,"e5",PieceType::Pawn,1);
    for(const auto target:{"f6","f7","g5","e5"})require(has(pawn,move("f5",target)),"Pawn movement or capture failed");
    require(!has(pawn,move("f5","f4")),"Backward pawn move accepted");
    auto reclaim=fixture();put(reclaim,"e4",PieceType::Pawn,0);put(reclaim,"f5",PieceType::Rook,1);
    reclaim=applyMove(reclaim,move("e4","f5"));reclaim.activePlayer=0;reclaim.positionHistory.clear();
    require(reclaim.occupants[glinskiIndex(glinskiFromNotation("f5"))].hasMoved,"Pawn movement history not set");
    require(has(reclaim,move("f5","f7")),"Captured starting cell did not regain double advance");
    auto ep=fixture("a2","l5",1);put(ep,"c7",PieceType::Pawn,1);put(ep,"b5",PieceType::Pawn,0);
    ep=applyMove(ep,move("c7","c5"));require(has(ep,move("b5","c6")),"En passant not generated");
    const auto captured=applyMove(ep,move("b5","c6"));require(captured.occupants[glinskiIndex(glinskiFromNotation("c5"))].empty(),"En-passant pawn not removed");
    require(captured.enPassantTarget==-1,"En passant right not cleared");
    auto expired=applyMove(ep,move("a2","a3"));expired=applyMove(expired,move("l5","l4"));require(!has(expired,move("b5","c6")),"Expired en passant accepted");
    auto epPin=fixture("b4","l5",1);put(epPin,"b5",PieceType::Pawn,0);put(epPin,"b7",PieceType::Rook,1);put(epPin,"c7",PieceType::Pawn,1);
    epPin=applyMove(epPin,move("c7","c5"));require(!has(epPin,move("b5","c6")),"Pinned en passant accepted");
    auto pin=fixture("f1");put(pin,"f3",PieceType::Rook,0);put(pin,"f11",PieceType::Rook,1);
    require(!has(pin,move("f3","e3")),"Pinned rook moved off the pin");require(has(pin,move("f3","f4")),"Pinned rook cannot move along pin");
    auto checked=fixture("f1");put(checked,"f11",PieceType::Rook,1);require(isInCheck(checked,0),"Check not detected");
    require(!has(checked,move("f1","f2")),"King moved into attacked cell");require(has(checked,move("f1","g1")),"Legal king escape not generated");
    auto promotion=fixture();put(promotion,"f10",PieceType::Pawn,0);
    for(const auto type:{PieceType::Queen,PieceType::Rook,PieceType::Bishop,PieceType::Knight})require(has(promotion,move("f10","f11",type)),"Promotion option missing");
    rejects([&]{applyMove(promotion,move("f10","f11"));},"Unspecified promotion accepted");
    const auto promoted=applyMove(promotion,move("f10","f11",PieceType::Knight));require(promoted.occupants[glinskiIndex(glinskiFromNotation("f11"))].type==PieceType::Knight,"Underpromotion failed");
    auto illegal=initial;rejects([&]{applyMove(illegal,move("b1","b6"));},"Illegal move accepted");require(illegal.ply==0,"Illegal move mutated original state");
    illegal.occupants[glinskiIndex(glinskiFromNotation("g1"))]={};rejects([&]{validatePosition(illegal);},"Missing king accepted");
    // Published Gliński fool's mate independently verifies notation, setup, rays,
    // blockers, king safety, move application, and terminal detection together.
    auto mate=initial;
    for(const auto& pair:{std::pair{"e1","c3"},std::pair{"e10","c6"},std::pair{"b1","b2"},std::pair{"b7","b6"},std::pair{"f3","b1"},std::pair{"e7","e6"},std::pair{"c3","f9"}})mate=applyMove(mate,move(pair.first,pair.second));
    const auto mateResult=getGameResult(mate);require(mateResult.type==ResultType::Checkmate&&mateResult.winner==0,"Historical fool's mate not recognized");
    rejects([&]{applyMove(mate,move("g10","g9"));},"Move after game end accepted");
    auto stalemate=fixture("h8","f11",1);put(stalemate,"e8",PieceType::Queen,0);
    require(!isInCheck(stalemate,1)&&generateLegalMoves(stalemate).empty(),"Stalemate fixture incorrect");
    const auto staleResult=getGameResult(stalemate);require(staleResult.type==ResultType::Stalemate&&staleResult.scores[0]==.75&&staleResult.scores[1]==.25,"Fractional stalemate scoring failed");
    // A lone bishop can mate in a corner. Do not copy orthodox insufficient-material rules.
    auto minorMate=fixture("f9","f11",1);put(minorMate,"g9",PieceType::Bishop,0);
    require(getGameResult(minorMate).type==ResultType::Checkmate,"Exceptional lone-bishop mate missed");
    auto minor=fixture();put(minor,"f6",PieceType::Bishop,0);require(getGameResult(minor).type==ResultType::Ongoing,"Minor piece incorrectly declared insufficient");
    auto draw=fixture();put(draw,"f6",PieceType::Rook,0);draw.halfmoveClock=100;require(getGameResult(draw).type==ResultType::FiftyMove,"Fifty-move draw failed");
    draw.halfmoveClock=0;draw.positionHistory={positionKey(draw),positionKey(draw),positionKey(draw)};require(getGameResult(draw).type==ResultType::Repetition,"Repetition draw failed");
    auto noEp=ep;noEp.enPassantTarget=noEp.enPassantPawn=-1;require(positionKey(ep)!=positionKey(noEp),"Capturable en-passant right omitted from key");
    auto pinnedNoEp=epPin;pinnedNoEp.enPassantTarget=pinnedNoEp.enPassantPawn=-1;require(positionKey(epPin)==positionKey(pinnedNoEp),"Illegal en-passant right affected repetition");
    const auto chosen=engine_one::search(initial,{100,2,2000});require(chosen.move.has_value()&&has(initial,*chosen.move),"Engine returned an illegal move");require(chosen.timeMs<700,"Engine ignored time budget");
    require(!engine_one::search(mate,{10,1,100}).move.has_value(),"Engine returned move in checkmate");
    std::mt19937 random(20261013);
    int games=0,totalPlies=0;
    for(int game=0;game<12;++game) {
        auto state=initial;
        for(int ply=0;ply<500;++ply) {
            const auto legal=generateLegalMoves(state);if(getGameResult(state,legal).type!=ResultType::Ongoing){++games;break;}
            const auto selected=legal[random()%legal.size()];const auto next=applyMove(state,selected);
            require(!isInCheck(next,state.activePlayer),"Legal move left own king in check");validatePosition(next);state=next;++totalPlies;
        }
    }
    require(games>=1,"No random game reached a terminal state");
    int engineGames=0,enginePlies=0;
    for(int game=0;game<2;++game) {
        auto state=initial;
        for(int ply=0;ply<750;++ply) {
            const auto legal=generateLegalMoves(state);if(getGameResult(state,legal).type!=ResultType::Ongoing){++engineGames;break;}
            Move selected=legal[random()%legal.size()];
            if(state.activePlayer==game%2){const auto decision=engine_one::search(state,{15,2,400});require(decision.move.has_value()&&has(state,*decision.move),"Illegal engine simulation move");selected=*decision.move;}
            state=applyMove(state,selected);validatePosition(state);++enginePlies;
        }
    }
    require(engineGames>=1,"Engine versus random did not finish a game");
    std::cout<<"Gliński rules/search: "<<assertions<<" assertions passed; "<<totalPlies<<" random plies; "<<games<<" complete random games; "<<enginePlies<<" engine plies; "<<engineGames<<" complete engine games.\n";
}
