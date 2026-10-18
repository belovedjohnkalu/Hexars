#pragma once
#include "game_state.hpp"
#include <array>
#include <string_view>

// Experimental three-player foundation. Geometry below is not legal move
// generation; check, takeover, promotion timing and results are not enabled yet.
namespace hexchess::wellisch {
inline constexpr PlayerId noPlayer=255;
struct Position {
    GameState game;
    std::array<std::vector<PieceType>,3> promotionReserves;
    // A captured army can change allegiance while its pawns keep their direction.
    std::vector<PlayerId> pawnOrigins;
    std::array<bool,3> activePlayers{true,true,true};
};
const std::vector<Hex>& cells();
int index(Hex position);
std::string notation(Hex position);
Hex fromNotation(std::string_view notation);
Hex rotate(Hex position,int thirds=1);
GameState startingPosition();
Position startingGame();
std::array<Hex,2> pawnForwardDirections(PlayerId player);
bool promotionCell(Hex position,PlayerId player);
// Empty-board geometric destinations only; ignores occupancy and king safety.
std::vector<Hex> geometricDestinations(PieceType type,PlayerId player,Hex from);
std::vector<PieceType> promotionChoices(const Position& position,PlayerId player);
struct CastleSwap {Hex king;Hex rook;};
std::array<CastleSwap,2> castleSwaps(PlayerId player);
}
