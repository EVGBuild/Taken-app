# Domain Identity + Relations

Status: **foundation seam complete; regression gates green**

## Goal

Give LumiVault a durable way to refer to records across different product domains without collapsing tasks, projects, captures, purchases, lists and future knowledge objects into one universal `Item` model.

## Implemented seam

`js/core/storage.js` now defines:

- `DOMAIN_KEYS.relations` as a new foundation namespace outside the immutable legacy key set;
- `createDomainRef(type, id)` for typed identities such as `{ type: 'raw-capture', id: '...' }` or `{ type: 'inbox', id: '...' }`;
- `createDomainRelation(...)` for explicit typed edges;
- `linkDomainRelation(...)` for idempotent persistence;
- `domainRelationsFor(...)` for lookup by either endpoint.

Relation IDs are deterministic from relation kind and both typed endpoints. Repeating the same link therefore does not create duplicate edges.

## First real relation

Capture provenance now has an explicit relation in addition to the compatibility `rawCaptureId` field already present on unresolved Inbox and Bucketlist records:

`domain record --derived-from--> raw-capture`

This is deliberately additive. Existing domain records keep their own shapes and IDs. No generic Item envelope has been introduced into active product data.

## Compatibility and scope

This slice does **not**:

- change any of the 16 immutable legacy storage keys;
- change localStorage as the active product storage source;
- activate IndexedDB reads;
- migrate or delete legacy records;
- redesign Capture UI, Vault UI or the Decision Engine;
- introduce topics, automatic semantic relations, AI inference or Connected Vault UI yet;
- force all existing project/task relations into the new store immediately.

The relation store is a foundation seam for gradual adoption. Existing direct fields such as `projectId` remain authoritative for current product behavior until a separately tested migration/activation decision is made.

## Validation

GitHub Actions workflow run `34827412175` on commit `23a4a83b7200856e079fa404418b58690eafafa4`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

The Node gate includes `tests/domain-identity-relations.test.js`, which protects the non-legacy relation namespace, typed refs, absence of a universal Item model in this seam, and explicit RAW provenance links.

## Exit gate

Achieved.

LumiVault now has stable typed identity references and an explicit relation primitive that can connect domains without flattening them. The next architecture slice may build the first Connected Vault capabilities on this seam, while keeping existing product-domain storage and behavior intact.
