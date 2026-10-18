# Variant modules

`glinski.cpp`, `mccooey.cpp` and `shafran.cpp` own their historical boards, notation and starting positions. Movement, legality and results live in the shared `hex_rules.cpp` implementation, with variant-specific pawn advances, captures, castling and stalemate policies.

`brusky.cpp` and `devasa.cpp` supply their pointy boards and distinct pawn/castling policies. `wellisch.cpp` supplies the three-player setup and geometry; `src/wellisch_rules.cpp` owns its distinct movement, king capture/takeover, reserves, promotion, legal moves and final results. Independent references, policy distinctions and tests are documented under `docs/variants`.
