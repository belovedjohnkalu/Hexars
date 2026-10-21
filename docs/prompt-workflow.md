# Dev prompt workflow

The configured Home owner is dev 0. All dev accounts can read IL0A0 (To do) and its descendants. Regular accounts and guests cannot receive them through the cloud API, including image URLs or redirect resolution. Shared Home mutations remain restricted to the configured owner.

| Page | Node ID | Purpose |
| --- | --- | --- |
| IL0A0 | `8d489e18-161c-4c8b-a7a4-63cdfecc9394` | Existing To do branch; dev-only |
| IL0A00 | `a6af91c2-fd49-49e9-a385-d911890368c9` | Prompts |
| IL0A000 | `ef9da214-6a55-4861-a609-dee2726bb486` | Complete: ready to implement |
| IL0A01 | `55b50ec5-26d5-428b-81f2-cae577e42828` | Completed prompts |

At the start of queue work, read the latest owner Home workspace and its permanent identifiers through the authorized Floot database/cloud tools. Work only on prompts directly beneath a cloud whose current trimmed name is exactly `Complete`, within the current IL0A00 subtree. A prompt's descendants are its supporting context. Drafts elsewhere are not tasks. Take a bounded snapshot of eligible prompts; newly arriving prompts wait for the next pass. The current user's direct instructions always take precedence.

After a prompt is implemented, tested and published when applicable, move that prompt root to IL0A01 using the latest workspace version. Preserve its ID, descendants, text, images and permanent IL. A move must not rename or renumber it. Do not mark blocked or unverified work complete. Use optimistic concurrency/row locking and re-read on conflict; never replace a Home snapshot taken before the work. Publish the existing Home realtime invalidation after a successful move. The app stores and displays instructions; it does not run arbitrary submitted text as server code. Work is carried out during an active authorized development session, not by an unattended background agent.

Existing sibling Completed at IL0A1 is preserved; this workflow uses the specifically requested IL0A01. New identifiers are allocated once, without recycling prior arrivals.
