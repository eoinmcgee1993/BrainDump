import { timingSafeEqual as safeCompare } from "node:crypto";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { createClient } from "@supabase/supabase-js";
import schema from "../../travelos.schema.json" with { type: "json" };

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" }
});

function getEnv(name) {
  return globalThis.Netlify?.env?.get?.(name) ?? process.env[name];
}

function authorized(req) {
  const expected = getEnv("TRAVELOS_INTERNAL_KEY");
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || supplied.length !== expected.length) return false;
  return safeCompare(new TextEncoder().encode(supplied), new TextEncoder().encode(expected));
}

export default async function handler(req) {
  const requestId = crypto.randomUUID();

  if (req.method !== "POST") return json({ error: "method_not_allowed", request_id: requestId }, 405);
  if (!authorized(req)) return json({ error: "unauthorized", request_id: requestId }, 401);

  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json", request_id: requestId }, 400);
  }

  if (!validate(payload)) {
    return json({ error: "schema_validation_failed", request_id: requestId, details: validate.errors }, 422);
  }

  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "travelos_backend_not_configured", request_id: requestId }, 503);

  const db = createClient(url, key);
  const traceId = crypto.randomUUID();

  const leadPayload = payload;
  const leadRow = {
    session_id: leadPayload.session_id,
    franchisee_id: leadPayload.franchisee_id,
    captured_at: leadPayload.timestamp,
    first_name: leadPayload.customer_profile.first_name,
    last_name: leadPayload.customer_profile.last_name ?? null,
    email: leadPayload.customer_profile.email,
    phone: leadPayload.customer_profile.phone ?? null,
    existing_client_id: leadPayload.customer_profile.existing_client_id ?? null,
    destination: leadPayload.trip_parameters.destination,
    duration_days: leadPayload.trip_parameters.duration_days,
    estimated_budget_gbp: leadPayload.trip_parameters.est_budget_gbp,
    travelers: leadPayload.trip_parameters.travelers,
    preferences: leadPayload.trip_parameters.preferences ?? null,
    memory_vector_references: leadPayload.trip_parameters.memory_vector_references ?? null,
    priority_level: leadPayload.lead_scoring.priority_level,
    confidence_score: leadPayload.lead_scoring.confidence_score,
    intent_signals: leadPayload.lead_scoring.intent_signals,
    scoring_version: "v2.0.0",
    suggested_next_step: leadPayload.action_items.suggested_next_step,
    followup_at: leadPayload.action_items.auto_followup_scheduled ?? null
  };

  const { data: lead, error: insertError } = await db
    .from("travelos_leads")
    .insert(leadRow)
    .select("id,session_id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing, error: lookupError } = await db
        .from("travelos_leads")
        .select("id,session_id")
        .eq("session_id", leadPayload.session_id)
        .maybeSingle();

      if (lookupError || !existing) {
        return json({ error: "duplicate_lookup_failed", request_id: requestId, trace_id: traceId }, 500);
      }

      await db.from("travelos_events").insert({
        trace_id: traceId,
        event_type: "lead.duplicate",
        aggregate_id: existing.id,
        session_id: leadPayload.session_id,
        payload: { request_id: requestId }
      });

      return json({
        accepted: true,
        duplicate: true,
        lead_id: existing.id,
        session_id: existing.session_id,
        trace_id: traceId,
        request_id: requestId
      }, 202);
    }

    return json({ error: "lead_insert_failed", request_id: requestId, trace_id: traceId }, 500);
  }

  const { error: eventError } = await db.from("travelos_events").insert({
    trace_id: traceId,
    event_type: "lead.received",
    aggregate_id: lead.id,
    session_id: lead.session_id,
    payload: leadPayload
  });

  if (eventError) {
    return json({
      accepted: true,
      processed: false,
      lead_id: lead.id,
      trace_id: traceId,
      request_id: requestId,
      warning: "lead_saved_event_failed"
    }, 202);
  }

  return json({
    accepted: true,
    processed: true,
    lead_id: lead.id,
    session_id: lead.session_id,
    trace_id: traceId,
    request_id: requestId
  }, 202);
}

export const config = {
  path: "/api/v1/lead-handover",
  method: "POST",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};