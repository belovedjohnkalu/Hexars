# Positional — first implementation

A separate executable with a structure-and-coordination evaluation and bounded
strategic beam search. It rewards connected pawn chains, piece coordination,
central activity and king cover. Branches are ranked strategically and narrowed
at each level; Wellisch uses separate player utilities. This is independent of
Tactical's alpha-beta and quiescence implementation. Protocol serialization and
the result ABI are reused; legal moves and game results come from shared rules.

Build with `node scripts/build-positional.mjs`, or add `--cloud` for the fully
static Linux executable required by Floot. CMake target: `engine-two`.
Verify with `node --test tests/engine/positional.test.mjs`.

This is version 0.1.0. Strength and a distinctive playing style need more arena
testing; it should not be treated as an established strength benchmark.
