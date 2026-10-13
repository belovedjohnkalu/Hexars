#include "hexchess/rules.hpp"
#include <algorithm>
#include <array>
#include <cmath>
#include <stdexcept>

namespace hexchess {
static constexpr std::array<Hex, 6> edge{{{1,0},{1,-1},{0,-1},{-1,0},{-1,1},{0,1}}};
static constexpr std::array<Hex, 6> vertex{{{2,-1},{1,-2},{-1,-1},{-2,1},{-1,2},{1,1}}};
static Hex add(Hex a, Hex b, int times = 1) { return {a.q + b.q * times, a.r + b.r * times}; }
static const Piece empty{};
static const Piece& occupant(const GameState& state, Hex position) {
    const int index = glinskiIndex(position);
    return index < 0 ? empty : state.occupants[index];
}

static std::array<Hex, 12> knightDirections() {
    std::array<Hex, 12> result{};
    for (int i = 0; i < 6; ++i) {
        result[i * 2] = add(edge[(i + 1) % 6], edge[i], 2);
        result[i * 2 + 1] = add(edge[(i + 5) % 6], edge[i], 2);
    }
    return result;
}

static void addMove(const GameState& state, std::vector<Move>& moves, Hex from, Hex to) {
    if (glinskiIndex(to) < 0) return;
    const auto& target = occupant(state, to);
    if (!target.empty() && (target.player == state.activePlayer || target.type == PieceType::King)) return;
    const auto& source = occupant(state, from);
    if (source.type == PieceType::Pawn && glinskiPromotionCell(to, source.player)) {
        for (const auto promotion : {PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight}) moves.push_back({from, to, promotion});
    } else moves.push_back({from, to});
}

template <std::size_t N>
static void rays(const GameState& state, std::vector<Move>& moves, Hex from, const std::array<Hex, N>& directions, int limit = 11) {
    for (const auto direction : directions) {
        for (int distance = 1; distance <= limit; ++distance) {
            const Hex to = add(from, direction, distance);
            if (glinskiIndex(to) < 0) break;
            addMove(state, moves, from, to);
            if (!occupant(state, to).empty()) break;
        }
    }
}

std::vector<Move> generateCandidateMoves(const GameState& state) {
    std::vector<Move> moves;
    moves.reserve(150);
    const auto& cells = glinskiCells();
    static const auto knights = knightDirections();
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (piece.empty() || piece.player != state.activePlayer) continue;
        const Hex from = cells[index];
        switch (piece.type) {
            case PieceType::Rook: rays(state, moves, from, edge); break;
            case PieceType::Bishop: rays(state, moves, from, vertex); break;
            case PieceType::Queen: rays(state, moves, from, edge); rays(state, moves, from, vertex); break;
            case PieceType::King: rays(state, moves, from, edge, 1); rays(state, moves, from, vertex, 1); break;
            case PieceType::Knight: for (const auto direction : knights) addMove(state, moves, from, add(from, direction)); break;
            case PieceType::Pawn: {
                const int forward = piece.player == 0 ? 1 : -1;
                const Hex one{from.q, from.r + forward};
                if (glinskiIndex(one) >= 0 && occupant(state, one).empty()) {
                    addMove(state, moves, from, one);
                    const Hex two{from.q, from.r + 2 * forward};
                    if (glinskiPawnStart(from, piece.player) && glinskiIndex(two) >= 0 && occupant(state, two).empty()) addMove(state, moves, from, two);
                }
                const std::array<Hex, 2> captures = piece.player == 0 ? std::array<Hex,2>{{{1,0},{-1,1}}} : std::array<Hex,2>{{{-1,0},{1,-1}}};
                for (const auto direction : captures) {
                    const Hex to = add(from, direction);
                    const int toIndex = glinskiIndex(to);
                    if (toIndex < 0) continue;
                    const auto target = occupant(state, to);
                    if ((!target.empty() && target.player != piece.player) ||
                        (toIndex == state.enPassantTarget && target.empty() && state.enPassantPawn >= 0 &&
                         state.occupants[state.enPassantPawn].type == PieceType::Pawn && state.occupants[state.enPassantPawn].player != piece.player)) addMove(state, moves, from, to);
                }
                break;
            }
            default: break;
        }
    }
    return moves;
}

template <std::size_t N>
static bool attacksAlong(const GameState& state, Hex from, Hex target, const std::array<Hex, N>& directions, int limit = 11) {
    for (const auto direction : directions) {
        for (int distance = 1; distance <= limit; ++distance) {
            const auto to = add(from, direction, distance);
            if (glinskiIndex(to) < 0) break;
            if (to == target) return true;
            if (!occupant(state, to).empty()) break;
        }
    }
    return false;
}

bool isAttacked(const GameState& state, Hex position, PlayerId attacker) {
    const auto& cells = glinskiCells();
    static const auto knights = knightDirections();
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (piece.empty() || piece.player != attacker) continue;
        const auto from = cells[index];
        switch (piece.type) {
            case PieceType::Rook: if (attacksAlong(state, from, position, edge)) return true; break;
            case PieceType::Bishop: if (attacksAlong(state, from, position, vertex)) return true; break;
            case PieceType::Queen: if (attacksAlong(state, from, position, edge) || attacksAlong(state, from, position, vertex)) return true; break;
            case PieceType::King: if (attacksAlong(state, from, position, edge, 1) || attacksAlong(state, from, position, vertex, 1)) return true; break;
            case PieceType::Knight: for (const auto direction : knights) if (add(from, direction) == position) return true; break;
            case PieceType::Pawn:
                if (piece.player == 0 && (add(from, {1,0}) == position || add(from, {-1,1}) == position)) return true;
                if (piece.player == 1 && (add(from, {-1,0}) == position || add(from, {1,-1}) == position)) return true;
                break;
            default: break;
        }
    }
    return false;
}

bool isInCheck(const GameState& state, PlayerId player) {
    const auto& cells = glinskiCells();
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (piece.type == PieceType::King && piece.player == player) {
            for (const auto opponent : state.turnOrder) if (opponent != player && isAttacked(state, cells[index], opponent)) return true;
            return false;
        }
    }
    throw std::invalid_argument("Player has no king");
}

GameState applyCandidateMove(const GameState& state, const Move& move, bool recordHistory) {
    GameState next = state;
    const int from = glinskiIndex(move.from), to = glinskiIndex(move.to);
    const auto piece = state.occupants[from];
    bool capture = !state.occupants[to].empty();
    if (piece.type == PieceType::Pawn && to == state.enPassantTarget && state.occupants[to].empty()) {
        next.occupants[state.enPassantPawn] = {};
        capture = true;
    }
    next.occupants[from] = {};
    next.occupants[to] = piece;
    next.occupants[to].hasMoved = true;
    if (move.promotion != PieceType::None) next.occupants[to].type = move.promotion;
    next.enPassantTarget = next.enPassantPawn = -1;
    if (piece.type == PieceType::Pawn && std::abs(move.to.r - move.from.r) == 2 && move.to.q == move.from.q) {
        next.enPassantTarget = glinskiIndex({move.from.q, (move.from.r + move.to.r) / 2});
        next.enPassantPawn = to;
    }
    next.halfmoveClock = capture || piece.type == PieceType::Pawn ? 0 : state.halfmoveClock + 1;
    next.ply = state.ply + 1;
    const auto turn = std::find(state.turnOrder.begin(), state.turnOrder.end(), state.activePlayer);
    next.activePlayer = state.turnOrder[(std::distance(state.turnOrder.begin(), turn) + 1) % state.turnOrder.size()];
    if (recordHistory) {
        // A capture or pawn advance makes earlier positions unreachable.
        if (capture || piece.type == PieceType::Pawn) next.positionHistory.clear();
        next.positionHistory.push_back(positionKey(next));
    }
    return next;
}

std::vector<Move> generateLegalMoves(const GameState& state) {
    std::vector<Move> legal;
    for (const auto& move : generateCandidateMoves(state)) {
        const auto next = applyCandidateMove(state, move, false);
        if (!isInCheck(next, state.activePlayer)) legal.push_back(move);
    }
    return legal;
}

std::uint64_t positionKey(const GameState& state) {
    std::uint64_t hash = 1469598103934665603ULL;
    const auto mix = [&](std::uint64_t value) { hash ^= value; hash *= 1099511628211ULL; };
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        mix(piece.empty() ? 0 : static_cast<int>(piece.type) + 8 * piece.player);
    }
    mix(state.activePlayer);
    // An en-passant right changes repetition only when a legal capture exists.
    if (state.enPassantTarget >= 0 && state.enPassantPawn >= 0) {
        for (const auto& move : generateCandidateMoves(state)) {
            if (glinskiIndex(move.to) == state.enPassantTarget && occupant(state, move.from).type == PieceType::Pawn &&
                !isInCheck(applyCandidateMove(state, move, false), state.activePlayer)) {
                mix(static_cast<std::uint64_t>(state.enPassantTarget) + 1);
                break;
            }
        }
    }
    return hash;
}

void validatePosition(const GameState& state) {
    if (state.variant != "glinski" || state.occupants.size() != glinskiCells().size() ||
        state.turnOrder != std::vector<PlayerId>{0,1} || state.activePlayer > 1 ||
        state.halfmoveClock < 0 || state.halfmoveClock > 10000 || state.ply < 0 || state.ply > 100000 ||
        state.positionHistory.size() > 2048) throw std::invalid_argument("Invalid Gliński game state");
    int kings[2]{0,0};
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (static_cast<int>(piece.type) > 6 || (!piece.empty() && piece.player > 1)) throw std::invalid_argument("Invalid piece");
        if (piece.type == PieceType::King) ++kings[piece.player];
        if (piece.type == PieceType::Pawn && glinskiPromotionCell(glinskiCells()[index], piece.player)) throw std::invalid_argument("Unpromoted pawn on last cell");
    }
    if (kings[0] != 1 || kings[1] != 1) throw std::invalid_argument("Each player must have exactly one king");
    if (isInCheck(state, static_cast<PlayerId>(1 - state.activePlayer))) throw std::invalid_argument("Previous player left its king in check");
    if ((state.enPassantTarget == -1) != (state.enPassantPawn == -1) || state.enPassantTarget < -1 ||
        state.enPassantPawn < -1 || state.enPassantTarget >= 91 || state.enPassantPawn >= 91) throw std::invalid_argument("Invalid en-passant rights");
    if (state.enPassantTarget >= 0) {
        const auto pawn = state.occupants[state.enPassantPawn];
        const auto target = glinskiCells()[state.enPassantTarget];
        const auto end = glinskiCells()[state.enPassantPawn];
        const int direction = pawn.player == 0 ? 1 : -1;
        if (pawn.type != PieceType::Pawn || pawn.player == state.activePlayer || !state.occupants[state.enPassantTarget].empty() ||
            end != Hex{target.q,target.r + direction} || !glinskiPawnStart({end.q,end.r - direction * 2},pawn.player)) throw std::invalid_argument("Inconsistent en-passant rights");
    }
    if (!state.positionHistory.empty() && state.positionHistory.back() != positionKey(state)) throw std::invalid_argument("Position history does not match state");
}

GameResult getGameResult(const GameState& state, const std::vector<Move>& legalMoves) {
    // A checkmate already delivered by the final move takes precedence.
    if (legalMoves.empty() && isInCheck(state, state.activePlayer)) {
        GameResult result;
        result.type = ResultType::Checkmate;
        result.winner = static_cast<int>(1 - state.activePlayer);
        result.scores[result.winner] = 1.0;
        result.scores[state.activePlayer] = 0.0;
        return result;
    }
    int remaining[2]{0, 0};
    bool eligible = true;
    for (const auto piece : state.occupants) {
        if (piece.empty() || piece.type == PieceType::King) continue;
        ++remaining[piece.player];
        eligible = eligible && (piece.type == PieceType::Bishop ||
            piece.type == PieceType::Knight || piece.type == PieceType::Rook);
    }
    if (remaining[0] == 0 && remaining[1] == 0) return {ResultType::InsufficientMaterial};
    // HEXARS house rule: this is an early draw, not historical stalemate or
    // a claim that these pieces cannot mate in Gliński's chess.
    if (eligible && remaining[0] <= 1 && remaining[1] <= 1) return {ResultType::LowMaterialDraw};
    if (legalMoves.empty()) {
        GameResult result;
        result.type = ResultType::Stalemate;
        result.winner = static_cast<int>(1 - state.activePlayer);
        result.scores[result.winner] = 0.75;
        result.scores[state.activePlayer] = 0.25;
        return result;
    }
    if (std::count(state.positionHistory.begin(), state.positionHistory.end(), positionKey(state)) >= 3) return {ResultType::Repetition};
    if (state.halfmoveClock >= 100) return {ResultType::FiftyMove};
    return {};
}

GameResult getGameResult(const GameState& state) { return getGameResult(state, generateLegalMoves(state)); }

GameState applyMove(const GameState& state, const Move& move) {
    validatePosition(state);
    const auto legal = generateLegalMoves(state);
    if (getGameResult(state, legal).type != ResultType::Ongoing) throw std::invalid_argument("Game has ended");
    if (std::find(legal.begin(), legal.end(), move) == legal.end()) throw std::invalid_argument("Illegal move");
    return applyCandidateMove(state, move);
}
}
