# ION 0.34 — Consistent variant discovery

Boards and Rules now follow the same purchase-discovery policy as Engines. The shared server/client featureClouds resolver recognizes explicit variant metadata, variant destinations and permanent variant-board/variant-rules IDs. This includes legacy and dev-renamed roots that lack a variant field. Their custom descendants inherit the gate. Gliński stays free; dev and purchased access are unchanged. Unaffordable paid variants disappear; affordable unpurchased entries retain the crossed-through direct trade link.

Regression tests cover all six actual seeded Board/Rules groups, missing metadata, renamed roots, inherited rule paragraphs, affordable purchase gates, ownership and dev access. Hosted typecheck is clean. Browser checks cover Boards, Rules, random matchmaking, filtered server responses and an affordable variant's direct trade link. No account, purchase, estimate, saved game or permanent IL was modified.

Published at https://ion.floot.app and verified with the same browser suite against production (all checks passed). Checkpoint: `d777302d-59d2-4ed3-87e6-795cd1b3dfba`; publish job: `d6451af1-5c95-4877-bffb-79f19402d1b8`.
