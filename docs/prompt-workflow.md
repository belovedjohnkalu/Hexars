# Dev prompt workflow

The configured Home owner is dev 0. All dev accounts can read Prompts (IL0A0), To do and descendants. Regular accounts and guests cannot receive this branch through cloud/redirect APIs, including its pictures. Shared Home mutations stay restricted to registered dev accounts; personal data remains scoped to its account. Labels never grant permissions.

Current live structure, verified for the directly requested 0.48 batch:

| Page | Node ID | Purpose |
| --- | --- | --- |
| IL0A0 | `6208875d-c43c-4548-824f-9c0229fd16bc` | Prompts |
| IL0A00 | `8d489e18-161c-4c8b-a7a4-63cdfecc9394` | To do |
| IL0A01 | `df45ea97-524e-4c1c-b2f6-2a96529562e3` | Completed |

The previous Prompts inbox `a6af91c2-fd49-49e9-a385-d911890368c9`, its Complete child `ef9da214-6a55-4861-a609-dee2726bb486`, and its Completed sibling `55b50ec5-26d5-428b-81f2-cae577e42828` are soft-deleted. Preserve these tombstones and their birth ILs; do not resurrect or renumber them.

For queued work, read the latest owner Home workspace and identifiers through authorized tools. The standing ready filter remains a current, trimmed name exactly `Complete` inside the configured prompts inbox. If that structure is absent, it does not authorize execution of arbitrary drafts elsewhere. Direct user instructions take precedence: “Complete the Todo lists” explicitly authorized the bounded five-task snapshot documented in `docs/releases/ion-0.48.md` directly inside current To do. Newly arriving prompts wait for another pass.

After implementation, tests and publication when applicable, move each original task root into the current active Completed folder with the latest workspace version, preserving its ID, text, images, descendants and birth IL. Verify the task and destination are still live and unchanged; row-lock/version-check and re-read on conflict. Never replace a stale workspace snapshot. Administrative SQL changes queue `ion_workspace_refresh`; an authorized cloud load drains it through the existing scope-specific realtime channel. Verify delivery before declaring the archive complete. Do not archive blocked or unverified tasks.

The app stores prompts as data; it never runs arbitrary submitted text as code. Execution happens only during an authorized development session. Completion includes verifying the archive move, not just writing a completion note.
