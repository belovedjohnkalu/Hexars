# Shared C++ rules

Implemented: axial coordinates, explicit valid cell sets, edge/vertex neighbours, three cell colours, Gliński conventional notation, historical 36-piece setup, pieces, moves, game-state serialization, attack detection, legal moves, move application and results.

Public headers are in `include/hexchess`; `src/glinski_rules.cpp` contains the first authoritative rules module and `variants/glinski.cpp` defines the setup. Every proposed move passes through the same checked `applyMove` API. Search calls this library rather than maintaining a separate legality model.

`PlayerId` and `turnOrder` allow broader future state models. Only the two-player Gliński module is currently implemented. Future irregular geometries and three-player rules need their own verified modules.

See `../docs/variants/glinski.md` for rule conventions and tests. Mating constructions can exist with a lone minor on the hexagonal board. The new `LowMaterialDraw` result deliberately identifies HEXARS’s requested early-draw house rule, rather than describing those positions as historically insufficient material. It scores ½–½ and applies when each side has only a king plus at most one bishop, knight or rook; pawns, queens and a second non-king piece exclude it.
