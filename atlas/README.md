# My Travel Franchise / ATLAS

ATLAS is the customer-facing opportunity layer for My Travel Franchise. TravelOS is the operating system behind the franchise workflow.

**LEXIS is completely out of scope and must not be modified. Hugging Face is not a production dependency.**

## V2 structure

- `index.html` premium customer-facing franchise site
- `travelos.schema.json` strict ATLAS → TravelOS lead contract
- `netlify/functions/lead-handover.mjs` authenticated, rate-limited ingestion
- `netlify/functions/health.mjs` health endpoint
- `netlify/functions/matching-engine.mjs` provider abstraction for live matching
- `netlify/functions/proposal-worker.mjs` scheduled proposal processor
- `supabase/migrations/` database schema and RLS
- `tests/` contract tests
- `SECURITY.md` security boundary

## Runtime contract

Customer → ATLAS → authenticated lead handover → TravelOS lead → event queue → matching provider → proposal → franchisee.

The franchisee remains the relationship owner.

## Required production environment

- `TRAVELOS_INTERNAL_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

For live supplier matching:

- `TRAVELOS_MATCHING_URL`
- `TRAVELOS_MATCHING_KEY`

The matching provider is deliberately an interface. The application must not invent supplier inventory, pricing or availability.

## Deployment

The production target is the existing `my-travel-franchise` Netlify project. Do not create a second site.

The site is isolated from LEXIS.

Before enabling the backend, apply the TravelOS migration to the dedicated non-LEXIS database and configure the server-only environment variables in Netlify.

Netlify Scheduled Functions only execute on published deploys, so the proposal worker should be verified from the production Functions view after deployment.

## V2 acceptance gates

1. Homepage renders correctly on desktop and mobile.
2. `/api/health` returns HTTP 200.
3. Unauthenticated lead handover returns HTTP 401.
4. Invalid lead payload returns HTTP 422.
5. Valid lead handover returns HTTP 202.
6. Repeated `session_id` does not create a second lead.
7. Queue event is created exactly once for the accepted lead.
8. Worker stays idle when matching provider credentials are absent.
9. Live proposals are only generated from a configured provider response.
10. LEXIS files and services remain untouched.