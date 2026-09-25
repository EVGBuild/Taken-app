# Source registry

This registry tells development agents where current product context comes from. It intentionally lists only product sources relevant to this repository; it is not permission to browse Elise's personal Drive.

## Authority order

Follow the source order in `AGENTS.md`. The current source must be checked before a historical source is used to change product behaviour.

## Live product sources

| Source | Role | Access/use |
|---|---|---|
| [Elise HQ — Project Truth](https://docs.google.com/document/d/1lDtNafaAG44ccixR7Z3XzbB-NdLHA3_-m35ZY2MNdHw/edit) | Active central product truth | Use for identity, principles, source hierarchy, decision status and escalation. |
| [Elise HQ Bouwbacklog](https://docs.google.com/spreadsheets/d/1iMsE1I1qI3Zb1-VThjgXPiSpWeBW9uc6/edit) | Current operational queue | Use to select a `NU`/ready slice and preserve the stated source/decision status. |
| Repository `main` + tests | Current technical reality | Inspect before planning. Tests and current behaviour are implementation evidence, not automatic product approval. |
| `docs/continuity/`, `docs/phase-*` | Existing architecture and recovery contracts | Required reading for work that can touch affected boundaries. |

## Role-design sources

The seven role documents in Drive are the design sources for Orchestrator, Research, Product Architect, UX, Builder, QA/Tester and Critic. Their practical repo rules are captured in `AGENTS.md` and `README.md` here.

When role instructions are revised, update the corresponding repository rules in the same PR and record the Drive source date/version in the PR description. Do not assume every agent run can or should fetch complete Drive documents live.

## Historical sources

Older LumiVolt/LumiVault documents, mock-ups and research can clarify intent, but are **historical** unless a current source explicitly preserves the relevant decision. Record the status in the work package.

## Snapshot rule

For every meaningful PR, record:

- base commit/branch;
- backlog item or source reference;
- Project Truth version/date consulted;
- any external research source;
- explicit new decision made during the work.

That is enough to reconstruct why the team acted without copying private Drive content or relying on chat memory.
