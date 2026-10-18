#include "hexchess/rules.hpp"
#include "hexchess/variant.hpp"
#include <stdexcept>
#include "hexchess/brusky.hpp"
#include "hexchess/devasa.hpp"

namespace hexchess {
const VariantDefinition& variantDefinition(const VariantId& id) {
    static const VariantDefinition glinski{
        "glinski", glinskiCells, glinskiIndex, glinskiNotation, glinskiPawnStart, false,
        {{{{{1,0},{-1,1}}}, {{{-1,0},{1,-1}}}}}, true};
    static const VariantDefinition mccooey{
        "mccooey", glinskiCells, glinskiIndex, glinskiNotation, mccooeyPawnStart, true,
        {{{{{1,1},{-1,2}}}, {{{-1,-1},{1,-2}}}}}, false};
    if (id == "glinski") return glinski;
    if (id == "mccooey") return mccooey;
    static const VariantDefinition shafran{
        "shafran", shafranCells, shafranIndex, shafranNotation, shafranPawnStart, true,
        {{{{{1,1},{-1,2}}}, {{{-1,-1},{1,-2}}}}}, false, shafranPawnInitialAdvance, true};
    if (id == "shafran") return shafran;
    static const VariantDefinition bruskyRules{
        "brusky",brusky::cells,brusky::index,brusky::notation,brusky::pawnStartingCell,true,
        {{{{{-1,-1},{2,-1}}}, {{{1,1},{-2,1}}}}},false,nullptr,true,
        [](PlayerId p){const auto d=brusky::pawnForwardDirections(p);return std::vector<Hex>(d.begin(),d.end());},brusky::promotionCell,
        [](PlayerId p){std::vector<CastlingPlan> out;for(const auto c:brusky::castlePlans(p))out.push_back({c.kingFrom,c.kingTo,c.rookFrom,c.rookTo});return out;},true,true,true};
    static const VariantDefinition devasaRules{
        "devasa",devasa::cells,devasa::index,devasa::notation,devasa::pawnStartingCell,true,
        {{{{{-1,-1},{2,-1}}}, {{{1,1},{-2,1}}}}},false,nullptr,true,
        [](PlayerId p){const auto d=devasa::pawnForwardDirections(p);return std::vector<Hex>(d.begin(),d.end());},devasa::promotionCell,
        [](PlayerId p){std::vector<CastlingPlan> out;for(const auto c:devasa::castlePlans(p))out.push_back({c.kingFrom,c.kingTo,c.rookFrom,c.rookTo});return out;},false,false,true};
    if(id=="brusky")return bruskyRules;
    if(id=="devasa")return devasaRules;
    throw std::invalid_argument("Variant not implemented");
}
GameState createGame(const VariantId& variant) {
    if (variant == "glinski") return createGlinskiStartingPosition();
    if (variant == "mccooey") return createMcCooeyStartingPosition();
    if (variant == "shafran") return createShafranStartingPosition();
    if (variant == "brusky") return brusky::startingPosition();
    if (variant == "devasa") return devasa::startingPosition();
    throw std::invalid_argument("Variant not implemented");
}
}
