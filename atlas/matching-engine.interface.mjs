export function createConfiguredMatchingEngine(){
 if(process.env.TRAVELOS_MATCHING_URL){
  return {async executeMatching(destination,durationDays,budgetGbp){
   const r=await fetch(process.env.TRAVELOS_MATCHING_URL,{method:"POST",headers:{"content-type":"application/json","authorization:`Bearer ${process.env.TRAVELOS_MATCHING_KEY||""}`},body:JSON.stringify({destination,duration_days:durationDays,budget_gbp:budgetGbp})});
   if(!r.ok)throw new Error(`matching_provider_http_${r.status}`);
   return await r.json();
  }};
 }
 return {async executeMatching(){throw new Error("matching_provider_not_configured")}};
}