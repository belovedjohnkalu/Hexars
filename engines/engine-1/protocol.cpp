#include "protocol.hpp"
#include "search.hpp"
#include <algorithm>
#include <iomanip>
#include <sstream>
#include <stdexcept>

namespace hexchess::engine_one {
static const char* names[]{"none","pawn","knight","bishop","rook","queen","king"};
static std::string keyString(std::uint64_t key) {
    std::ostringstream stream; stream << std::hex << std::setw(16) << std::setfill('0') << key; return stream.str();
}
static std::string stateId(const GameState& state) { return keyString(positionKey(state))+"-"+std::to_string(state.ply); }
static PieceType pieceType(const std::string& name) {
    for (int i=0;i<=6;++i) if(name==names[i]) return static_cast<PieceType>(i);
    throw std::invalid_argument("Unknown piece type");
}
static Json encodeMove(const Move& move, const VariantId& variant) {
    Json result{{"from",{{"q",move.from.q},{"r",move.from.r}}},{"to",{{"q",move.to.q},{"r",move.to.r}}},
                {"fromNotation",variantDefinition(variant).notation(move.from)},{"toNotation",variantDefinition(variant).notation(move.to)}};
    if(move.promotion!=PieceType::None) result["promotion"]=names[static_cast<int>(move.promotion)];
    return result;
}
static Move decodeMove(const Json& value, const VariantId& variant) {
    Move move{{value.at("from").at("q").get<int>(),value.at("from").at("r").get<int>()},
              {value.at("to").at("q").get<int>(),value.at("to").at("r").get<int>()}};
    if(value.contains("promotion")) move.promotion=pieceType(value.at("promotion").get<std::string>());
    if(variantDefinition(variant).index(move.from)<0||variantDefinition(variant).index(move.to)<0) throw std::invalid_argument("Move outside board");
    return move;
}

Json encodeState(const GameState& state) {
    Json pieces=Json::array();
    for(const auto piece:state.occupants) {
        if(piece.empty()) pieces.push_back(nullptr);
        else pieces.push_back({{"type",names[static_cast<int>(piece.type)]},{"player",piece.player},{"hasMoved",piece.hasMoved}});
    }
    Json history=Json::array(); for(const auto key:state.positionHistory) history.push_back(keyString(key));
    return {{"variant",state.variant},{"occupants",pieces},{"activePlayer",state.activePlayer},{"turnOrder",state.turnOrder},
            {"enPassantTarget",state.enPassantTarget},{"enPassantPawn",state.enPassantPawn},{"halfmoveClock",state.halfmoveClock},
            {"ply",state.ply},{"positionHistory",history}};
}

GameState decodeState(const Json& value) {
    GameState state;
    state.variant=value.at("variant").get<std::string>();
    const auto& occupants=value.at("occupants");
    if(!occupants.is_array()||occupants.size()!=variantDefinition(state.variant).cells().size()) throw std::invalid_argument("Invalid occupant list");
    for(const auto& piece:occupants) {
        if(piece.is_null()) state.occupants.push_back({});
        else {
            const int player=piece.at("player").get<int>();
            if(player<0||player>1) throw std::invalid_argument("Invalid player identifier");
            const auto type = pieceType(piece.at("type").get<std::string>());
            if (state.variant == "mccooey" && type == PieceType::Pawn && !piece.contains("hasMoved"))
                throw std::invalid_argument("Missing McCooey pawn movement rights");
            state.occupants.push_back({type,static_cast<PlayerId>(player),piece.value("hasMoved",false)});
        }
    }
    const int active=value.at("activePlayer").get<int>();
    if(active<0||active>1) throw std::invalid_argument("Invalid active player");
    state.activePlayer=static_cast<PlayerId>(active);
    if(value.at("turnOrder")!=Json::array({0,1})) throw std::invalid_argument("Invalid turn order");
    state.enPassantTarget=value.at("enPassantTarget").get<int>();
    state.enPassantPawn=value.at("enPassantPawn").get<int>();
    state.halfmoveClock=value.at("halfmoveClock").get<int>();
    state.ply=value.at("ply").get<int>();
    const auto& history=value.at("positionHistory");
    if(!history.is_array()||history.size()>2048) throw std::invalid_argument("Invalid position history");
    for(const auto& encoded:history) {
        const auto string=encoded.get<std::string>();
        if(string.size()!=16||!std::all_of(string.begin(),string.end(),[](char c){return (c>='0'&&c<='9')||(c>='a'&&c<='f');})) throw std::invalid_argument("Invalid history key");
        state.positionHistory.push_back(std::stoull(string,nullptr,16));
    }
    validatePosition(state);
    if(state.positionHistory.empty()) state.positionHistory.push_back(positionKey(state));
    return state;
}

Json describeGame(const GameState& state) {
    const auto legal=generateLegalMoves(state);
    const auto result=getGameResult(state,legal);
    Json cells=Json::array();
    for(std::size_t i=0;i<variantDefinition(state.variant).cells().size();++i) {
        const auto cell=variantDefinition(state.variant).cells()[i]; const auto piece=state.occupants[i];
        Json value{{"q",cell.q},{"r",cell.r},{"colour",cellColour(cell)},{"notation",variantDefinition(state.variant).notation(cell)},{"piece",nullptr}};
        if(!piece.empty()) value["piece"]={{"type",names[static_cast<int>(piece.type)]},{"player",piece.player}};
        cells.push_back(value);
    }
    Json moves=Json::array();
    if(result.type==ResultType::Ongoing) for(const auto& move:legal) {
        auto encoded=encodeMove(move,state.variant);
        const auto from=variantDefinition(state.variant).index(move.from), to=variantDefinition(state.variant).index(move.to);
        const auto moving=state.occupants[from];
        encoded["capture"]=!state.occupants[to].empty() ||
            (moving.type==PieceType::Pawn && to==state.enPassantTarget && move.from.q!=move.to.q);
        // These moves already passed shared legal-move validation. The fast
        // internal application is used only to describe checking destinations.
        const auto next=applyCandidateMove(state,move,false);
        encoded["givesCheck"]=isInCheck(next,next.activePlayer);
        moves.push_back(std::move(encoded));
    }
    std::string status="ongoing",reason="";
    switch(result.type) {
        case ResultType::Checkmate: status="checkmate";reason="Checkmate";break;
        case ResultType::Stalemate: status="stalemate";reason=result.winner < 0 ? "Stalemate: ½–½ scoring" : "Stalemate: ¾–¼ scoring";break;
        case ResultType::Repetition: status="draw";reason="Threefold repetition";break;
        case ResultType::FiftyMove: status="draw";reason="Fifty-move rule";break;
        case ResultType::InsufficientMaterial: status="draw";reason="Insufficient material";break;
        case ResultType::LowMaterialDraw: status="draw";reason="Low-material house rule";break;
        default: break;
    }
    return {{"stateId",stateId(state)},{"variant",state.variant},{"activePlayer",state.activePlayer},{"ply",state.ply},
            {"check",isInCheck(state,state.activePlayer)},{"board",{{"variant",state.variant},{"stage","game"},{"players",state.turnOrder},{"cells",cells}}},
            {"legalMoves",moves},{"result",{{"status",status},{"reason",reason},{"winner",result.winner},{"scores",Json::array({result.scores[0],result.scores[1]})}}}};
}

Json processRequest(const Json& request, std::optional<GameState>& state) {
    if(!request.is_object()||request.value("protocolVersion",0)!=1||!request.contains("type")||!request.at("type").is_string()) throw std::invalid_argument("Invalid protocol request");
    const auto type=request.at("type").get<std::string>();
    Json response{{"protocolVersion",1},{"requestId",request.value("requestId",std::string{})}};
    if(type=="hello") { response.update({{"type","hello"},{"engine","Tactical 0.6"},{"capabilities",Json::array({"glinski","mccooey","legal_moves","search"})}});return response; }
    if(type=="supported_variants") {response.update({{"type","supported_variants"},{"variants",Json::array({"glinski","mccooey"})}});return response;}
    if(type=="new_game") {
        state=createGame(request.value("variant",std::string{"glinski"}));
    } else if(type=="position") {
        state=decodeState(request.at("state"));
    } else {
        if(!state) throw std::invalid_argument("Load a position first");
        if(request.value("stateId",std::string{})!=stateId(*state)) throw std::invalid_argument("Stale state ID");
        if(type=="play_move") state=applyMove(*state,decodeMove(request.at("move"),state->variant));
        else if(type=="go") {
            const auto limits=request.value("limits",Json::object());
            const auto result=search(*state,{limits.value("timeMs",750),limits.value("depth",3),limits.value("nodeLimit",30000)});
            response.update({{"type","bestmove"},{"stateId",stateId(*state)},{"move",result.move?encodeMove(*result.move,state->variant):Json(nullptr)},
                {"evaluation",{{"score",result.score/100.0}}},{"diagnostics",{{"nodes",result.nodes},{"depth",result.depth},{"timeMs",result.timeMs}}}});
            return response;
        } else if(type!="legal_moves") throw std::invalid_argument("Unsupported engine command");
    }
    response.update({{"type","game"},{"state",encodeState(*state)},{"game",describeGame(*state)}});
    return response;
}
}
