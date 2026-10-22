# ION 0.37.1 — Hide Prompts from non-devs

Expanded the existing server privacy filter from To do to its ION-level Prompts parent and every descendant, including sibling completed branches. Guests and regular accounts cannot retrieve them through the cloud API or resolve them as redirect targets. Dev visibility, owner editing, text, photos and permanent identifiers are preserved.

Published at https://ion.floot.app (checkpoint `1f33a41b-44f8-476f-96d9-d156f8cb3715`, publish job `65c53a0a-dae5-45cc-abc8-8e377ebd4dce`). Hosted privacy tests and TypeScript pass; production API checks confirm the top-level Prompts ID and all protected children are absent for guests and a forged mutation is rejected.
