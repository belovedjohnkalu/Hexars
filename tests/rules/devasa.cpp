#include "hexchess/devasa.hpp"
#include "hexchess/rules.hpp"
#include <array>
#include <iostream>
#include <set>
#include <stdexcept>
using namespace hexchess;
static int assertions=0;
static void require(bool ok,const char* message){++assertions;if(!ok)throw std::runtime_error(message);}
template<class F>static void rejects(F fn,const char* message){bool rejected=false;try{fn();}catch(const std::invalid_argument&){rejected=true;}require(rejected,message);}
int main(){try{
    const auto& board=devasa::cells();require(board.size()==81,"De Vasa needs 81 cells");require(std::set<Hex>(board.begin(),board.end()).size()==81,"Duplicate cells");
    for(int axis=-4;axis<=4;++axis){int file=0,rank=0;for(const auto cell:board){file+=cell.q==axis;rank+=cell.r==axis;}require(file==9&&rank==9,"Every rank/file needs nine cells");}
    for(std::size_t i=0;i<board.size();++i){require(devasa::index(board[i])==static_cast<int>(i),"Ordered index mismatch");require(devasa::fromNotation(devasa::notation(board[i]))==board[i],"Notation roundtrip failed");require(devasa::index({-board[i].q,-board[i].r})>=0,"Board not half-turn symmetric");}
    require(devasa::fromNotation("a1")==Hex{-4,4}&&devasa::fromNotation("i9")==Hex{4,-4}&&devasa::fromNotation("e5")==Hex{0,0},"Independent corner/center landmarks differ");
    for(const auto h:{Hex{-5,0},Hex{5,0},Hex{0,-5},Hex{0,5}})require(devasa::index(h)==-1,"Out-of-board index accepted");
    for(const auto cell:{"a0","a10","j1","A1","e01","","f-1"})rejects([&]{devasa::fromNotation(cell);},"Invalid notation accepted");
    const auto state=devasa::startingPosition();require(state.variant=="devasa"&&state.occupants.size()==81&&state.activePlayer==0&&state.turnOrder==std::vector<PlayerId>{0,1},"Setup metadata wrong");
    int counts[2][7]{};for(const auto piece:state.occupants)if(!piece.empty()){++counts[piece.player][static_cast<int>(piece.type)];require(!piece.hasMoved,"Initial movement rights lost");}
    for(int side=0;side<2;++side)for(int type=1;type<=6;++type)require(counts[side][type]==std::array<int,7>{0,9,2,3,2,1,1}[type],"Piece quantities differ");
    const std::array<PieceType,9> white{PieceType::Rook,PieceType::Knight,PieceType::Bishop,PieceType::Queen,PieceType::Bishop,PieceType::King,PieceType::Bishop,PieceType::Knight,PieceType::Rook};
    const std::array<PieceType,9> black{PieceType::Rook,PieceType::Knight,PieceType::Bishop,PieceType::King,PieceType::Bishop,PieceType::Queen,PieceType::Bishop,PieceType::Knight,PieceType::Rook};
    for(int f=0;f<9;++f)for(PlayerId side=0;side<2;++side){const auto file=std::string(1,static_cast<char>('a'+f));const auto home=devasa::fromNotation(file+(side==0?"1":"9")),pawn=devasa::fromNotation(file+(side==0?"3":"7"));const auto p=state.occupants[devasa::index(home)],p2=state.occupants[devasa::index(pawn)];require(p.type==(side==0?white[f]:black[f])&&p.player==side,"Explicit historical back rank differs");require(p2.type==PieceType::Pawn&&p2.player==side&&devasa::pawnStartingCell(pawn,side),"Explicit pawn row differs");require(state.occupants[devasa::index(devasa::fromNotation(file+(side==0?"2":"8")))].empty(),"Second rank must be empty");}
    for(const auto h:board)for(PlayerId side=0;side<2;++side){require(devasa::promotionCell(h,side)==(h.r==(side==0?-4:4)),"Promotion on wrong edge");require(devasa::pawnStartingCell(h,side)==(h.r==(side==0?2:-2)),"Starting pawn rights on wrong rank");}
    require(devasa::pawnForwardDirections(0)==std::array<Hex,2>{{{0,-1},{1,-1}}}&&devasa::pawnForwardDirections(1)==std::array<Hex,2>{{{0,1},{-1,1}}},"Forward axes wrong");
    for(PlayerId side=0;side<2;++side)for(const auto direction:devasa::pawnCaptureDirections(side))require(cellColour(direction)==cellColour({0,0}),"Pawn capture changes cell color");
    const char* targets[2][4]{{"h1","g1","c1","d1"},{"b9","c9","g9","f9"}};
    for(PlayerId side=0;side<2;++side){const auto plans=devasa::castlePlans(side);for(int flank=0;flank<2;++flank){require(devasa::notation(plans[flank].kingTo)==targets[side][flank*2],"King castle destination wrong");require(devasa::notation(plans[flank].rookTo)==targets[side][flank*2+1],"Rook castle destination wrong");}}
    rejects([&]{devasa::pawnForwardDirections(2);},"Third player accepted");rejects([&]{createGame("devasa");},"Unfinished rules advertised playable");rejects([&]{generateLegalMoves(state);},"Unfinished setup inherited another variant's rules");
    std::cout<<"De Vasa foundation: "<<assertions<<" geometry/setup assertions; gameplay remains disabled\n";
}catch(const std::exception& e){std::cerr<<"De Vasa foundation failure: "<<e.what()<<'\n';return 1;}}
