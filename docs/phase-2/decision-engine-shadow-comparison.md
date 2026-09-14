# Decision Engine V2 — Shadow Comparison

Status: **foundation comparison seam complete; regression gates green**

## Goal

Make legacy recommendation behavior and Decision Engine V2 directly comparable on the same inputs without changing what Home shows to the user.

## Implementation

`js/features/decision-engine-shadow.js` accepts the legacy recommendation engine and V2 engine as dependencies and returns a diagnostic comparison containing:

- the visible legacy IDs;
- the visible V2 IDs;
- the legacy classification per task;
- the V2 decision band per task;
- explicit visibility differences.

The comparator is read-only. It does not persist comparison data, render UI, change task records, reorder Today, or activate V2.

## Safety boundary

`js/features/today.js` remains on `recommendationEngine.profile(...)` and `recommendationEngine.sets(...)`. There is no V2 or shadow reference in the active Today adapter.

This slice therefore creates an evaluation instrument, not a product behavior switch.

## Validation

GitHub Actions workflow run `34828830304` on commit `c05632533a2466bcaa486fdc9f46bd285b4449ae`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

The Node gate includes `tests/decision-engine-shadow.test.js`, protecting:

- availability of both visible selections and per-item differences;
- non-mutation of task records;
- absence of storage and rendering side effects;
- continued legacy ownership of Today.

## Exit gate

Achieved for the shadow-comparison seam.

V2 is now safely comparable with the active legacy engine. Activation remains a separate decision. Before Home is switched, comparison cases should cover representative real product situations and the intended differences must be explicitly accepted rather than treated as accidental regressions.
