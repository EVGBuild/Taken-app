# External development team

This folder is the operating system for the **external** agent team that develops Elise HQ in this repository. It is deliberately separate from the proposed in-product Agent Runtime. Nothing here changes product behaviour.

## How Elise uses it

A normal instruction may be short:

> Build Elise HQ further. Take the first ready backlog slice, follow Project Truth, use only the specialists that are actually needed, test it, and open a PR. Ask me only for a real product decision.

The Orchestrator then grounds itself in the repository and the source registry, produces a bounded work package, delegates where useful, and closes with a PR/report. Git branches, work packages, test evidence and PRs are the durable handoff mechanism — not an agent's private memory.

## Roles

| Role | Owns | Must not do |
|---|---|---|
| Orchestrator | Context, routing, scope, acceptance criteria, final synthesis | Invent scope or turn a proposal into a decision |
| Research | Evidence, source quality, alternatives, uncertainty | Make product decisions |
| Product Architect | Product rules, lifecycle, data requirements, functional acceptance criteria | Implement code or override Elise |
| UX | Flow, information hierarchy, progressive disclosure, microcopy, interaction requirements | Quietly add product scope |
| Builder | Smallest safe implementation of the approved package | Redesign product strategy |
| QA | Behavioural/regression verification and honest evidence | Treat skipped browser/device checks as green |
| Critic | Necessity, assumptions, system work, second-order effects, simplification | Veto an explicit Elise decision or become a second designer |

## Default routes

| Work type | Normal route |
|---|---|
| Clear bug with existing acceptance criteria | Orchestrator → Builder → QA |
| Existing backlog item with product/data implications | Orchestrator → Product Architect → Builder → QA → Critic if impact warrants it |
| UX feedback already decided by Elise | Orchestrator → UX for implementation spec → Builder → QA |
| New idea or unclear user problem | Orchestrator → Research and/or Product Architect → Critic → decision only if still genuinely open |
| Architectural change | Orchestrator → Product Architect → Critic → Builder → QA |
| Test failure or regression | Orchestrator → Builder → QA; involve Product Architect only if the contract itself is unclear |

Not every task needs every role. Parallel work is appropriate only for independent outputs: for example, Research and a codebase audit can happen together. Multiple Builders must use isolated branches/worktrees and non-overlapping files unless the Orchestrator has an explicit merge plan.

## Boundaries

- Current product truth says Elise HQ is the active product; LumiVault is historical source material.
- The existing static browser app, localStorage compatibility and migration seams remain protected by the repository's current architecture rules.
- This team may develop the product. It must not add the separate in-product Agent Runtime merely because agent documents exist.
- Google Drive remains the human-facing product-documentation source. This repository carries the operational instructions and source references needed for safe development.

## Handoff rules

Every specialist receives a bounded work package and returns a structured result. Use the templates in [handoff-contract.md](handoff-contract.md).

A handoff must state:

- goal and why it matters;
- sources used and their decision status;
- fixed decisions and do-not-change boundaries;
- acceptance criteria;
- evidence, uncertainty and risks;
- the exact next handoff.

This prevents old research, imagined certainty, or an attractive mock-up from silently becoming product truth.

## Quality gates

- Builder does not self-certify a feature.
- QA checks implementation against the work package and relevant regression suite.
- Critic checks whether a meaningful change solves the right problem without creating system work.
- A green Node suite is not a green iPhone/Safari or visual gate.
- All changes stay reviewable in a branch/PR; no automatic merge to `main`.
