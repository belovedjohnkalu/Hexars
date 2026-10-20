# Universal 1.0.0

The sixth independent C++ executable adapts its evaluation to the position. Material remaining on the board determines how much it values pawn cover and king safety versus active kings and advancing pawns. Exposed pieces and coordination contribute at every phase.

Two-player search uses iterative principal variation search (PVS): full-window searches establish a principal line, narrow windows test subsequent alternatives, and improvements are re-searched. A bounded forcing horizon considers captures and promotions. Checked positions, forced passes and mandatory same-cell promotions cannot use stand-pat; same-player promotion actions retain the correct actor. Root moves remain fully eligible.

Three-player Wellisch uses individual utility vectors with selective MaxN. Each actor chooses for itself. Captures, promotions, passes and checked positions remain eligible; quiet interior breadth is limited to `12 + 4 × depth`. This is a selective search, not a claim of exhaustive multiplayer optimality. Army takeover, original pawn directions, eliminated players, draws and fractional scores come from the shared authoritative rules.

Universal shares only rules, the versioned protocol and the search ABI with the other executables. Its search and evaluation source lives in `engines/engine-6/search.cpp`. Runtime cancellation terminates its isolated process; it does not claim asynchronous in-band stop support. Deadlines and node limits return a legal fallback when no full iteration finishes. Difficulty labels are budgets, not calibrated Elo ratings.

Build with `npm run build:universal`; test using `npm run test:universal` and the CMake `universal-search` target. The cloud binary uses `node scripts/build-universal.mjs --cloud` on Linux x64, with immutable size, SHA-256 and identity verification before execution.
