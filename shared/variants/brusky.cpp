#include "hexchess/brusky.hpp"
#include "hexchess/rules.hpp"
#include <algorithm>
#include <stdexcept>

namespace hexchess::brusky {
// Pointy hexes: x=sqrt(3)*(q+r/2), y=1.5*r. Conventional a–l files
// run obliquely; ranks 1–8 run horizontally. No omitted letter j.
const std::vector<Hex>& cells() {
    static const auto result=[] {
        std::vector<Hex> board;
        for(int q=-5;q<=6;++q)
            for(int r=std::max(-4,-q-6);r<=std::min(3,6-q);++r)
                board.push_back({q,r});
        return board;
    }();
    return result;
}
int index(Hex position) {
    const auto& board=cells();
    const auto found=std::lower_bound(board.begin(),board.end(),position);
    return found!=board.end()&&*found==position?static_cast<int>(found-board.begin()):-1;
}
std::string notation(Hex position) {
    if(index(position)<0)throw std::invalid_argument("Cell outside Brusky board");
    return std::string(1,static_cast<char>('f'+position.q))+std::to_string(4-position.r);
}
Hex fromNotation(std::string_view value) {
    if(value.size()!=2||value[0]<'a'||value[0]>'l'||value[1]<'1'||value[1]>'8')
        throw std::invalid_argument("Invalid Brusky notation");
    const Hex position{value[0]-'f',4-(value[1]-'0')};
    if(index(position)<0)throw std::invalid_argument("Invalid Brusky cell");
    return position;
}
static void checkPlayer(PlayerId player) {
    if(player>1)throw std::invalid_argument("Invalid Brusky player");
}
GameState startingPosition() {
    GameState state;
    state.variant="brusky";
    state.occupants.resize(cells().size());
    const auto both=[&](const std::string& cell,PieceType type){
        const auto white=fromNotation(cell);
        const Hex black{1-white.q,-1-white.r};
        state.occupants[index(white)]={type,0,false};
        state.occupants[index(black)]={type,1,false};
    };
    const std::array<PieceType,9> back{PieceType::Rook,PieceType::Knight,PieceType::Bishop,
        PieceType::Queen,PieceType::Bishop,PieceType::King,PieceType::Bishop,PieceType::Knight,PieceType::Rook};
    for(int file=0;file<9;++file)both(std::string(1,static_cast<char>('a'+file))+"1",back[file]);
    for(int file=0;file<10;++file)both(std::string(1,static_cast<char>('a'+file))+"2",PieceType::Pawn);
    state.positionHistory.push_back(positionKey(state));
    validatePosition(state);
    return state;
}
std::array<Hex,2> pawnForwardDirections(PlayerId player) {
    checkPlayer(player);
    return player==0?std::array<Hex,2>{{{0,-1},{1,-1}}}:std::array<Hex,2>{{{0,1},{-1,1}}};
}
bool pawnStartingCell(Hex position,PlayerId player) {
    checkPlayer(player);
    return index(position)>=0&&position.r==(player==0?2:-3);
}
bool promotionCell(Hex position,PlayerId player) {
    checkPlayer(player);
    return index(position)>=0&&position.r==(player==0?-4:3);
}
std::array<CastlePlan,2> castlePlans(PlayerId player) {
    checkPlayer(player);
    std::array<CastlePlan,2> plans{{
        {fromNotation("f1"),fromNotation("h1"),fromNotation("i1"),fromNotation("g1")},
        {fromNotation("f1"),fromNotation("c1"),fromNotation("a1"),fromNotation("d1")}}};
    if(player==1)for(auto& plan:plans)for(auto* cell:{&plan.kingFrom,&plan.kingTo,&plan.rookFrom,&plan.rookTo})
        *cell={1-cell->q,-1-cell->r};
    return plans;
}
}
