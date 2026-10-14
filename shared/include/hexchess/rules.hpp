#pragma once
#include "game_state.hpp"
#include "variant.hpp"
#include <string_view>

namespace hexchess {
const std::vector<Hex>& glinskiCells();
int glinskiIndex(Hex position);
std::string glinskiNotation(Hex position);
Hex glinskiFromNotation(std::string_view notation);
bool glinskiPawnStart(Hex position, PlayerId player);
bool glinskiPromotionCell(Hex position, PlayerId player);
GameState createGlinskiStartingPosition();
GameState createGame(const VariantId& variant);
void validatePosition(const GameState& state);
std::vector<Move> generateLegalMoves(const GameState& state);
std::vector<Move> generateCandidateMoves(const GameState& state);
bool isAttacked(const GameState& state, Hex position, PlayerId attacker);
bool isInCheck(const GameState& state, PlayerId player);
bool isEnPassantCapture(const GameState& state, const Move& move);
GameState applyMove(const GameState& state, const Move& move);
// Only rules/search internals use this; public input must call applyMove.
GameState applyCandidateMove(const GameState& state, const Move& move, bool recordHistory = true);
std::uint64_t positionKey(const GameState& state);
GameResult getGameResult(const GameState& state);
GameResult getGameResult(const GameState& state, const std::vector<Move>& legalMoves);
}
