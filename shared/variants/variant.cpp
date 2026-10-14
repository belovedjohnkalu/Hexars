#include "hexchess/rules.hpp"
#include "hexchess/variant.hpp"
#include <stdexcept>

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
    throw std::invalid_argument("Variant not implemented");
}
GameState createGame(const VariantId& variant) {
    if (variant == "glinski") return createGlinskiStartingPosition();
    if (variant == "mccooey") return createMcCooeyStartingPosition();
    if (variant == "shafran") return createShafranStartingPosition();
    throw std::invalid_argument("Variant not implemented");
}
}
