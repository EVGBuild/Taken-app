# Agent Runtime Spike

Purpose: prove Cloudflare Workers + D1 + OpenAI Agents SDK + Zod before building the full runtime.

## Exitgate
- Worker bundles/runs with Agents SDK.
- OPENAI_API_KEY is a Worker secret, never browser code.
- D1 stores one run and structured result.
- Product Architect returns schema-valid output.
- No existing Elise HQ frontend/product code is changed.

## Setup
1. npm install
2. Create a D1 database and replace REPLACE_AFTER_D1_CREATE in wrangler.toml.
3. Apply migrations/0001_runs.sql to D1.
4. Set OPENAI_API_KEY with Wrangler secret management.
5. npm run typecheck && npm test
6. npm run dev and POST JSON {"user_request":"..."} to the Worker.

This branch is a spike only. Do not merge as production runtime until the exitgate is independently verified.
