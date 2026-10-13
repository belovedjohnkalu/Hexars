#include "hexchess/geometry.hpp"
#include "protocol.hpp"

#include <iostream>
#include <string>

static void printBoard() {
    const auto cells = hexchess::generateRegularHexBoard(5);
    std::cout << "{\"variant\":\"glinski\",\"stage\":\"geometry\",\"players\":[0,1],\"cells\":[";
    bool first = true;
    for (const auto cell : cells) {
        if (!first) std::cout << ',';
        first = false;
        std::cout << "{\"q\":" << cell.q << ",\"r\":" << cell.r
                  << ",\"colour\":" << hexchess::cellColour(cell) << '}';
    }
    std::cout << "]}" << std::endl;
}

int main() {
    std::string command;
    std::optional<hexchess::GameState> state;
    // Foundation protocol: one command and one flushed response per line.
    // stdout is protocol-only; diagnostics belong on stderr.
    while (std::getline(std::cin, command)) {
        if (!command.empty() && command.back() == '\r') command.pop_back();
        if (command == "ping") std::cout << "pong" << std::endl;
        else if (command == "id") std::cout << "id Tactical 0.4" << std::endl;
        else if (command == "board") printBoard();
        else if (command == "quit") break;
        else if (!command.empty() && command.front() == '{') {
            hexchess::engine_one::Json request;
            try {
                if(command.size()>131072) throw std::invalid_argument("Engine request too large");
                request=hexchess::engine_one::Json::parse(command);
                std::cout << hexchess::engine_one::processRequest(request,state).dump() << std::endl;
            } catch(const std::exception& error) {
                auto response=hexchess::engine_one::Json{{"protocolVersion",1},{"type","error"},{"message",error.what()}};
                if(request.is_object()&&request.contains("requestId")) response["requestId"]=request["requestId"];
                std::cout << response.dump() << std::endl;
            }
        } else std::cout << "error unknown_command" << std::endl;
    }
    return 0;
}
