#include "protocol.hpp"
#include "search.hpp"
#include "hexchess/wellisch.hpp"
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
    if(move.pass) result["pass"]=true;
    return result;
}
static Move decodeMove(const Json& value, const VariantId& variant) {
    Move move{{value.at("from").at("q").get<int>(),value.at("from").at("r").get<int>()},
              {value.at("to").at("q").get<int>(),value.at("to").at("r").get<int>()}};
    if(value.contains("promotion")) move.promotion=pieceType(value.at("promotion").get<std::string>());
    move.pass=value.value("pass",false);
    if(move.pass&&variant!="wellisch")throw std::invalid_argument("Passing is not allowed in this variant");
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
    Json value{{"variant",state.variant},{"occupants",pieces},{"activePlayer",state.activePlayer},{"turnOrder",state.turnOrder},
            {"enPassantTarget",state.enPassantTarget},{"enPassantPawn",state.enPassantPawn},{"halfmoveClock",state.halfmoveClock},
            {"ply",state.ply},{"positionHistory",history}};
    if (state.variant == "shafran") value["additionalEnPassantTargets"] = state.additionalEnPassantTargets;
    if(state.wellisch){const auto& w=*state.wellisch;Json reserves=Json::array();for(const auto& reserve:w.reserves){Json pieces=Json::array();for(auto t:reserve)pieces.push_back(names[static_cast<int>(t)]);reserves.push_back(pieces);}value["wellisch"]={{"origins",w.origins},{"controllers",w.controllers},{"reserves",reserves},{"consecutivePasses",w.consecutivePasses}};}
    return value;
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
            if(player<0||player>(state.variant=="wellisch"?2:1)) throw std::invalid_argument("Invalid player identifier");
            const auto type = pieceType(piece.at("type").get<std::string>());
            if (state.variant == "mccooey" && type == PieceType::Pawn && !piece.contains("hasMoved"))
                throw std::invalid_argument("Missing McCooey pawn movement rights");
            if ((state.variant == "shafran" || state.variant == "brusky" || state.variant == "devasa" || state.variant == "wellisch") && (type == PieceType::Pawn || type == PieceType::King || type == PieceType::Rook) && !piece.contains("hasMoved"))
                throw std::invalid_argument("Missing variant movement rights");
            state.occupants.push_back({type,static_cast<PlayerId>(player),piece.value("hasMoved",false)});
        }
    }
    const int active=value.at("activePlayer").get<int>();
    if(active<0||active>(state.variant=="wellisch"?2:1)) throw std::invalid_argument("Invalid active player");
    state.activePlayer=static_cast<PlayerId>(active);
    if(value.at("turnOrder")!=(state.variant=="wellisch"?Json::array({0,1,2}):Json::array({0,1}))) throw std::invalid_argument("Invalid turn order");
    if(state.variant=="wellisch"){
        state.turnOrder={0,1,2};state.wellisch.emplace();auto& w=*state.wellisch;const auto& rights=value.at("wellisch");
        const auto origins=rights.at("origins").get<std::vector<int>>();if(origins.size()!=91)throw std::invalid_argument("Invalid army origins");
        for(int p:origins){if(p!=255&&(p<0||p>2))throw std::invalid_argument("Invalid army origin");w.origins.push_back(static_cast<PlayerId>(p));}
        const auto controllers=rights.at("controllers").get<std::vector<int>>();if(controllers.size()!=3)throw std::invalid_argument("Invalid army controllers");
        for(int p=0;p<3;++p){if(controllers[p]<0||controllers[p]>2)throw std::invalid_argument("Invalid army controller");w.controllers[p]=static_cast<PlayerId>(controllers[p]);}
        const auto& reserves=rights.at("reserves");if(!reserves.is_array()||reserves.size()!=3)throw std::invalid_argument("Invalid promotion reserves");
        for(int p=0;p<3;++p){if(!reserves[p].is_array()||reserves[p].size()>6)throw std::invalid_argument("Invalid promotion reserve");for(const auto& t:reserves[p])w.reserves[p].push_back(pieceType(t.get<std::string>()));}
        w.consecutivePasses=rights.at("consecutivePasses").get<int>();
    }else if(value.contains("wellisch"))throw std::invalid_argument("Unexpected multiplayer rights");
    state.enPassantTarget=value.at("enPassantTarget").get<int>();
    state.enPassantPawn=value.at("enPassantPawn").get<int>();
    if (state.variant == "shafran") state.additionalEnPassantTargets = value.at("additionalEnPassantTargets").get<std::vector<int>>();
    else if (value.contains("additionalEnPassantTargets") && value.at("additionalEnPassantTargets") != Json::array())
        throw std::invalid_argument("Unexpected en-passant targets");
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
        if(!piece.empty()&&state.wellisch)value["piece"]["armyOrigin"]=state.wellisch->origins[i];
        cells.push_back(value);
    }
    Json moves=Json::array();
    if(result.type==ResultType::Ongoing) for(const auto& move:legal) {
        auto encoded=encodeMove(move,state.variant);
        const auto to=variantDefinition(state.variant).index(move.to);
        encoded["capture"]=(!move.pass&&move.from!=move.to&&!state.occupants[to].empty()&&state.occupants[to].player!=state.activePlayer) || isEnPassantCapture(state,move);
        // These moves already passed shared legal-move validation. The fast
        // internal application describes checking destinations and visual changes.
        const auto next=applyCandidateMove(state,move,false);
        encoded["givesCheck"]=false;for(auto p:next.turnOrder)if(p!=state.activePlayer&&isInCheck(next,p))encoded["givesCheck"]=true;
        Json changes=Json::array();
        const auto& board=variantDefinition(state.variant).cells();
        for (std::size_t index=0;index<board.size();++index) {
            const auto before=state.occupants[index], after=next.occupants[index];
            if (before.type==after.type && (after.empty() || before.player==after.player)) continue;
            Json piece=nullptr;
            if (!after.empty()) piece={{"type",names[static_cast<int>(after.type)]},{"player",after.player}};
            if(!after.empty()&&next.wellisch)piece["armyOrigin"]=next.wellisch->origins[index];
            changes.push_back({{"q",board[index].q},{"r",board[index].r},{"piece",piece}});
        }
        encoded["changes"]=std::move(changes);
        moves.push_back(std::move(encoded));
    }
    std::string status="ongoing",reason="";
    switch(result.type) {
        case ResultType::Checkmate: status="checkmate";reason="Checkmate";break;
        case ResultType::Conquest: status="checkmate";reason="Last king standing";break;
        case ResultType::Stalemate: status="stalemate";reason=result.winner < 0 ? "Stalemate: ½–½ scoring" : "Stalemate: ¾–¼ scoring";break;
        case ResultType::Repetition: status="draw";reason="Threefold repetition";break;
        case ResultType::FiftyMove: status="draw";reason="Fifty-move rule";break;
        case ResultType::InsufficientMaterial: status="draw";reason="Insufficient material";break;
        case ResultType::LowMaterialDraw: status="draw";reason="Low-material house rule";break;
        default: break;
    }
    if(state.variant=="wellisch"&&result.type==ResultType::Stalemate)reason="Stalemate";
    if(state.variant=="wellisch"&&result.type==ResultType::FiftyMove)reason="Fifty rounds without a pawn move or capture";
    Json scores=Json::array();for(std::size_t i=0;i<state.turnOrder.size();++i)scores.push_back(result.scores[i]);
    Json described={{"stateId",stateId(state)},{"variant",state.variant},{"activePlayer",state.activePlayer},{"ply",state.ply},
            {"check",isInCheck(state,state.activePlayer)},{"board",{{"variant",state.variant},{"stage","game"},{"orientation",variantDefinition(state.variant).pointyBoard?"pointy":"flat"},{"players",state.turnOrder},{"cells",cells}}},
            {"legalMoves",moves},{"result",{{"status",status},{"reason",reason},{"winner",result.winner},{"scores",scores}}}};
    if(state.wellisch){Json active=Json::array(),checked=Json::array();for(PlayerId p=0;p<3;++p)if(state.wellisch->controllers[p]==p){active.push_back(p);if(isInCheck(state,p))checked.push_back(p);}described["activePlayers"]=active;described["checkedPlayers"]=checked;described["armyControllers"]=state.wellisch->controllers;}
    return described;
}

Json processRequest(const Json& request, std::optional<GameState>& state) {
    if(!request.is_object()||request.value("protocolVersion",0)!=1||!request.contains("type")||!request.at("type").is_string()) throw std::invalid_argument("Invalid protocol request");
    const auto type=request.at("type").get<std::string>();
    Json response{{"protocolVersion",1},{"requestId",request.value("requestId",std::string{})}};
    if(type=="hello") { response.update({{"type","hello"},{"engine","Tactical 0.9.0"},{"capabilities",Json::array({"glinski","mccooey","shafran","brusky","devasa","wellisch","legal_moves","search","maxn"})}});return response; }
    if(type=="supported_variants") {response.update({{"type","supported_variants"},{"variants",Json::array({"glinski","mccooey","shafran","brusky","devasa","wellisch"})}});return response;}
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
