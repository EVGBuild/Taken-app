# LumiVault / Elise HQ development-agent instructions

## Purpose

This repository is the shared, durable workspace for the **external development team** that builds the product. These instructions govern development agents; they do **not** add agents, prompts, model calls, or automation to the product itself.

The current product name and product truth are **Elise HQ**. This repository retains the historical LumiVault/LumiVault name and code. Treat older LumiVault material as source material, not as an automatic current decision.

## Start here

Before proposing or changing anything, read in this order:

1. `docs/continuity/README.md`
2. `README.md`
3. `docs/development/agent-team/README.md`
4. `docs/development/agent-team/source-registry.md`
5. the relevant phase documents, tests, current code, and backlog slice

Do not infer current product status from an old plan when a current source can answer it.

## Source authority

Resolve conflicts in this order:

1. Explicit recent decision by Elise.
2. Actual current software and technical reality.
3. Current Elise HQ build backlog.
4. Elise HQ — Project Truth.
5. Consolidated LumiVolt/LumiVault core documents.
6. Grounded research and specialist findings.
7. Historical proposals, chats, and brainstorms.

Classify important statements as one of: **user decision**, **working agreement**, **research finding**, **proposal**, **open decision**, or **historical**. A proposal never silently becomes a user decision.

## Team model

The Orchestrator owns routing and scope. It uses only the specialists that add real value:

- Research: evidence, constraints, alternatives, and uncertainty.
- Product Architect: product rules, lifecycle, data needs, acceptance criteria.
- UX: information architecture, flows, progressive disclosure, microcopy, visual hierarchy.
- Builder: smallest reversible implementation that meets the accepted specification.
- QA: proves behaviour against acceptance criteria and regressions.
- Critic: independently tests necessity, assumptions, system work, complexity, and failure modes.

See `docs/development/agent-team/README.md` for responsibilities and handoffs.

## Required workflow

1. **Ground**: inspect relevant code, tests, current backlog and source status.
2. **Plan**: create a bounded work package with fixed decisions, explicit unknowns, files likely affected, and acceptance criteria.
3. **Specialise only when needed**: independent research/UX work may run in parallel. Do not create agents merely for theatre.
4. **Build**: Builder changes only the approved slice.
5. **Verify**: run relevant automated tests. Browser/device gates remain incomplete unless actually executed in a suitable browser/device environment.
6. **Challenge**: use QA for implementation changes and Critic for meaningful product, data, UX, AI, or architecture changes.
7. **Close**: update the work package/result and report scope, tests, remaining limits, and any decision request.

Agent-to-agent communication must use the work-package and result contract in `docs/development/agent-team/handoff-contract.md`, not undocumented chat summaries.

## Autonomy and action gates

### A — act independently

Read sources; research; analyse; inspect code; debug; run tests; make technical choices within existing decisions; update documentation and status; repair a clear bug within stated acceptance criteria.

### B — act independently and report

Make reversible changes that directly implement an existing decision. Commit only to a dedicated branch and open/update a pull request. Do not merge it automatically.

### C — stop and ask Elise

Ask one focused decision only when the answer is not grounded in existing sources, including:

- a fundamental product direction or conflicting current user decisions;
- an essential personal preference;
- meaningful privacy/data handling or an unapproved external integration;
- a material new cost;
- deletion/migration/read-switch of user data;
- production deployment, merge to `main`, or other irreversible external action.

Do not ask Elise to solve ordinary implementation, test, routing, or repair work that the team can resolve.

## Repository safety

- Never write directly to `main`.
- Prefer one complete vertical slice over broad refactors.
- Preserve localStorage keys, persisted shapes, unknown fields, legacy data, and current behaviour unless an approved migration plan explicitly says otherwise.
- No read-switch, legacy deletion, broad framework migration, generic flat item model, decision-engine redesign, billing, or cloud/auth expansion without its own approved scope and exit gate.
- Keep secrets out of source, commits, logs, prompts, and client code.
- Do not claim a browser, visual, device, or deployment check passed unless it actually ran.
- Do not access unrelated personal Drive content. Use only the sources named in the source registry or explicitly supplied for the work package.

## Definition of done

A work package is done only when the stated acceptance criteria are met, relevant tests are run and truthfully reported, required QA/Critic review is resolved, documentation/backlog state is updated where appropriate, and the result states any remaining unverified device/browser checks.
