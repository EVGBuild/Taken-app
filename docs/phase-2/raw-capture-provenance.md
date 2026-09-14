# RAW Capture + Provenance

Status: closed

## Goal

Make capture safe before classification. User-entered text must be durably stored first, before LumiVault decides whether it is a task, project, purchase, idea, list, household item, bucket-list item, or still unknown.

## Implemented boundary

- Added a dedicated `CAPTURE_KEYS.raw` storage namespace: `lumiRawCaptures`.
- The new key is intentionally outside the immutable legacy `KEYS` set so the existing 16-key legacy export/migration contract remains unchanged.
- Universal Capture writes the raw user text through the active `StorageGateway` on input, before type selection.
- Each RAW record keeps a stable ID, exact entered text, source, timestamps, status, and selected type.
- Classification updates the RAW record instead of replacing or deleting it.
- `unknown` is a valid first-class state again. It is no longer removed by consolidation code.
- Choosing `unknown` stores the unresolved item in the existing Inbox and links it back with `rawCaptureId`.
- Bucket-list items created directly from Capture also retain `rawCaptureId`.

## RAW record shape

Current foundation shape:

```js
{
  id,
  rawText,
  source: 'user',
  status: 'raw' | 'classified' | 'unresolved',
  selectedType: null | type,
  createdAt,
  updatedAt,
  classifiedAt?
}
```

This is deliberately small. Rich domain identity and generic relations belong to the next foundation slice rather than being invented inside Capture.

## Safety constraints preserved

- `localStorage` remains the only active product store.
- All RAW writes go through the active StorageGateway.
- IndexedDB remains shadow-only; no read-switch was introduced.
- The legacy 16-key storage/export contract was not changed.
- No Recommendation Engine changes.
- No visual redesign.
- No AI dependency was introduced.

## Regression protection

`tests/raw-capture-provenance.test.js` guards that:

- RAW data uses a dedicated non-legacy storage namespace;
- text is persisted before the classification overlay opens;
- unresolved capture remains available;
- provenance linkage is present.

The Chromium gate additionally performs the real flow:

1. open Capture;
2. type `Ted trimmen`;
3. verify `lumiRawCaptures` already contains the text while it is still unclassified;
4. continue to type selection;
5. choose `Weet ik nog niet`;
6. verify the RAW record becomes `unresolved`;
7. verify the Inbox item points back to the RAW record with `rawCaptureId`.

## Validation

Foundation regression run for commit `256038395ba761dd8bdc2dd5ba121a90b7365f16`:

- Node foundation tests: success
- Chromium bootstrap/navigation/capture gate: success
- Browser page errors in tested flows: none

## Exit gate

PASS.

The required chain now starts as:

`Gedachte → durable RAW Capture → classification / unresolved → product object`

The next slice is Domain Identity + Relations. It should generalize stable identity and source relationships across domain objects without flattening everything into one universal Item model.
