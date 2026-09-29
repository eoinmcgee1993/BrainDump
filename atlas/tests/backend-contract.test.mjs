import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const schema=JSON.parse(fs.readFileSync(new URL("../travelos.schema.json",import.meta.url),"utf8"));
const valid={session_id:"f81d4fae-7dec-11d0-a765-00a0c91e6bf6",franchisee_id:"fr_test",timestamp:"2026-09-29T05:00:00Z",customer_profile:{first_name:"David",email:"david@example.com"},trip_parameters:{destination:"Thailand",duration_days:14,est_budget_gbp:12000,travelers:{adults:2,children:0}},lead_scoring:{priority_level:"HIGH",confidence_score:.92,intent_signals:["Budget verified"]},action_items:{suggested_next_step:"Review proposal",pre_rendered_proposal_id:"prop_test"}};
test("valid fixture satisfies required contract keys",()=>{for(const k of schema.required)assert.ok(k in valid)});
test("strict schema boundaries are enabled",()=>{assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.customer_profile.additionalProperties,false);assert.equal(schema.properties.trip_parameters.additionalProperties,false)});
test("score range is bounded",()=>{const x=schema.properties.lead_scoring.properties.confidence_score;assert.equal(x.minimum,0);assert.equal(x.maximum,1)});
