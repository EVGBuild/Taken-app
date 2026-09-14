# Connected Vault Foundation

Status: **foundation capability complete; Node and Chromium gates green**

## Goal

Turn Vault search from collection-name filtering into a first connected-memory capability, using the typed identity and relation seam without redesigning the Vault UI or introducing AI.

## Implemented

`js/core/navigation.js` now builds a typed cross-domain Vault index over the current runtime data:

- tasks, with household tasks kept distinguishable from ordinary Masterlist tasks;
- projects;
- purchases/wishlist;
- lists and list entries;
- ideas;
- bucketlist groups and entries;
- unresolved Inbox captures;
- finance records;
- documents and useful searchable metadata.

`searchConnectedVault(query)` searches the content of those records rather than collection labels. Every result retains a typed domain reference and includes explicit relations from `lumiDomainRelations`.

The existing Vault search field now uses this index to determine which collection cards contain matching content. Collection-name matching remains supported but is secondary to content matching.

## Browser proof

The Chromium gate seeds the legacy fixture and searches for `garantieaanvraag`. That word exists in a task, not in the collection name `Masterlist`. The browser verifies that:

- connected search returns the typed task `legacy-waiting`;
- the Masterlist collection remains visible because its content matched;
- normal Vault → Masterlist → Vault navigation still works;
- no page errors occur.

The capture browser test also verifies that a newly unresolved `Ted trimmen` capture is discoverable through connected search and that its result carries the `derived-from` relation back to the RAW Capture.

## Boundaries preserved

This slice does **not**:

- introduce semantic/AI search;
- infer new relations automatically;
- add ranking or Decision Engine behavior;
- replace existing domain storage with a universal Item model;
- migrate legacy data;
- activate IndexedDB reads;
- redesign Vault search results or add a new results screen;
- change collection or lifecycle semantics.

The current UI still surfaces matching **collections**, not a dedicated list of direct item-level results. The underlying search contract now returns item-level typed results, so direct result navigation can be added later as a bounded presentation slice rather than another data-architecture rewrite.

## Validation

GitHub Actions workflow run `34828306589`, head `a7d6065aab622640091b48573cb485cad4f3e909`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

The Node gate includes `tests/connected-vault.test.js`.

## Exit gate

Achieved for the Connected Vault **foundation**: LumiVault can now query actual content across domains and preserve relation context. Full direct-result UX, semantic understanding and richer graph traversal remain later capabilities.
