# ION 0.51 — Variant first

Standalone Engines and difficulty links now lead to Boards until a variant has been selected. Selecting a variant opens Pass and Play rather than automatically using a remembered engine. The board's existing Engines action preserves the chosen variant through engine and difficulty selection. Saved-game, online, redirect and purchase routes remain intact; permanent cloud identities are unchanged.

Verified: hosted TypeScript clean; isolated live-bundle phone and desktop checks for standalone Engines routing, ignoring a remembered engine, and engine-level links returning to the selected variant. Premium static audit retains the same 38 reviewed findings. React review: primitive effect dependencies, replace navigation for obsolete standalone entry, no new data fetch or shared state.
