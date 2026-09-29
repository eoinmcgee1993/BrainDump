import Ajv from "ajv";
import addFormats from "ajv-formats";
import { createClient } from "@supabase/supabase-js";
import schema from "../../travelos.schema.json" with { type: "json" };

const ajv=new Ajv({allErrors:true,strict:true}); addFormats(ajv); const validate=ajv.compile(schema);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
function authorized(req){const key=process.env.TRAVELOS_INTERNAL_KEY;if(!key)return false;return req.headers.get("authorization")==="Bearer "+key;}

export default async function handler(req){
 const requestId=crypto.randomUUID();
 if(req.method!=="POST")return json({error:"method_not_allowed",request_id:requestId},405);
 if(!authorized(req))return json({error:"unauthorized",request_id:requestId},401);
 let payload; try{payload=await req.json()}catch{return json({error:"invalid_json",request_id:requestId},400)}
 if(!validate(payload))return json({error:"schema_validation_failed",request_id:requestId,details:validate.errors},422);
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json({error:"travelos_backend_not_configured",request_id:requestId},503);
 const db=createClient(url,key),traceId=crypto.randomUUID();
 const {data:existing,error:lookup}=await db.from("travelos_leads").select("id,session_id").eq("session_id",payload.session_id).maybeSingle();
 if(lookup)return json({error:"database_lookup_failed",request_id:requestId,trace_id:traceId},500);
 if(existing){await db.from("travelos_events").insert({trace_id:traceId,event_type:"lead.duplicate",aggregate_id:existing.id,session_id:payload.session_id,payload:{request_id:requestId}});return json({accepted:true,duplicate:true,lead_id:existing.id,trace_id:traceId,request_id:requestId})}
 const p=payload;
 const {data:lead,error:insert}=await db.from("travelos_leads").insert({
  session_id:p.session_id,franchisee_id:p.franchisee_id,captured_at:p.timestamp,
  first_name:p.customer_profile.first_name,last_name:p.customer_profile.last_name??null,email:p.customer_profile.email,
  phone:p.customer_profile.phone??null,existing_client_id:p.customer_profile.existing_client_id??null,
  destination:p.trip_parameters.destination,duration_days:p.trip_parameters.duration_days,
  estimated_budget_gbp:p.trip_parameters.est_budget_gbp,travelers:p.trip_parameters.travelers,
  preferences:p.trip_parameters.preferences??null,memory_vector_references:p.trip_parameters.memory_vector_references??null,
  priority_level:p.lead_scoring.priority_level,confidence_score:p.lead_scoring.confidence_score,
  intent_signals:p.lead_scoring.intent_signals,scoring_version:"v1.0.0",
  suggested_next_step:p.action_items.suggested_next_step,followup_at:p.action_items.auto_followup_scheduled??null
 }).select("id,session_id").single();
 if(insert)return json({error:"lead_insert_failed",request_id:requestId,trace_id:traceId},500);
 const {error:event}=await db.from("travelos_events").insert({trace_id:traceId,event_type:"lead.received",aggregate_id:lead.id,session_id:p.session_id,payload:p});
 if(event)return json({accepted:true,processed:false,lead_id:lead.id,trace_id:traceId,warning:"lead_saved_event_failed"},202);
 return json({accepted:true,processed:true,lead_id:lead.id,session_id:lead.session_id,trace_id:traceId,request_id:requestId},202);
}