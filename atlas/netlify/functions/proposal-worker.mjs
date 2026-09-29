import { createClient } from "@supabase/supabase-js";
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const WORKER_ID=process.env.INSTANCE_ID||"atlas-worker";
export async function processNextEvent(matchingEngine){
 const {data:event,error}=await db.rpc("claim_next_travelos_event",{p_worker_id:WORKER_ID,p_lease_duration_seconds:60});
 if(error||!event?.length)return false;
 const e=event[0];
 try{
  const lead=e.payload;
  const match=await matchingEngine.executeMatching(lead.trip_parameters.destination,lead.trip_parameters.duration_days,lead.trip_parameters.est_budget_gbp);
  const budget=Number(lead.trip_parameters.est_budget_gbp);
  const options=["CORE","UPGRADED","PREMIUM"].map((tier,i)=>({tier,title:`${lead.trip_parameters.duration_days}-Day ${lead.trip_parameters.destination} ${tier} Journey`,total_gbp:Math.round(budget*match.tier_multipliers[tier]),itinerary:match.base_itinerary_template,inclusions:match.inclusions?.[tier]||[],exclusions:match.exclusions?.[tier]||[]}));
  const {data:proposal,error:commitError}=await db.rpc("commit_proposal_transaction",{p_lead_id:e.aggregate_id,p_session_id:e.session_id,p_source_event_id:e.id,p_options:options,p_source_snapshot:{captured_at_handover:lead.timestamp,matched_suppliers:match.matched_suppliers,tier_multipliers:match.tier_multipliers},p_engine_version:"v1.0.0"});
  if(commitError)throw commitError;
  return {ok:true,proposal_id:proposal,event_id:e.id};
 }catch(err){
  const terminal=e.attempts>=e.max_attempts;
  await db.from("travelos_events").update({status:terminal?"DEAD_LETTER":"PENDING",last_error:String(err?.message||err),locked_at:null}).eq("id",e.id);
  return {ok:false,event_id:e.id,error:String(err?.message||err),dead_letter:terminal};
 }
}

export default async()=>new Response(JSON.stringify({service:"atlas-proposal-worker",status:"deployed-code"}),{headers:{"content-type":"application/json"}});