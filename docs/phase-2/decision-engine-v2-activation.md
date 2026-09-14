# Decision Engine V2 — Reversible Activation

Status: **V2 active on Home/Today behind a reversible adapter; regression gates green**

## Goal

Activate Decision Engine V2 for the current Home/Today recommendation flow without deleting or rewriting the legacy recommendation engine, and preserve an immediate fallback path.

## Activation seam

`js/features/decision-engine-activation.js` provides a stable `profile(...)` / `sets(...)` adapter for Today.

The adapter can run either:

- `legacy` — delegates directly to the existing recommendation engine;
- `v2` — delegates to Decision Engine V2 and maps staged decisions to the existing Today presentation contract.

The adapter exposes `useLegacy()`, `useV2()` and `mode()` so activation is reversible without rebuilding data or deleting legacy behavior.

`js/core/bootstrap.js` now creates both engines and starts the adapter in `v2` mode. The legacy engine remains instantiated and available.

## User-visible scope

Home/Today now receives its recommendation selection from V2 through the compatibility adapter. The existing Today/Home rendering code remains in place.

The adapter maps V2 decision reasons onto existing localized reason copy, so the activation does not introduce raw internal decision codes into the UI.

## Runtime loading note

The current classic-script runtime does not yet have a clean module entry point for inserting the two new Decision Engine files into `index.html` through a narrow patch. To avoid replacing the entire large HTML file for this slice, `recommendations.js` parser-loads the V2 and activation scripts before bootstrap.

This is explicitly an **intermediate loader seam**, similar in spirit to the current i18n parser-time locale loading. It should be removed when the classic-script loader is modernized; it is not the intended long-term module architecture.

## Safety

This slice does **not**:

- delete or rewrite the legacy recommendation engine;
- migrate or change persisted task data;
- add a new storage key for the engine mode;
- activate AI, cloud, auth, sync or billing;
- change IndexedDB product reads;
- redesign Home UI.

Fallback is code-level and immediate: the same adapter can switch back to `legacy`.

## Validation

GitHub Actions workflow run `34829547110` on commit `427568a389ea5d7dfd685cf7a333ecd0abf5a262`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

The browser gate verifies in real Chromium that:

- startup mode is `v2`;
- the adapter can switch `v2 -> legacy -> v2` at runtime;
- no page errors occur;
- existing storage/bootstrap/navigation behavior remains intact.

`tests/decision-engine-activation.test.js` additionally protects the adapter contract, V2 startup mode, Today-compatible result shape and legacy fallback.

## Exit gate

Achieved.

Decision Engine V2 is now the active Home/Today selection engine on `foundation-migration`, with the legacy engine preserved as an immediate fallback. The next architecture slice can proceed to the AI Service boundary without making AI responsible for deterministic recommendation logic.
