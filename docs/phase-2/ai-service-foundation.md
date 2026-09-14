# AI Service Foundation

Status: **provider-independent service boundary complete; no AI provider activated**

## Goal

Create the application-service seam required by the foundation architecture contract so LumiVault can use AI later without making any AI vendor, model, prompt, or API the owner of core product behavior or user truth.

## Implemented boundary

`js/services/ai-service.js` now defines a provider-independent service with explicit capabilities:

- `interpret-capture`
- `enrich-record`
- `suggest-relations`
- `explain-decision`
- `summarize`

Consumers call the same `createAIService(...).run(...)` contract regardless of the concrete provider adapter.

## Fail-closed behavior

With no provider configured, the service remains usable and reports `unavailable` rather than breaking the application. This preserves the architecture rule that LumiVault's core must continue to work without AI.

Unknown capabilities return `unsupported`. Provider errors are normalized to an error result instead of leaking vendor-specific behavior into product code.

## Provider independence

A provider adapter only needs to expose:

- a provider name;
- supported capabilities;
- availability;
- `invoke(request)`.

The boundary contains no concrete vendor, SDK, endpoint, credential, billing, storage, or network implementation. A future OpenAI or other provider adapter can therefore be added or replaced without changing the consumer contract.

## Provenance and ownership

Successful results return an explicit provenance envelope containing the provider, optional model identifier and caller-supplied request ID. Provider input is cloned before invocation so a provider cannot mutate caller-owned product records by reference.

The AI service deliberately does **not** persist interpretations, corrections or history. Durable provenance and user corrections must remain in LumiVault-owned data structures. AI output is therefore a proposal/result from an external service, not a new source of truth by itself.

## Scope boundary

This slice does not:

- connect to an AI vendor;
- add an API key or backend proxy;
- send user data over the network;
- modify Capture, Connected Vault or Decision Engine behavior;
- put deterministic core rules into prompts;
- add AI UI;
- add billing/entitlements;
- activate AI at runtime.

`js/services/ai-service.js` is intentionally dormant until a separately reviewed product integration loads and consumes it.

## Validation

GitHub Actions workflow run `34829907055` on commit `22164057c4d96f3dff7bac76f12af224f264c930`:

- `node-foundation-tests`: **success**
- `chromium-bootstrap-gate`: **success**

The Node gate includes `tests/ai-service-boundary.test.js`, protecting:

- fail-closed operation without a provider;
- provider interchangeability;
- capability enforcement;
- cloned provider inputs;
- explicit provider provenance;
- absence of vendor, storage, billing, network and Decision Engine implementation inside the service boundary.

The Chromium gate confirms the existing application still starts and behaves without any AI provider or AI runtime dependency.

## Exit gate

Achieved for the AI application-service boundary.

The next architecture slice remains separate: cloud/auth/sync boundaries. Connecting a real AI provider is not required for that work and should only happen with an explicit feature use case, privacy/data-flow design, backend credential strategy and activation gate.
