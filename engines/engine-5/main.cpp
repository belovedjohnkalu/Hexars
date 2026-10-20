#include "../engine-1/protocol.hpp"
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::optional<hexchess::GameState> state;
    while (std::getline(std::cin, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        if (line == "quit") break;
        if (line == "ping") { std::cout << "pong" << std::endl; continue; }
        if (line == "id") { std::cout << "id Unconventional 1.0.0" << std::endl; continue; }
        hexchess::engine_one::Json request;
        try {
            if (line.size() > 131072) throw std::invalid_argument("Engine request too large");
            request = hexchess::engine_one::Json::parse(line);
            std::cout << hexchess::engine_one::processRequest(request, state).dump() << std::endl;
        } catch (const std::exception& error) {
            auto response = hexchess::engine_one::Json{{"protocolVersion", 1}, {"type", "error"}, {"message", error.what()}};
            if (request.is_object() && request.contains("requestId")) response["requestId"] = request["requestId"];
            std::cout << response.dump() << std::endl;
        }
    }
}
