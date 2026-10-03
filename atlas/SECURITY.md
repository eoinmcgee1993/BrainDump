# ATLAS / TravelOS security boundary

## Scope

ATLAS and TravelOS are standalone. **LEXIS is explicitly out of scope and must not be modified.**

Hugging Face is not required for the production path.

## Secrets

These values are server-only Netlify environment variables:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TRAVELOS_INTERNAL_KEY
- TRAVELOS_MATCHING_URL
- TRAVELOS_MATCHING_KEY

The browser never receives service-role credentials or the internal handover key.

## API controls

- Lead handover is POST-only.
- Lead handover requires a bearer secret.
- Lead handover is rate-limited by Netlify.
- Payloads are validated against a strict JSON Schema.
- `session_id` is unique at the database layer for idempotency.
- Duplicate submissions are recorded as `lead.duplicate` events rather than creating a second lead.
- Secrets are read at runtime and are never hardcoded.

## Database controls

TravelOS tables use RLS. Franchisee reads are scoped by the authenticated JWT franchisee claim. Service-role access remains server-side.

Database functions used by the worker should have execution privileges restricted to the roles that actually need them. Supabase's current security guidance notes that functions are executable by default unless execution is explicitly revoked, so function grants belong in the production database hardening checklist.

## Supplier data integrity

The matching layer is a provider boundary. If it is not configured, the proposal worker remains idle. No supplier inventory, pricing or availability is fabricated.

## Observability

Every accepted handover gets a request ID and trace ID. Event failures are retained for retry/dead-letter handling.

## Browser security

The Netlify site ships restrictive baseline headers including frame denial, content-type sniffing protection, referrer policy and a same-origin content security policy.