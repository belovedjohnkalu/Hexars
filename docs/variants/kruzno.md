# Kruzno’s Checkers

Playable in ION’s Checkers branch, IL01A0. Primary source: [publisher’s Hexagonal Checkers page](https://www.kruzno.com/hexcheckers.html). Inherited capture-chain details were checked against [WCDF English rules](https://wcdf.net/rules/rules_of_checkers_english.pdf), §§1.18–1.20. Checked 24 October 2026. This game is distinct from Kruzno’s chess-piece board game.

The radius-five board has 91 cells and 12 men per side in the publisher’s two three-row triangles. Pieces step to any of six empty edge-adjacent cells; there is no promotion. Captures jump an adjacent enemy to the clear cell immediately beyond. Captures and all continuations are compulsory, but a shorter complete route may be chosen. A piece cannot be jumped twice. The selected route is committed as one turn.

A checker entering the shaded outer ring owes an exit. The user explicitly selected **captures before border exits**. On a non-capturing turn, an available inward step by a due checker takes priority. An enemy-blocked checker may defer; friendly blockage does not waive the obligation. If capture exceptions leave several debts, an available exit is selected and the others remain due.

The short publisher page does not specify every adjudication detail. ION uses Black first, following English checkers; captured-out or blocked players lose; threefold repetition and 40 moves by each side without capture automatically draw. Mutual agreement draws are also available. These conventions are identified in the app’s Rules, rather than attributed to the publisher.

The publisher’s diagram has its own orientation. Its upper-right triangle q=0…−r, r=−4…−2 is reflected into the renderer’s upward r-axis as q=q,r=−q−r; the opposing army is the central reflection. ION’s notation is a presentation convention. Captured men disappear after each selected jump, following §1.18, while the complete chain remains mandatory (§1.19); short jumps preserve landing parity, so removing already-jumped victims cannot enable landing on them.

Both games use the existing persistent game API, account/capability authorization, version checks, Library, sharing and online system. Matchmaking filters the requested game family and owned variants. Their dedicated computer does not claim support in the six C++ chess executables.
