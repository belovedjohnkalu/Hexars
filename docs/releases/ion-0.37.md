# ION 0.37 — Sign-in landing and Remember affordance

Successful sign-in and account creation now replace the authentication route with ION (`/`) even when a caller supplied a `back` page. Back/cancel and remembered-account switching retain their prior navigation. Legacy reusable login/register components use the same replace behavior, with the old login timeout removed.

Remember on both active authentication forms is now an explicitly outlined 44px pill button, with a blue selected state and check mark. It keeps the shared Button's keyboard, focus, pending and reduced-motion behavior, uses aria-pressed and cannot accidentally submit the form. The selected state and device-only remembering semantics are unchanged. If remembering fails after successful authentication, the user still reaches ION with the existing notice explaining how to retry from Accounts; authentication failures retain the typed values and form error.

Validation: hosted TypeScript clean and design lint clean. Browser fixtures cover sign-in and sign-up from a return link to Private, Remember selected/unselected and no accidental submission, successful device remembering, remembering failure after authentication, and invalid credentials followed by retry. No actual accounts or sessions are created by these checks, so they do not change Time's pricing population.

Published at https://ion.floot.app (checkpoint `a983e4b0-bb60-4c98-9b4c-5843fbcc9313`, publish job `272e09a6-6f0f-4fb5-a14e-5f6a316086ea`). All four browser scenarios passed again against production with the phone viewport.
