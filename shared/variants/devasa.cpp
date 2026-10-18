#include "hexchess/devasa.hpp"
#include "hexchess/rules.hpp"
#include <stdexcept>

namespace hexchess::devasa {
// Revised 81-cell rhombus, pointy hexes. q=file-'e', r=5-rank.
// Project as x=sqrt(3)*(q+r/2), y=1.5*r. Half-turn is (-q,-r).
const std::vector<Hex>& cells() {
    static const auto board=[] {
        std::vector<Hex> result;
        for(int q=-4;q<=4;++q)for(int r=-4;r<=4;++r)result.push_back({q,r});
        return result;
    }();
    return board;
}
int index(Hex position) {
    return position.q<-4||position.q>4||position.r<-4||position.r>4?-1:(position.q+4)*9+position.r+4;
}
std::string notation(Hex position) {
    if(index(position)<0)throw std::invalid_argument("Cell outside De Vasa board");
    return std::string(1,static_cast<char>('e'+position.q))+std::to_string(5-position.r);
}
Hex fromNotation(std::string_view value) {
    if(value.size()!=2||value[0]<'a'||value[0]>'i'||value[1]<'1'||value[1]>'9')
        throw std::invalid_argument("Invalid De Vasa notation");
    return {value[0]-'e',5-(value[1]-'0')};
}
static void checkPlayer(PlayerId player) {
    if(player>1)throw std::invalid_argument("Invalid De Vasa player");
}
GameState startingPosition() {
    GameState state;
    state.variant="devasa";
    state.occupants.resize(81);
    const auto both=[&](Hex white,PieceType type){
        state.occupants[index(white)]={type,0,false};
        state.occupants[index({-white.q,-white.r})]={type,1,false};
    };
    const std::array<PieceType,9> row{PieceType::Rook,PieceType::Knight,PieceType::Bishop,
        PieceType::Queen,PieceType::Bishop,PieceType::King,PieceType::Bishop,PieceType::Knight,PieceType::Rook};
    for(int file=0;file<9;++file){both({file-4,4},row[file]);both({file-4,2},PieceType::Pawn);}
    state.positionHistory.push_back(positionKey(state));
    validatePosition(state);
    return state;
}
std::array<Hex,2> pawnForwardDirections(PlayerId player) {
    checkPlayer(player);
    return player==0?std::array<Hex,2>{{{0,-1},{1,-1}}}:std::array<Hex,2>{{{0,1},{-1,1}}};
}
std::array<Hex,2> pawnCaptureDirections(PlayerId player) {
    checkPlayer(player);
    return player==0?std::array<Hex,2>{{{-1,-1},{2,-1}}}:std::array<Hex,2>{{{1,1},{-2,1}}};
}
bool pawnStartingCell(Hex position,PlayerId player) {
    checkPlayer(player);return index(position)>=0&&position.r==(player==0?2:-2);
}
bool promotionCell(Hex position,PlayerId player) {
    checkPlayer(player);return index(position)>=0&&position.r==(player==0?-4:4);
}
std::array<CastlePlan,2> castlePlans(PlayerId player) {
    checkPlayer(player);
    std::array<CastlePlan,2> plans{{
        {fromNotation("f1"),fromNotation("h1"),fromNotation("i1"),fromNotation("g1")},
        {fromNotation("f1"),fromNotation("c1"),fromNotation("a1"),fromNotation("d1")}}};
    if(player==1)for(auto& plan:plans)for(auto* cell:{&plan.kingFrom,&plan.kingTo,&plan.rookFrom,&plan.rookTo})*cell={-cell->q,-cell->r};
    return plans;
}
}
