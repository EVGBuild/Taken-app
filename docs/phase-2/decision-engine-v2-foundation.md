# Decision Engine V2 foundation

Status: **foundation seam complete; not activated in product UI**

## Goal

Create the next decision architecture without silently replacing the existing recommendation behavior. V2 must separate hard eligibility, contextual fit and ordering instead of reducing every signal to one universal score.

## Implemented

`js/features/decision-engine-v2.js` introduces a pure, storage-independent decision seam.

The pipeline is staged:

1. lifecycle and hard eligibility;
2. attention vs actionable;
3. urgent deadline handling;
4. importance + capacity fit;
5. ordinary capacity fit;
6. possible/light options;
7. defer on capacity mismatch;
8. ordering only inside a selected band.

The bands are `must`, `strong`, `fit`, `possible`, `defer`, `attention`, and `excluded`.

There is deliberately no `score` in a V2 decision result. Deadline, necessity, impact, energy demand, mental demand, physical demand, resistance and enjoyment remain separate signals so later explanations and learning can inspect them independently.

## Activation boundary

V2 is **not yet wired into Today/Home**. `today.js` still calls the existing `recommendationEngine.profile()` and `recommendationEngine.sets()` functions, and `recommendations.js` is unchanged.

This is intentional. Replacing live recommendations is a product-behavior migration and requires its own comparison/browser gate and explicit activation decision. The foundation slice therefore creates and tests the new engine without changing what the user sees today.

## Tests

`tests/decision-engine-v2.test.js` verifies:

- Waiting/Later are filtered before ranking;
- urgent deadlines can enter `must` despite low capacity;
- important fitting work is distinct from ordinary fitting work;
- heavy low-priority work is deferred rather than rescued by a composite score;
- selection exposes bands and no universal score;
- the legacy recommendation engine remains untouched and active.

GitHub Actions run `34828632221`:

- Node foundation gate: **success**
- Chromium bootstrap gate: **success**

## Scope protection

No storage migration, IndexedDB read switch, UI redesign, AI provider, cloud service, authentication, billing, Capture change or Connected Vault change is part of this slice.

## Next decision

Before activation, V2 should be run side-by-side against realistic task sets and the existing engine. Differences should be inspectable by band and signal. Only after that comparison is acceptable should Today/Home be switched to V2 in a separate reversible activation slice.
