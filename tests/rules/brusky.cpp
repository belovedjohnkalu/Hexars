#include "hexchess/brusky.hpp"
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
    const auto& board=brusky::cells();
    require(board.size()==84,"Brusky board must have 84 cells");
    require(std::set<Hex>(board.begin(),board.end()).size()==84,"Duplicate board cells");
    const int rankLengths[]{9,10,11,12,12,11,10,9};
    const int fileLengths[]{5,6,7,8,8,8,8,8,8,7,6,5};
    for(int rank=1;rank<=8;++rank){int count=0;for(const auto h:board)if(h.r==4-rank)++count;require(count==rankLengths[rank-1],"Wrong independent horizontal rank length");}
    for(int file=0;file<12;++file){int count=0;for(const auto h:board)if(h.q==file-5)++count;require(count==fileLengths[file],"Wrong independent file length");}
    for(std::size_t i=0;i<board.size();++i){require(brusky::index(board[i])==static_cast<int>(i),"Index differs from ordered cells");require(brusky::fromNotation(brusky::notation(board[i]))==board[i],"Notation roundtrip failed");require(brusky::index({1-board[i].q,-1-board[i].r})>=0,"Board rotation asymmetry");}
    require(brusky::fromNotation("a1")==Hex{-5,3}&&brusky::fromNotation("l8")==Hex{6,-4},"Board landmarks differ");
    require(brusky::index({-6,0})==-1&&brusky::index({7,0})==-1&&brusky::index({0,4})==-1&&brusky::index({0,-5})==-1,"Outside cells accepted");
    for(const auto cell:{"a6","c8","j1","k2","l3","m4","a0","e9","e01","A1",""})rejects([&]{brusky::fromNotation(cell);},"Invalid notation accepted");
    const auto initial=brusky::startingPosition();
    require(initial.variant=="brusky"&&initial.occupants.size()==84&&initial.activePlayer==0&&initial.turnOrder==std::vector<PlayerId>{0,1},"Invalid initial state metadata");
    int counts[2][7]{};for(const auto p:initial.occupants)if(!p.empty()){++counts[p.player][static_cast<int>(p.type)];require(!p.hasMoved,"Initial piece marked moved");}
    for(int side=0;side<2;++side)for(int type=1;type<=6;++type)require(counts[side][type]==std::array<int,7>{0,10,2,3,2,1,1}[type],"Wrong piece count per side");
    // Explicit historical diagram rows, independent of the setup's mirroring.
    const std::array<PieceType,9> white{PieceType::Rook,PieceType::Knight,PieceType::Bishop,PieceType::Queen,PieceType::Bishop,PieceType::King,PieceType::Bishop,PieceType::Knight,PieceType::Rook};
    const std::array<PieceType,9> black{PieceType::Rook,PieceType::Knight,PieceType::Bishop,PieceType::King,PieceType::Bishop,PieceType::Queen,PieceType::Bishop,PieceType::Knight,PieceType::Rook};
    for(int i=0;i<9;++i){const auto w=initial.occupants[brusky::index(brusky::fromNotation(std::string(1,'a'+i)+"1"))],b=initial.occupants[brusky::index(brusky::fromNotation(std::string(1,'d'+i)+"8"))];require(w.type==white[i]&&w.player==0,"White back rank differs from diagram");require(b.type==black[i]&&b.player==1,"Black back rank differs from diagram");}
    for(int i=0;i<10;++i)for(int side=0;side<2;++side){const auto h=brusky::fromNotation(std::string(1,(side?'c':'a')+i)+(side?"7":"2"));const auto p=initial.occupants[brusky::index(h)];require(p.type==PieceType::Pawn&&p.player==side&&brusky::pawnStartingCell(h,side),"Pawn setup/start rights differ");}
    for(const auto h:board){require(brusky::promotionCell(h,0)==(h.r==-4),"White promotion edge wrong");require(brusky::promotionCell(h,1)==(h.r==3),"Black promotion edge wrong");}
    require(brusky::pawnForwardDirections(0)==std::array<Hex,2>{{{0,-1},{1,-1}}}&&brusky::pawnForwardDirections(1)==std::array<Hex,2>{{{0,1},{-1,1}}},"Two pawn forward directions wrong");
    const char* targets[2][4]{{"h1","g1","c1","d1"},{"e8","f8","j8","i8"}};
    for(PlayerId side=0;side<=1;++side){const auto plans=brusky::castlePlans(side);for(int flank=0;flank<2;++flank){require(brusky::notation(plans[flank].kingTo)==targets[side][flank*2],"Castling king destination wrong");require(brusky::notation(plans[flank].rookTo)==targets[side][flank*2+1],"Castling rook destination wrong");}}
    rejects([&]{brusky::pawnForwardDirections(2);},"Third player accepted");
    // Partial work must never be advertised as a legal playable variant.
    rejects([&]{createGame("brusky");},"Unfinished Brusky exposed as playable");
    rejects([&]{generateLegalMoves(initial);},"Unfinished Brusky inherited another variant's rules");
    std::cout<<"Brusky foundation: "<<assertions<<" board/setup assertions; gameplay remains intentionally disabled\n";
}catch(const std::exception& e){std::cerr<<"Brusky foundation failure: "<<e.what()<<'\n';return 1;}}
