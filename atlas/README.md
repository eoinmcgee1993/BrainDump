# My Travel Franchise / Atlas

Standalone premium travel-franchise landing site and TravelOS backend boundary.

LEXIS is intentionally untouched.

## Structure

- `index.html` premium franchise site
- `travelos.schema.json` ATLAS → TravelOS contract
- `netlify/functions/lead-handover.mjs` authenticated lead ingestion
- `netlify/functions/health.mjs` service health endpoint
- `supabase/migrations/` production database migration
- `tests/` contract tests

## Required production environment

- `TRAVELOS_INTERNAL_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must never be exposed to browser code.

## Deployment

Deploy this directory to the existing `my-travel-franchise` Netlify site. Do not create a second site.
