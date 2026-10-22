# ION 0.44 — Private Schedule

Schedule additions and pictures belong only to their signed-in account, including dev accounts. The server chooses the account workspace from the session; client workspace credentials cannot access another Schedule. Shared date scaffolding and permanent identifiers remain intact. Legacy calendar links open the personal Schedule; guests get a stable sign-in gate. Realtime updates use the existing authenticated account channel.

Empty past years, months and dates disappear in the account timezone. Saved active entries retain their complete dated ancestry. Filtering is non-destructive and does not remove saved content or reuse ILs. Current/future dates retain the rolling four-year horizon.

Migration: `cloud/floot/migrations/20261022_private_schedule.sql`. A read-only audit found no existing shared custom Schedule entries requiring migration.

Validation: hosted typecheck clean; eight targeted suites passed, including session-authenticated context isolation with regular/dev fixtures, stolen-workspace rejection, ownership policy and past-period retention/deletion. Live phone-sized browser checks passed in Asia/Tokyo and America/Los_Angeles: stable Schedule sign-in gate and anonymous API rejection (401). No real customer account or Schedule content was altered by tests. The previous premium static audit was not rerun in this environment; this change adds no styled interface elements.
