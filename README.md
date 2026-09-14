# LumiVault

LumiVault is a browser-based HTML/CSS/JavaScript application being evolved from a working local-first prototype into a durable external-memory and contextual decision-support system.

The current repository is deliberately being migrated in small, reversible slices. Existing behaviour and local data remain protected while clearer architecture boundaries are introduced.

## Start here

For a new developer or a recovery scenario, read:

1. `docs/continuity/README.md` — start/test/backup/recovery runbook.
2. `docs/phase-0/decision-register.md` — approved product decisions vs research vs hypotheses.
3. `docs/phase-1/storage-safety-seam-report.md` — proven storage migration safety.
4. `docs/phase-2/foundation-architecture-contract.md` — required future architecture boundaries.
5. `docs/phase-2/foundation-architecture-audit.md` — current architectural gaps and migration order.

## Current runtime architecture

LumiVault currently runs as a static browser app with no framework and no build step. `index.html` owns the markup and loads classic browser scripts in an explicit dependency order.

This is a **working intermediate architecture**, not the desired final architecture. The current global-script/loading-order model must be improved gradually through small seams rather than a big-bang rewrite.

### Current CSS load order

`index.html` currently loads these stylesheets in order:

1. `css/foundation.css`
2. `css/vds.css`
3. `css/theme.css`
4. `css/mobile-polish.css`
5. `css/mockup-rollout.css`
6. `css/mockup-fidelity-v2.css`
7. `css/home-exact.css`
8. `css/consolidation.css`

Several of these layers represent different rollout generations. Do not add another temporary visual layer without an explicit consolidation plan and regression gate.

### Core JavaScript

- `js/core/storage.js` — active StorageGateway and legacy localStorage contract.
- `js/core/i18n.js` — current NL/EN translation function and dictionary; not yet the final multi-locale architecture.
- `js/core/task-model.js` — task normalization/lifecycle model helpers.
- `js/core/bootstrap.js` — current persisted state loading, normalization and much of startup wiring; known architecture hotspot.
- `js/core/ui.js` — shared UI primitives/helpers.
- `js/core/navigation.js` — navigation helpers.
- `js/core/init.js` — final startup synchronization.

### Feature files

- `js/features/recommendations.js` — current recommendation engine; intentionally storage-independent. Do not redesign yet.
- `js/features/checkin.js` — check-in behaviour.
- `js/features/home.js` — Home presentation behaviour.
- `js/features/tasks.js` — task CRUD, detail and rendering.
- `js/features/projects.js` — projects.
- `js/features/wishlist.js` — purchases/wishes.
- `js/features/lists.js` — lists/sublists.
- `js/features/ideas.js` — ideas.
- `js/features/inbox.js` — uncategorised/inbox data.
- `js/features/capture.js` — current universal capture flow.
- `js/features/today.js` — Today ordering/recommendation integration.
- `js/features/task-capture.js` — task capture/check-in integration and drafts.
- `js/features/bucketlist-chores.js` — bucketlist/household flows.
- `js/features/finance-documents.js` — finance/documents.
- `js/features/settings.js` — settings and local data controls.
- `js/features/presentation.js` — presentation refinements.
- `js/features/consolidation.js` — current consolidation/runtime compatibility layer.

### Storage migration infrastructure

These files exist but are **not active product storage**:

- `js/storage/migration-core.js`
- `js/storage/indexeddb-shadow-adapter.js`
- `js/storage/storage-safety-seam.js`

`localStorage` remains the only active product read/write source. IndexedDB is shadow-only. No read-switch has been approved.

## Storage compatibility

The sixteen current localStorage key names in `js/core/storage.js` are a compatibility contract.

Do not:

- rename/remove keys;
- change persisted shapes destructively;
- activate a new read store;
- remove legacy data/code;

without an explicit migration plan, export, verification, rollback and exitgate.

See `docs/phase-1/storage-safety-seam-report.md`.

## Tests

Current Node tests run with:

```bash
node --test tests/*.test.js
```

Browser characterization/IndexedDB contract tests require an actual browser/Chromium-capable environment. A skipped browser suite is not equivalent to a green product gate.

## Run locally

The app needs no build step. Serve the repository root as static files and open it in a modern browser.

A general local option when Python is installed is:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Current architecture priorities

The current order is:

1. Continuity/documentation truth.
2. Storage-boundary enforcement.
3. Bootstrap/module seams.
4. Scalable localization foundation.
5. Design-system consolidation.
6. RAW Capture + provenance.
7. Domain identity + relations.
8. Connected Vault.
9. Decision Engine V2.
10. AI service boundary.
11. Cloud/auth/sync.
12. Entitlements/billing.

AI, cloud, accounts and subscriptions should not be wired directly into feature code before their service boundaries exist.

## Important design principles

- Capture before classification.
- Unknown remains unknown.
- Preserve provenance and reversibility.
- One external memory, not independent data silos.
- User remains the authority.
- AI is optional and replaceable, not the source of core product truth.
- GitHub, ChatGPT, backend, AI and billing providers must not become single points of failure.
- Prefer small reversible slices with explicit exitgates over broad rewrites.

## Continuity

Codex/ChatGPT may accelerate development but must not be required to understand or operate the repository. The repository itself must contain enough product truth, architecture rationale, tests and recovery documentation for a competent developer to continue without prior chat history.

See `docs/continuity/README.md` for the recovery and backup procedure.
