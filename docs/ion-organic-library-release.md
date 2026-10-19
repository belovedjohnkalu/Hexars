# ION organic clouds and Library — October 19, 2026

Collections now use collision-free organic packing, close spacing and stronger
font sizing based on total descendants. Measured picture collections receive
enough horizontal room to avoid a single column. Retained centers and camera
positions survive deletion and return navigation. ION's home anchors remain stable.

Controls includes Link for an entire cloud or selected words, targeting an
accessible cloud or an http/https URL. Links use existing workspace permissions
and version checks. Inline linked words remain keyboard accessible.

IL04 is Library: History and Shared Games, containing Received and Shared.
History cards render the latest saved position, including online games. Saved
views expose Notations and Opponent/Opponents, preserve origin Back navigation,
and never reveal gameplay capabilities. Everyone can copy notations. Dev-only
history identifiers use permanent account-scoped registrations.

Holding a saved card opens Delete and Share. Sharing creates a read-only link
or adds the game to another account's Received collection. No email is sent.
Own deletion hides one membership; sender deletion revokes a share; recipient
deletion hides one receipt. Other players retain their games. Undo is ten seconds
from deletion. The migration adds share records and membership visibility only.

The app favicon and install icon trace the supplied geometric mark. Loading
screens animate its three paths, with a static reduced-motion alternative.

Validation: hosted TypeScript clean; 30 helper suites pass across batches;
API checks cover account isolation, selected-word links, unsafe URL rejection,
saved positions, share access, hide/revoke/restore, expired Undo, dev IL visibility
and stability, online history and opponent details. Phone browser checks cover
organic board placement, Link controls, saved notation copying, opponent viewing
and origin Back navigation. The static design audit reports two pre-existing
legacy login-page findings; the changed flow has no new audit findings.
