# Cloud / Auth / Sync Foundation

Status: **provider-neutral service boundaries complete; no cloud activation**

## Goal

Prepare LumiVault for future accounts, remote backup and multi-device sync without making the product dependent on any backend or identity vendor.

## Added boundaries

### `js/services/auth-service.js`

Defines the application-facing authentication contract:

- status/session inspection;
- sign-in;
- sign-out;
- provider replacement without changing consumers.

With no provider configured it fails closed and reports `unavailable`.

### `js/services/sync-service.js`

Defines the provider-neutral sync contract:

- push a local snapshot;
- pull a remote snapshot as a preview;
- request bidirectional reconciliation.

Bidirectional sync is deliberately blocked until an explicit conflict resolver is supplied. Even with a resolver, the service returns a **preview** rather than silently applying merged data. This keeps conflict strategy and activation separate from transport.

### `js/services/cloud-backup-service.js`

Defines optional remote backup behavior:

- create a remote backup copy;
- list backups;
- read a backup as a restore preview.

Cloud backup is explicitly not the active product datastore and restore is not automatically applied.

## Safety rules preserved

- local product data remains authoritative;
- `localStorage` remains the only active product source;
- no IndexedDB read-switch;
- no automatic cloud write or sync;
- no account requirement to start or use the core app;
- no provider SDK, API key or network implementation;
- no backend vendor name or vendor-specific model in the service contract;
- no automatic conflict merge;
- no automatic restore from remote data;
- no billing or entitlement logic mixed into auth/sync/cloud services.

## Validation

`tests/cloud-auth-sync-boundary.test.js` protects:

- fail-closed auth without a provider;
- swappable auth adapters;
- local-only sync without a provider;
- blocked bidirectional sync without conflict strategy;
- preview-only reconciliation when a conflict resolver exists;
- optional cloud backup with preview-only restore;
- absence of vendor, storage, UI, billing and direct network implementation inside these boundaries.

GitHub Actions run `34830482443` on commit `620a0659dde9d7cc8e00f497e0aff3eb65aae137`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

## Activation status

**Not activated.**

No account system, backend, cloud provider, remote backup or multi-device sync is connected to the running product. These files establish replaceable application-service seams only.

## Exit gate

Achieved for the Cloud / Auth / Sync foundation. A future provider integration must be a separate slice with data model/versioning, authentication security, encryption/privacy, conflict policy, offline behavior, migration/rollback and a dedicated activation gate.
