import {createClient} from "@supabase/supabase-js";
export async function recordSpan({traceId,sessionId,spanName,serviceId="atlas-travelos",metadata={}}){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return;
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
 const now=Date.now();
 await db.from("telemetry_traces").insert({trace_id:traceId,session_id:sessionId,span_name:spanName,timestamp_epoch_ms:now,timestamp_utc:new Date(now).toISOString(),service_id:serviceId,metadata});
}