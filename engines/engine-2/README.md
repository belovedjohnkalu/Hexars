# Positional 1.0.0

Full-width MaxN and history-aware transposition caching with structure, coordination and king-phase evaluation.

This is an independent C++ executable. Only rules, serialization and protocol ABI are shared. Supports all six variants, bounded iterative search, legal fallback and native validation.

Build from repository root: `npm run build:positional` (or append `-- --cloud` on Linux x64). `npm run test:search` verifies both new searches, including complete games. See [release details](../../docs/ion-independent-engines-release.md).
