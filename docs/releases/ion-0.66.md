# ION 0.66 — Proportional words and pictures

## Exact proportions

Fonts and picture width/height now scale directly with total characters in every authorized descendant. A 20-character total is twice a 10-character total; 35 is 3.5 times 10 and 1.75 times 20. The same unrounded affine scale applies to the entire printed group. Own names reserve geometry without setting font size. Empty clouds use the smallest positive sibling scale, or equal scale when all are empty.

The adjoining text arrangement remains. Logical whole-cell counts still use their existing integer topology; physical fitting does not round the printed proportions. Cloud pages and the Tiles overview share this layout. The camera supports a matching deep zoom range, and keyboard focus brings smaller groups to readable type. Removing a forced pre-rasterized world layer prevents tiny content disappearing at deep zoom. There are no new size caps, permissions, data reads, colors or font choices.

## Dark first paint

The published document head restores the explicit saved theme before app scripts and styles. Root background, color-scheme and browser theme-color are set synchronously. Hydration keeps that choice; later theme changes update the same inline root paint. Light remains the default, including when storage is unavailable. This does not enable SSR, add network requests or register a service worker.

## Verification and publication

All 117 helper suites pass, including hooks, plus focused reruns after the final focus fixture change. Hosted TypeScript is clean. Thirteen published browser checks pass on desktop and phone emulation: exact text/picture ratios, complete fitted content, no document scrolling, readable and actually painted deep focus, saved dark/light/default before any app JavaScript, and cold dark loads/reloads with delayed app startup. All sampled first-paint frames match the chosen theme. No uncaught browser exceptions occurred. Physical iPhone testing was not performed.

The strict premium audit retains 38 reviewed findings, zero unresolved findings and no new categories. Four pre-existing hosting notices and seven external ChatGPT integration endpoints are unchanged. Browser harnesses are tests/e2e/ion-0.66.*.cjs. Credentials and fixture data are excluded from Git.

Live at https://ion.floot.app. Disposable QA account 163 is retired: sessions expired, password/device associations removed, fixture nodes cleared and earning disabled. It accumulated no wallet earnings and uploaded no assets. Real accounts and their private content were untouched. No queued prompts or archival operations were authorized by this direct request.

Exact evidence and the observed agent work interval appear in docs/verification/ion-0.66.json. Elapsed agent work is not independently verified human labor.
