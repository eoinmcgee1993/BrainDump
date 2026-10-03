-- TravelOS V2 hardening. Safe to apply after 20260929130000_travelos.sql.

alter table public.travelos_leads
  add column if not exists preferred_dates jsonb,
  add column if not exists pre_rendered_proposal_id text;

create index if not exists idx_travelos_leads_franchisee_status
  on public.travelos_leads(franchisee_id, status, created_at desc);

create index if not exists idx_travelos_leads_email
  on public.travelos_leads(email);

-- The service API is the only intended writer. Franchisees receive read-only access.
revoke all on table public.travelos_leads from anon;
revoke all on table public.travelos_events from anon, authenticated;
revoke all on table public.telemetry_traces from anon, authenticated;

grant select on table public.travelos_leads to authenticated;
grant select on table public.travelos_proposals to authenticated;

-- Worker RPCs are internal database operations. Supabase functions are otherwise
-- executable by default, so execution is explicitly narrowed.
revoke execute on function public.claim_next_travelos_event(text, integer) from public, anon, authenticated;
revoke execute on function public.commit_proposal_transaction(uuid, uuid, uuid, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_next_travelos_event(text, integer) to service_role;
grant execute on function public.commit_proposal_transaction(uuid, uuid, uuid, jsonb, jsonb, text) to service_role;

-- Trigger helper is not an API surface.
revoke execute on function public.set_updated_at_timestamp() from public, anon, authenticated, service_role;