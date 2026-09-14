# Entitlements / Billing Foundation

Status: **provider-independent entitlement boundary complete; no billing provider activated**

## Goal

Prepare LumiVault for future subscriptions and paid capabilities without spreading billing-provider logic through product features and without making the local core depend on payment state.

## Boundary

`js/services/entitlement-service.js` defines a central product capability contract:

- `coreLocal`
- `aiAssist`
- `cloudSync`
- `cloudBackup`
- `extendedStorage`

Product code can later ask whether a capability is available. A billing adapter may translate a subscription or purchase into an entitlement snapshot, but provider-specific plans, products and identifiers stay outside the product/domain layer.

## Safety rules

- the local LumiVault core is always available and cannot be disabled by billing state;
- absent billing provider means local core works and paid capabilities fail closed;
- provider failure preserves the local core and does not silently grant paid capabilities;
- unknown capability names are rejected centrally;
- the boundary performs no storage access and no network calls itself;
- there is no Stripe, Paddle, RevenueCat or other vendor implementation;
- no existing product feature is paywalled in this slice.

## Validation

GitHub Actions workflow run `34831091263` on commit `220a3287414bce39788ca7354369ed185aa8e5d2`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

The Node gate includes `tests/entitlement-service-boundary.test.js`, which protects local-core availability, provider translation, provider-failure behavior, unknown-capability rejection and absence of vendor/storage/network/product-engine coupling.

## Activation status

No billing provider is connected and no subscription UI, checkout flow, pricing model or entitlement-gated product behavior has been activated.

## Exit gate

Achieved for the Entitlements / Billing foundation boundary.

With Storage, application seams, i18n, design ownership, RAW capture/provenance, relations, Connected Vault, Decision Engine V2, AI Service, Cloud/Auth/Sync and Entitlements boundaries now established, the planned Phase 2 foundation sequence is structurally complete. Further work should begin from an explicit next product/release slice rather than silently extending foundation scope.
