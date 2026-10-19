# Boards layout correction — October 19, 2026

The earlier square spiral left the outside previews clipped at the default
camera scale, making the visible middle appear as a vertical column. Boards
(IL01) now uses the shared cloudLayout's explicit two-column collection variant:
six previews in three aligned rows, with full captions. Its initial camera fits
the collection, and a new camera key prevents restoring the old clipped view.
Pan/zoom stays available. Rules and other word clouds retain their layouts.
Grid slots survive deletion; new additions append without shifting survivors.

Hosted TypeScript checks and both cloudLayout/spatialViewport Jasmine suites
passed. Browser assertions verify exactly two column centers, three row positions
and all six complete footprints within the viewport at 320, 393 and 820 px.
Screenshots were inspected. DESIGN.md lint reports no errors or warnings.
The strict static audit retains the existing 20 reviewed JSX findings; this
is not represented as an unqualified audit pass. No data or permissions changed.

Floot checkpoint: 40c818a0-ce9c-41d4-bfe7-8872115222c2.
Publish job: ac300635-e017-4407-9edb-289bb6e893c1.
Publication succeeded at https://ion.floot.app. The same layout checks passed
on production at all three widths. No accounts, clouds or saved games were
created by this verification.
