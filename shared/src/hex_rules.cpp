#include "hexchess/rules.hpp"
#include <algorithm>
#include <array>
#include <cmath>
#include <optional>
#include <stdexcept>

namespace hexchess {
static constexpr std::array<Hex, 6> edge{{{1,0},{1,-1},{0,-1},{-1,0},{-1,1},{0,1}}};
static constexpr std::array<Hex, 6> vertex{{{2,-1},{1,-2},{-1,-1},{-2,1},{-1,2},{1,1}}};
static Hex add(Hex a, Hex b, int times = 1) { return {a.q + b.q * times, a.r + b.r * times}; }
static const Piece empty{};
static const Piece& occupant(const GameState& state, Hex position) {
    const int index = variantDefinition(state.variant).index(position);
    return index < 0 ? empty : state.occupants[index];
}

static bool enPassantTarget(const GameState& state, int cell) {
    return cell >= 0 && (cell == state.enPassantTarget ||
        std::find(state.additionalEnPassantTargets.begin(),state.additionalEnPassantTargets.end(),cell) != state.additionalEnPassantTargets.end());
}
bool isEnPassantCapture(const GameState& state, const Move& move) {
    const auto& variant = variantDefinition(state.variant);
    const int from = variant.index(move.from), to = variant.index(move.to);
    return from >= 0 && to >= 0 && state.occupants[from].type == PieceType::Pawn &&
        state.occupants[to].empty() && enPassantTarget(state,to) && state.enPassantPawn >= 0;
}
static int pawnAdvance(const VariantDefinition& variant, Hex from, PlayerId player) {
    return variant.pawnInitialAdvance ? variant.pawnInitialAdvance(from,player) :
        variant.pawnDoubleCell(from,player) ? 2 : 1;
}
static std::vector<Hex> pawnForwards(const VariantDefinition& variant,PlayerId player) {
    return variant.pawnForwards?variant.pawnForwards(player):std::vector<Hex>{{0,player==0?1:-1}};
}
static std::vector<Hex> pawnCaptures(const GameState& state,Hex from,Piece pawn) {
    const auto& variant=variantDefinition(state.variant);
    const auto base=variant.pawnCaptures[pawn.player];
    std::vector<Hex> directions(base.begin(),base.end());
    if(variant.pawnInitialExtraCapture&&!pawn.hasMoved&&variant.pawnDoubleCell(from,pawn.player)) {
        const auto forward=pawnForwards(variant,pawn.player);
        directions.push_back(add(forward[0],forward[1]));
    }
    return directions;
}
static bool promotes(const VariantDefinition& variant,Hex to,PlayerId player) {
    return variant.promotionCell?variant.promotionCell(to,player):variant.index({to.q,to.r+(player==0?1:-1)})<0;
}
static int distance(Hex from,Hex to) {return std::max({std::abs(to.q-from.q),std::abs(to.r-from.r),std::abs(to.q+to.r-from.q-from.r)});}
static std::vector<CastlingPlan> castlePlans(const VariantDefinition& variant,PlayerId player) {
    if(!variant.castling)return {};
    if(variant.castlePlans)return variant.castlePlans(player);
    const Hex home{0,player==0?-5:4};const int sign=player==0?1:-1;
    std::vector<CastlingPlan> plans;
    for(const Hex direction:{Hex{-sign,sign},Hex{sign,0}})for(const int length:{2,3})
        plans.push_back({home,add(home,direction,length),add(home,direction,4),add(home,direction,length-1)});
    return plans;
}
static std::optional<CastlingPlan> castleDetails(const GameState& state,const Move& move) {
    const auto piece=occupant(state,move.from);
    if(piece.type!=PieceType::King)return {};
    for(const auto plan:castlePlans(variantDefinition(state.variant),piece.player))
        if(move.from==plan.kingFrom&&move.to==plan.kingTo)return plan;
    return {};
}
static void addCastles(const GameState& state,std::vector<Move>& moves,Hex from) {
    const auto& variant=variantDefinition(state.variant);
    if(!variant.castling||occupant(state,from).hasMoved||isInCheck(state,state.activePlayer))return;
    for(const auto plan:castlePlans(variant,state.activePlayer)) {
        if(from!=plan.kingFrom)continue;
        const auto rook=occupant(state,plan.rookFrom);
        if(rook.type!=PieceType::Rook||rook.player!=state.activePlayer||rook.hasMoved)continue;
        const int rookDistance=distance(from,plan.rookFrom),kingDistance=distance(from,plan.kingTo);
        const Hex direction{(plan.rookFrom.q-from.q)/rookDistance,(plan.rookFrom.r-from.r)/rookDistance};
        bool clear=true;
        for(int step=1;step<rookDistance;++step){const auto cell=add(from,direction,step);if(variant.index(cell)<0||!occupant(state,cell).empty()){clear=false;break;}}
        if(!clear)continue;
        bool safe=true;
        for(int step=1;step<=kingDistance;++step){
            GameState probe=state;const int to=variant.index(add(from,direction,step));
            if(to<0){safe=false;break;}
            probe.occupants[variant.index(from)]={};probe.occupants[to]=occupant(state,from);
            if(isInCheck(probe,state.activePlayer)){safe=false;break;}
        }
        if(safe)moves.push_back({from,plan.kingTo});
    }
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
    if (variantDefinition(state.variant).index(to) < 0) return;
    const auto& target = occupant(state, to);
    if (!target.empty() && (target.player == state.activePlayer || target.type == PieceType::King)) return;
    const auto& source = occupant(state, from);
    if (source.type == PieceType::Pawn && promotes(variantDefinition(state.variant),to,source.player)) {
        for (const auto promotion : {PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight}) moves.push_back({from, to, promotion});
    } else moves.push_back({from, to});
}

template <std::size_t N>
static void rays(const GameState& state, std::vector<Move>& moves, Hex from, const std::array<Hex, N>& directions, int limit = 11) {
    for (const auto direction : directions) {
        for (int distance = 1; distance <= limit; ++distance) {
            const Hex to = add(from, direction, distance);
            if (variantDefinition(state.variant).index(to) < 0) break;
            addMove(state, moves, from, to);
            if (!occupant(state, to).empty()) break;
        }
    }
}

std::vector<Move> generateCandidateMoves(const GameState& state) {
    std::vector<Move> moves;
    moves.reserve(150);
    const auto& cells = variantDefinition(state.variant).cells();
    static const auto knights = knightDirections();
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (piece.empty() || piece.player != state.activePlayer) continue;
        const Hex from = cells[index];
        switch (piece.type) {
            case PieceType::Rook: rays(state, moves, from, edge); break;
            case PieceType::Bishop: rays(state, moves, from, vertex); break;
            case PieceType::Queen: rays(state, moves, from, edge); rays(state, moves, from, vertex); break;
            case PieceType::King: rays(state, moves, from, edge, 1); rays(state, moves, from, vertex, 1); addCastles(state,moves,from); break;
            case PieceType::Knight: for (const auto direction : knights) addMove(state, moves, from, add(from, direction)); break;
            case PieceType::Pawn: {
                const auto& variant = variantDefinition(state.variant);
                const int distance = variant.pawnDoubleRequiresUnmoved && piece.hasMoved ? 1 : pawnAdvance(variant,from,piece.player);
                const auto forwards=pawnForwards(variant,piece.player);
                const bool blocked=variant.enemyBlocksBothPawnAdvances&&std::any_of(forwards.begin(),forwards.end(),[&](Hex dir){const auto p=occupant(state,add(from,dir));return !p.empty()&&p.player!=piece.player;});
                if(!blocked)for(const auto direction:forwards)for(int step=1;step<=distance;++step){
                    const auto to=add(from,direction,step);
                    if(variant.index(to)<0||!occupant(state,to).empty())break;
                    addMove(state,moves,from,to);
                }
                const auto captures=pawnCaptures(state,from,piece);
                for (const auto direction : captures) {
                    const Hex to = add(from, direction);
                    const int toIndex = variantDefinition(state.variant).index(to);
                    if (toIndex < 0) continue;
                    const auto target = occupant(state, to);
                    if ((!target.empty() && target.player != piece.player) ||
                        (enPassantTarget(state,toIndex) && target.empty() && state.enPassantPawn >= 0 &&
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
            if (variantDefinition(state.variant).index(to) < 0) break;
            if (to == target) return true;
            if (!occupant(state, to).empty()) break;
        }
    }
    return false;
}

bool isAttacked(const GameState& state, Hex position, PlayerId attacker) {
    const auto& cells = variantDefinition(state.variant).cells();
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
                for (const auto direction : pawnCaptures(state,from,piece))
                    if (add(from, direction) == position) return true;
                break;
            default: break;
        }
    }
    return false;
}

bool isInCheck(const GameState& state, PlayerId player) {
    const auto& cells = variantDefinition(state.variant).cells();
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
    const int from = variantDefinition(state.variant).index(move.from), to = variantDefinition(state.variant).index(move.to);
    const auto piece = state.occupants[from];
    bool capture = !state.occupants[to].empty();
    if (isEnPassantCapture(state,move)) {
        next.occupants[state.enPassantPawn] = {};
        capture = true;
    }
    next.occupants[from] = {};
    next.occupants[to] = piece;
    next.occupants[to].hasMoved = true;
    if (const auto castle = castleDetails(state,move)) {
        const int rookFrom = variantDefinition(state.variant).index(castle->rookFrom);
        const int rookTo = variantDefinition(state.variant).index(castle->rookTo);
        next.occupants[rookTo] = state.occupants[rookFrom];
        next.occupants[rookTo].hasMoved = true;
        next.occupants[rookFrom] = {};
    }
    if (move.promotion != PieceType::None) next.occupants[to].type = move.promotion;
    next.enPassantTarget = next.enPassantPawn = -1;
    next.additionalEnPassantTargets.clear();
    if(piece.type==PieceType::Pawn)for(const auto direction:pawnForwards(variantDefinition(state.variant),piece.player)) {
        const int steps=distance(move.from,move.to);
        if(steps<2||move.to!=add(move.from,direction,steps))continue;
        next.enPassantTarget=variantDefinition(state.variant).index(add(move.from,direction));
        for(int step=2;step<steps;++step)next.additionalEnPassantTargets.push_back(variantDefinition(state.variant).index(add(move.from,direction,step)));
        next.enPassantPawn=to;break;
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
    // Preserve existing Gliński hashes so saved games remain loadable.
    // Other variants get their own repetition domain and effective pawn rights.
    const auto& variant = variantDefinition(state.variant);
    if (state.variant != "glinski") for (const unsigned char c : state.variant) mix(c);
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        const bool doubleRight = variant.pawnDoubleRequiresUnmoved && piece.type == PieceType::Pawn &&
            !piece.hasMoved && variant.pawnDoubleCell(variant.cells()[index], piece.player);
        mix(piece.empty() ? 0 : static_cast<int>(piece.type) + 8 * piece.player + (doubleRight ? 16 : 0));
    }
    mix(state.activePlayer);
    if (variant.castling) {
        unsigned rights = 0;
        for(PlayerId player=0;player<=1;++player){
            std::vector<Hex> rooks;
            for(const auto plan:castlePlans(variant,player)){
                if(std::find(rooks.begin(),rooks.end(),plan.rookFrom)!=rooks.end())continue;
                const int flank=static_cast<int>(rooks.size());rooks.push_back(plan.rookFrom);
                const auto king=occupant(state,plan.kingFrom),rook=occupant(state,plan.rookFrom);
                if(king.type==PieceType::King&&king.player==player&&!king.hasMoved&&rook.type==PieceType::Rook&&rook.player==player&&!rook.hasMoved)
                    rights|=1U<<(player*2+flank);
            }
        }
        mix(rights);
    }
    // An en-passant right changes repetition only when a legal capture exists.
    if (state.enPassantTarget >= 0 && state.enPassantPawn >= 0) {
        std::vector<int> targets{state.enPassantTarget};
        targets.insert(targets.end(),state.additionalEnPassantTargets.begin(),state.additionalEnPassantTargets.end());
        const auto moves = generateCandidateMoves(state);
        for (const int target : targets) for (const auto& move : moves) {
            if (variant.index(move.to) == target && isEnPassantCapture(state,move) &&
                !isInCheck(applyCandidateMove(state,move,false),state.activePlayer)) {
                mix(static_cast<std::uint64_t>(target)+1);
                break;
            }
        }
    }
    return hash;
}

void validatePosition(const GameState& state) {
    const auto& variant = variantDefinition(state.variant);
    if (state.occupants.size() != variant.cells().size() ||
        state.turnOrder != std::vector<PlayerId>{0,1} || state.activePlayer > 1 ||
        state.halfmoveClock < 0 || state.halfmoveClock > 10000 || state.ply < 0 || state.ply > 100000 ||
        state.positionHistory.size() > 2048) throw std::invalid_argument("Invalid game state");
    int kings[2]{0,0};
    for (std::size_t index = 0; index < state.occupants.size(); ++index) {
        const auto piece = state.occupants[index];
        if (static_cast<int>(piece.type) > 6 || (!piece.empty() && piece.player > 1)) throw std::invalid_argument("Invalid piece");
        if (piece.type == PieceType::King) ++kings[piece.player];
        if (piece.type == PieceType::Pawn && promotes(variant,variant.cells()[index],piece.player)) throw std::invalid_argument("Unpromoted pawn on last cell");
    }
    if (kings[0] != 1 || kings[1] != 1) throw std::invalid_argument("Each player must have exactly one king");
    if (isInCheck(state, static_cast<PlayerId>(1 - state.activePlayer))) throw std::invalid_argument("Previous player left its king in check");
    if ((state.enPassantTarget == -1) != (state.enPassantPawn == -1) || state.enPassantTarget < -1 ||
        state.enPassantPawn < -1 || state.enPassantTarget >= static_cast<int>(variant.cells().size()) || state.enPassantPawn >= static_cast<int>(variant.cells().size())) throw std::invalid_argument("Invalid en-passant rights");
    if (state.additionalEnPassantTargets.size() > 1 ||
        (!state.additionalEnPassantTargets.empty() && (state.variant != "shafran" || state.enPassantTarget < 0)))
        throw std::invalid_argument("Invalid additional en-passant rights");
    if (state.enPassantTarget >= 0) {
        const auto pawn = state.occupants[state.enPassantPawn];
        const auto target = variantDefinition(state.variant).cells()[state.enPassantTarget];
        const auto end = variantDefinition(state.variant).cells()[state.enPassantPawn];
        bool consistent=false;
        if(pawn.type==PieceType::Pawn&&pawn.player!=state.activePlayer&&state.occupants[state.enPassantTarget].empty()&&(!variant.pawnDoubleRequiresUnmoved||pawn.hasMoved))
        for(const auto direction:pawnForwards(variant,pawn.player))for(int steps=2;steps<=3;++steps){
            const Hex start=add(end,direction,-steps);
            if(add(start,direction)!=target||variant.index(start)<0||!occupant(state,start).empty()||steps>pawnAdvance(variant,start,pawn.player))continue;
            const std::vector<int> expectedExtra=steps==3?std::vector<int>{variant.index(add(target,direction))}:std::vector<int>{};
            if(state.additionalEnPassantTargets==expectedExtra)consistent=true;
        }
        if(!consistent)throw std::invalid_argument("Inconsistent en-passant rights");
        for (const int extra : state.additionalEnPassantTargets)
            if (extra < 0 || extra >= static_cast<int>(variant.cells().size()) || !state.occupants[extra].empty())
                throw std::invalid_argument("Inconsistent additional en-passant rights");
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
        if (variantDefinition(state.variant).fractionalStalemate) {
            result.winner = static_cast<int>(1 - state.activePlayer);
            result.scores[result.winner] = 0.75;
            result.scores[state.activePlayer] = 0.25;
        }
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
