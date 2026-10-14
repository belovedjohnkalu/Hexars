# HEXARS 0.8 — Midnight blue

The interface uses a near-black background, three blue board tones, ivory and black pieces, and frosted glass controls. The board remains flat. Legal move and last-move outlines retain their 4-unit stroke; captures remain amber and checks coral so purpose is visible independently of the blue theme.

Apple devices use the system rounded font when available, with native system fallbacks on other devices. There are no external font requests. Menus animate in and out; pages and loaded boards fade in; piece movement, rotation, status changes, choices, buttons and focus indicators use eased transitions. Loading placeholders show a traced hexagon with a breathing center. Thinking uses a soft blue pulse.

Reduced-motion preferences suppress transitions and decorative animation. The loading mark remains visible and status text stays accessible. Glass uses a translucent background even when backdrop blur is unavailable. Gameplay rules, saved links, install compatibility checks and the install-offer queue remain covered by browser regression checks.

Validation: TypeScript, Vite production build, Floot typecheck and six Vitest checks. Draft browser checks cover 44 gameplay, layout, installation and accessibility cases; nine additional checks cover blue-black theme, loader motion, frosted menus, phone bounds and reduced-motion settings. See `screenshots/hexars-glass-qa.json` and `screenshots/hexars-glass-motion-qa.json` for published verification.
