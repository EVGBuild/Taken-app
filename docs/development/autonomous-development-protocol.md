# LumiVault Autonomous Development Protocol

Status: ACTIVE

## Purpose

Elise owns product intent and final product judgment. She is not the technical project manager, browser QA operator, regression tester, deployment watcher, or person responsible for discovering obvious implementation defects.

The development agent owns execution from scoped product intent through verified deployed result.

## Default workflow

Product intent -> inspect current truth -> define acceptance contract -> implement -> automated regression tests -> real browser QA -> visual/product QA when applicable -> self-correct -> repeat until gate passes -> deploy -> verify deployed build -> report result to Elise.

A successful unit test or successful deployment is never, by itself, sufficient evidence that product work is done.

## Roles

### Elise — Product owner

Elise should normally only need to provide:
- the desired outcome;
- subjective product preference when a genuine personal/product choice is unresolved;
- final judgment on a result that has already passed internal QA.

Do not ask Elise to inspect code, run commands, reconcile documentation, diagnose cache/deployment issues, select implementation techniques, or repeatedly provide screenshots to reveal defects the agent can detect itself.

### Product lead

The product lead converts intent into a bounded development contract, preserves roadmap/architecture decisions, identifies genuine product decisions, and rejects premature completion.

### Builder agent

The builder inspects the repository before editing, implements the smallest coherent solution, preserves out-of-scope behavior, adds or updates tests, debugs failures independently, and leaves rollback possible for risky changes.

### QA/reviewer pass

For substantial or visual work, perform an explicit reviewer pass after implementation. Review the result as if it were produced by another developer. Look for regressions, stale legacy behavior, visual contradictions, accidental scope expansion, accessibility defects, responsive defects, and misleading success claims.

## Non-negotiable completion gates

Before reporting a development slice as complete:

1. Repository truth inspected; do not work from assumptions or stale screenshots alone.
2. Scope and invariants identified.
3. Relevant automated tests pass.
4. Real Chromium/browser gate passes for user-facing browser behavior.
5. For visual work, inspect the rendered page at the target mobile viewport. A green test suite does not certify visual quality.
6. Compare visual work against the supplied reference direction and written visual decisions.
7. Fix obvious defects independently and rerun the gates. Do not use Elise as the first QA pass.
8. Verify the deployed GitHub Pages build, not merely the source branch, when the requested result is meant to be viewed there.
9. Confirm the deployed build corresponds to the intended commit and that refreshed assets are actually served.
10. Only then report the result for Elise's product judgment.

## Visual implementation rules

For visual slices:
- Reference images define art direction unless the task explicitly asks to copy layout.
- Do not claim success from CSS source inspection alone.
- Render and inspect the actual page.
- Check at minimum hierarchy, spacing, density, typography, color/light, glass/depth, background atmosphere, navigation, target sizes, clipping/overflow, labels, and consistency with existing product decisions.
- Do not accumulate indefinite override-on-override CSS. If legacy layers prevent a coherent result, consolidate ownership within the scoped surface while preserving functionality.
- Do not silently reintroduce rejected product decisions.
- Avoid decorative effects that technically satisfy keywords but fail the intended visual feeling.

## LumiVault Home visual direction

Current reference direction is a premium, adult, calm dark spatial interface: deep navy/near-black rather than flat black; restrained diffuse nebula/cloud light; selective sparse stars/twinkles; luminous glass surfaces; jewel-tone teal, violet, blue, gold and warm pink accents used as light rather than flat decoration; depth without noisy wallpaper; readable content; compact task rows; meaningful objects may use cards; navigation/Orb may carry stronger glass/light treatment.

The reference images are mood/art-direction references, not mandatory layout templates.

Known Home decisions include:
- no greeting such as "Goedemiddag Elise";
- optional, non-blocking check-in;
- question: "Hoeveel kun je op dit moment aan?";
- five visual battery bars rather than literal fractions;
- no visible "Orb" label under the central Orb;
- Home is a calm prioritized re-entry surface, not a control panel;
- cards are for meaningful objects; rows are for items;
- completion feedback should be compact with Undo;
- Decision Engine behavior must not be changed by a visual-only slice.

## Escalation policy

Ask Elise only when at least one of these is true:
- two materially different product behaviors are both technically valid and the choice is personal/product strategy;
- an irreversible or externally consequential action requires her authorization;
- required information cannot be inferred or obtained from repository/project sources;
- the requested outcome conflicts with an existing explicit product decision and the conflict cannot be resolved without changing that decision.

Do not escalate ordinary implementation choices, debugging, test failures, browser discrepancies, cache busting, CSS ownership, refactoring technique, or deployment verification.

## Failure policy

If a result fails a gate, status is NOT DONE. Diagnose, correct, and rerun. Do not present a known-defective result as a candidate merely because a deployment succeeded.

If repeated attempts fail for the same architectural reason, stop patching and change the implementation strategy. Record why.

## Reporting format

When complete, report compactly:
- what changed;
- tests/browser/deployment status;
- any genuine remaining known deviations;
- where Elise can view the already-verified result.

Do not ask Elise to perform technical verification that the agent can perform itself.

## Current first assignment

Phase 3A Home/Today visual implementation is the first assignment governed by this protocol. The next execution should treat the currently deployed Home as a failed visual QA baseline, preserve current functionality and Decision Engine behavior, and autonomously rebuild/verify the Home visual surface against the established LumiVault art direction before presenting it again.