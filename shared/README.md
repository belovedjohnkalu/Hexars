# Shared C++ rules

Implemented: axial coordinates, explicit valid cell sets, edge/vertex neighbours, three cell colours, Gliński conventional notation, historical 36-piece setup, pieces, moves, game-state serialization, attack detection, legal moves, move application and results.

Public headers are in `include/hexchess`; `src/glinski_rules.cpp` contains the first authoritative rules module and `variants/glinski.cpp` defines the setup. Every proposed move passes through the same checked `applyMove` API. Search calls this library rather than maintaining a separate legality model.

`PlayerId` and `turnOrder` allow broader future state models. Only the two-player Gliński module is currently implemented. Future irregular geometries and three-player rules need their own verified modules.

See `../docs/variants/glinski.md` for rule conventions and tests. The library intentionally does not label lone-bishop/lone-knight endings as ordinary-chess automatic draws: mating constructions can exist on the hexagonal board.
