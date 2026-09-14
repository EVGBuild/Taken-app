# Phase 3A — Home / Today product reference

Status: **technical/product reference implementation ready; user visual review still required before Phase 3A closure**

## Scope completed

Phase 3A has moved Home/Today from the foundation-era presentation toward the first product reference surface for LumiVault.

### Decision semantics

- Decision Engine V2 remains the active Home/Today engine through the reversible adapter.
- The legacy engine remains intact as rollback.
- Missing or stale check-in context is no longer fabricated as average capacity.
- Missing task demand/context remains unknown instead of being silently replaced with numeric defaults.
- Hard rules such as deadlines remain independent from capacity fit.
- Unknown fit is explained honestly through localized copy instead of being described as an energy fit.

### Home behavior

- The calm default surface remains limited to three rows total across normal suggestions and attention items.
- Waiting/Later lifecycle behavior remains outside ordinary actionable recommendations.
- The empty state works with or without a current check-in.
- The existing broaden action is now actually reachable when heavier/deferred options exist.
- Broaden is deliberate: the user must explicitly request those options.
- Swap, completion, task detail, check-in, and Decision Engine rollback behavior remain in place.
- Recommendation reasons are visible on Home rather than hidden by the old presentation layer.

### Visual reference direction

The existing `css/home-exact.css` ownership layer was consolidated instead of adding another patch stylesheet.

Home now uses:

- a calmer dark background with restrained nebula ambience;
- a smaller optional check-in surface with five real battery bars;
- content-first task rows instead of oversized glowing cards;
- visible, quiet recommendation reasons;
- compact circular swap controls;
- a secondary broaden/recovery action rather than another large card;
- a compact empty state and feedback toast;
- calmer Home / Orb / Vault glass navigation;
- reduced visual brightness and glow;
- reduced-motion handling.

This Home surface is intended to become the visual/product reference for later Phase 3 screens after user review.

## Automated acceptance

Focused guard: `tests/home-today-product.test.js`.

Real Chromium acceptance additionally verifies:

1. existing bootstrap/navigation/storage behavior still starts without page errors;
2. RAW capture/provenance regression remains green;
3. a low-capacity heavy task exposes the deliberate broaden path;
4. broadening actually surfaces the heavier option;
5. a task with unknown context and no check-in remains recommendable without falsely claiming an energy fit.

GitHub Actions run `34833302187` on branch `foundation-migration`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

## Scope explicitly unchanged

- `localStorage` remains the active product source.
- No IndexedDB read switch was activated.
- No storage migration or legacy cleanup was performed.
- No AI provider was connected.
- No cloud/auth/sync provider was connected.
- No billing provider or paywall was activated.
- No Phase 3B Capture redesign was started.

## Remaining Phase 3A gate

The implementation is technically green, but Phase 3A is **not formally closed** until the actual Home surface has been reviewed as a product by the user on the deployed/preview build.

Review should be limited to user-level questions such as:

- Does Home feel calm and immediately understandable?
- Is the hierarchy between check-in, "Voor nu", suggestions and secondary actions right?
- Are recommendation reasons useful without adding clutter?
- Does the new navigation/Orb balance feel right on the phone?
- What, if anything, visually or behaviorally feels wrong?

Only after that review and any resulting corrections should Phase 3A close and Phase 3B Capture begin.
