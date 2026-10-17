# ION cloud navigation
Live: hexars.floot.app. Floot is the active host. GitHub is the source backup.

CloudExplorer owns navigation and correction dialogs; CloudCanvas + SpatialViewport own word positions, camera and context menus. cloudTree resolves sparse overrides over default nodes and computes descendant counts without recursion. cloudLayout packs smaller words/pictures. BoardPreview renders the shared native starting board from variants_GET.

cloud_POST accepts add/upload/load/rename/remove/restore/move/copy. No node-count cap. CAS versions and idempotent IDs protect writes. cloudChanges remaps copied subtrees, rejects cycles, preserves private pictures, and supports reversible deletion including default entries. Pictures upload directly to presigned storage.

AuthProvider and /login use Floot email/password sessions with Forgotten password. cloudWorkspace validates the session or anonymous capability, serializes account linking and merges existing browser content without dropping server nodes. ion_cloud_accounts maps one user to one canonical workspace; ion_workspaces.owner_id prevents old anonymous capabilities reading claimed spaces. Realtime tokens grant only cloud-user:<authenticated user id>; changed versions trigger refresh. No public sharing of words.

Play keeps separate engine/pass-and-play sessions. game_POST review inspects timeline[ply] without writes; swipes never undo. Result Dialog opens on an ended state. Native C++ remains authoritative. Gliński and McCooey only. Tactical only. Source / web migration and Shafran are separate unpublished development.

Verified 2026-10-17: plan pro; badge is already disabled. Do not request a native build for web styling. Existing installed icons continue to work. Static PWA manifest and theme-color are black; never create a service worker.
