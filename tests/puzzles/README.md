# Daily puzzle banks

Each of the eight existing variants has 64 composed positions. A stable offset
selects one per account-local date, cycling after 64 days. These are rule-checked
compositions, not positions advertised as coming from historical games.

Gliński, McCooey, Shafran, Brusky and De Vasa ask for mate in one. Wellisch asks
for a king capture with its actual three-player army-takeover rules. HexDame asks
for promotion in one; Kruzno asks for a win in one. Every accepted continuation
is checked. Ordinary legal alternatives are available so a puzzle requires a
choice. Native generation uses the current C++ position validator, complete move
generator and checked applyMove; checkers generation uses the authoritative
TypeScript rules, including complete capture paths and border obligations.

Generate from the repository root (C++20 compiler and npm dependencies needed):

```sh
mkdir -p /tmp/ion070-puzzles
g++ -std=c++20 -O2 -Ishared/include -Ishared/third_party \
  tests/puzzles/generate.cpp engines/engine-1/protocol.cpp \
  engines/engine-1/search.cpp shared/src/*.cpp shared/variants/*.cpp \
  -o /tmp/ion-puzzle-generator
for variant in glinski mccooey shafran brusky devasa wellisch; do
  /tmp/ion-puzzle-generator "$variant" "/tmp/ion070-puzzles/$variant.json" 64
done
npx tsx tests/puzzles/generate-checkers.mts
npx tsx tests/puzzles/pack.mts
npm run test:puzzles
```

Generation is a development task; visitors never trigger it. The packer removes
source-state proofs from the shipped banks and records hashes of the rules and
generated data. CI rejects rule drift until banks are regenerated and reviewed.
The verifier checks all 512 entries and 897 accepted continuations, and replays
all checkers legal alternatives. Raw native state proofs stay in the temporary
generation directory for inspection. The native generator itself has already
examined every legal alternative and re-applied each correct move with validation.

Banks and answers are server-only. Load returns one starting board and legal
moves; a successful attempt returns the corresponding completed board. Hint
reveals only the starting piece. Account-private first-solve progress uses
versioned, idempotent writes and survives device changes. Guest progress is
device-local. There is no puzzle reward, wallet grant or leaderboard in this
release. Paid variants retain the existing authoritative purchase requirement.
