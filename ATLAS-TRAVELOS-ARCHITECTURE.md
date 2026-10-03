# ATLAS / TravelOS V2

## Boundary

ATLAS and TravelOS are standalone components of My Travel Franchise.

**LEXIS is untouched and out of scope. Hugging Face is not a production dependency.**

## Product flow

```
Customer
  ↓
ATLAS
  ↓
Authenticated lead handover
  ↓
TravelOS
  ├── validation
  ├── idempotency
  ├── lead record
  ├── scoring state
  └── immutable event
        ↓
   matching provider
        ↓
   proposal engine
        ↓
   franchisee
        ↓
   customer
```

The franchisee owns the customer relationship. The platform provides infrastructure around that relationship.

## Runtime boundaries

### ATLAS

Responsible for:

- customer conversation
- structured travel intake
- lead qualification
- lead scoring signals
- handover contract

### TravelOS

Responsible for:

- validation
- persistence
- idempotency
- event processing
- matching provider orchestration
- proposal generation
- franchisee workflow
- auditability
- operational telemetry

### Matching provider

A provider abstraction sits between TravelOS and supplier/inventory systems.

TravelOS must never fabricate:

- availability
- supplier inventory
- pricing
- booking confirmation

If no matching provider is configured, the proposal worker remains idle.

## AI boundary

AI is an implementation detail, not the product architecture.

Future model providers can sit behind an internal AI/model gateway for:

- trip requirement extraction
- classification
- semantic matching
- proposal drafting

The core database, authorization, idempotency and commercial state machine remain deterministic.

## Deployment boundary

Production target:

- Netlify project: `my-travel-franchise`
- site source: `atlas/`
- serverless functions: `atlas/netlify/functions/`
- database: dedicated non-LEXIS Supabase project

The root `netlify.toml` explicitly sets the Atlas package as the deployment base for this monorepo.

## Production acceptance

- Static homepage works on desktop and mobile.
- Security headers are present.
- Health endpoint returns 200.
- Lead handover rejects unauthenticated requests.
- Schema validation rejects malformed payloads.
- Duplicate session IDs cannot create duplicate leads.
- Events are persisted for accepted leads.
- Worker is scheduled and remains idle without provider credentials.
- Proposal generation requires a real matching-provider response.
- Database RPC execution is restricted.
- LEXIS remains unchanged.
