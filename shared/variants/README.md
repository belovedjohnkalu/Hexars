# Variant modules

`glinski.cpp`, `mccooey.cpp` and `shafran.cpp` own their historical boards, notation and starting positions. Movement, legality and results live in the shared `hex_rules.cpp` implementation, with variant-specific pawn advances, captures, castling and stalemate policies.

Brusky, De Vasa and Wellisch remain reserved. Add them with independent historical references and tests. A shape or initial diagram alone does not constitute a playable variant.
