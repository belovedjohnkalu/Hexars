# Shared C++ rules

Implemented: axial coordinates, explicit valid cell sets, edge/vertex neighbours, three cell colours, Gliński conventional notation, historical 36-piece Gliński, 32-piece McCooey and 36-piece Shafran setups, pieces, moves, game-state serialization, attack detection, legal moves, move application and results.

Public headers are in `include/hexchess`; `src/hex_rules.cpp` contains common authoritative move validation; `variant.hpp` and `variants/variant.cpp` define board/pawn/result policies, and each implemented variant owns its starting setup. Every proposed move passes through the same checked `applyMove` API. Search calls this library rather than maintaining a separate legality model.

All six variants are implemented, including Brusky's 84 cells, De Vasa's 81 cells and Wellisch's three-player 91-cell board. Wellisch dispatches to `src/wellisch_rules.cpp`: original armies, takeover controllers, captured-piece reserves, delayed promotion, forced passes, final two-player results, and three-player state validation/hashing. These rules share the public API without inheriting ordinary hexagonal piece movement or two-player assumptions.

See `../docs/variants/glinski.md` `../docs/variants/mccooey.md` and `../docs/variants/shafran.md` for rule conventions and independent tests. Mating constructions can exist with a lone minor on the hexagonal board. The new `LowMaterialDraw` result deliberately identifies HEXARS’s requested early-draw house rule, rather than describing those positions as historically insufficient material. It scores ½–½ and applies when each side has only a king plus at most one bishop, knight or rook; pawns, queens and a second non-king piece exclude it.
