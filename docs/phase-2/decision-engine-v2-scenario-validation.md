# Decision Engine V2 — Scenario Validation

Status: **representative foundation scenarios validated; regression gates green**

## Goal

Validate the intended Decision Engine V2 behavior against representative product situations before any activation on Home.

## Scenarios locked by tests

`tests/decision-engine-v2-scenarios.test.js` now protects these behaviors:

1. **Low capacity:** a light fitting task remains available while heavy optional work is deferred.
2. **Hard deadline:** an urgent task remains visible even when its demand exceeds current capacity.
3. **Waiting / Later:** non-actionable lifecycle states do not leak into active recommendations.
4. **Resurfacing:** a Later task becomes actionable again when its canonical `deferredUntil` date is reached.
5. **Important vs ordinary fit:** both may fit current capacity, while V2 keeps them in distinct `strong` and `fit` bands.
6. **Intentional legacy difference:** V2 does not let one extremely high-scoring task hide another otherwise fitting task merely because the latter falls outside the legacy score window.

## What the first validation run found

The first scenario run correctly failed two test assumptions rather than revealing a V2 product-code defect:

- the scenario supplied `lifecycle.resurfaceDate`, while the existing canonical lifecycle compatibility contract stores the legacy nested date as `lifecycle.deferredUntil` and normalizes it to top-level `resurfaceDate`;
- a cross-VM array assertion used deep strict equality, which is inappropriate for arrays created in a separate VM realm.

The tests were corrected to match the existing lifecycle contract and compare the cross-realm list by value. No Decision Engine product logic was changed to make the tests pass.

## Validation

GitHub Actions workflow run `34829086339` on commit `5c46f0abc3a7b585c7a032e4497dbdf6e51cbea0`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

## Activation status

**Not activated.**

Home/Today still uses the legacy recommendation engine. This validation establishes a tested behavioral contract for V2, but switching the active adapter remains a separate reversible product change with its own browser acceptance gate.

## Exit gate

Achieved for representative scenario validation. The next safe slice is an explicit V2 activation seam/feature switch so Home can be moved to V2 reversibly, without deleting the legacy engine.
