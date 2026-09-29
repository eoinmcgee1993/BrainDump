# Atlas security boundary

LEXIS is out of scope and must not be modified by this project.

TravelOS server credentials are server-only Netlify environment variables. The browser never receives SUPABASE_SERVICE_ROLE_KEY or TRAVELOS_INTERNAL_KEY.

Production must configure:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TRAVELOS_INTERNAL_KEY
- TRAVELOS_MATCHING_URL and TRAVELOS_MATCHING_KEY when live supplier matching is enabled.

No supplier inventory, pricing or availability is fabricated by the matching layer. Without a configured provider, proposal processing fails explicitly and can retry/dead-letter.
