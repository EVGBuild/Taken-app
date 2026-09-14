# Phase 3A — Home / Today audit

Status: **active product slice**

## Current truth

Home is already wired to the reversible Decision Engine adapter and V2 is the active default. The legacy engine remains available as rollback.

The current Home surface already has the intended five-bar check-in, a maximum of three rendered suggestion rows, completion controls, swap controls, feedback, and the existing broaden action in markup/runtime.

## Findings that must be fixed before visual sign-off

### 1. Unknown context is currently fabricated

Decision Engine V2 currently substitutes an absent/stale check-in with energy `3`, and substitutes missing task demand/importance fields with numeric defaults. That conflicts with the product contract that unknown information must remain unknown. Home can therefore currently describe a task as a capacity fit when neither current capacity nor task demand is actually known.

**Required:** preserve unknowns explicitly; hard rules such as deadlines/lifecycle may still decide attention, but capacity-fit language may only be used when the required context is known.

### 2. Broaden is functionally wired but visually suppressed

`home.js` and `today.js` calculate and wire the broaden action, while `css/home-exact.css` forcibly hides `#todayRecoveryActions`. The product therefore contains behavior that the current Home CSS makes unreachable.

**Required:** restore the action only when runtime says it is relevant; do not make it permanently visible.

### 3. Home has overlapping historical presentation layers

Home markup plus `home-exact.css` already represents a later visual direction, while earlier shared CSS files remain in the cascade. Phase 3A should improve Home inside the existing ownership/cascade contract rather than adding another patch stylesheet.

### 4. Three suggestions is already the current product limit

`home.js` allocates at most three primary positions after attention items, and `home-exact.css` also hides rows after the third. Phase 3A will preserve the calm three-item surface rather than expanding it.

### 5. Check-in is correctly optional at interaction level

The check-in can be opened/changed and persists only a 1–5 value. It is not a blocking startup step. Phase 3A must preserve that property while making no-check-in recommendations honest.

## Phase 3A product contract

Home must:

- work with or without a current check-in;
- never pretend unknown capacity/task demand is known;
- keep hard lifecycle/deadline rules independent from capacity fit;
- show at most three primary/attention rows in the calm default surface;
- keep Waiting/Later out of ordinary actionable suggestions;
- allow a user to broaden deliberately when heavier/deferred options exist;
- preserve swap, completion, task detail, and rollback behavior;
- explain recommendations with localized human-readable reasons rather than scores;
- remain mobile-first and accessible;
- avoid new storage, cloud, AI, billing, or data-migration work in this slice.

## Execution order

1. Harden V2 unknown-context semantics and reason mapping.
2. Characterize Home behavior with focused tests.
3. Restore/reconcile broaden and recovery behavior.
4. Perform Home visual consolidation in the existing Home stylesheet.
5. Run Node regression and real Chromium acceptance.
6. Push for user visual/product review through the existing Pages flow.
