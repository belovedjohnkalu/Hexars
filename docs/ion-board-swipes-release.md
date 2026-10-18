# Board gestures and IL01 — October 18, 2026

Vertical swipes flip Pass and Play. Against Tactical, they switch the human
between White and Black on the existing saved game. Explicit, versioned side
assignments queue while requests are busy; changing sides never resets moves
or extends the saved position's retention deadline. F is the keyboard alternative.
Horizontal swipes still review moves. Wellisch Pass and Play cycles three views.

IL01 is Boards. Its six variant previews now use the square spatial arrangement
already used by Rules, with panning available for content outside the viewport.

Verification: hosted TypeScript checks and four focused Jasmine suites passed,
including pending side-change races. Mobile Chromium verified repeated side
changes, engine replies, unchanged game IDs, history, keyboard access, stale
version rejection and square layout. See the screenshot and browser QA JSONs
under docs/screenshots. The same seven browser checks passed on the published
production site with no app errors. Four credential-scoped preview fixtures and
two production fixtures were removed after verification. The strict design audit retains the previously reviewed
20 JSX findings; it is not claimed as a raw strict pass.

Published to https://ion.floot.app, web only, with no Floot badge. Checkpoint
2ca34647-3866-4c65-8387-ec8ddf5f9b70; successful publish job
b3b009fb-3814-49f5-90e3-8c3fb79dd242. Native Tactical remains 0.9.0.
