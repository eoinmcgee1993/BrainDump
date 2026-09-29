import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const schema=JSON.parse(fs.readFileSync(new URL("../travelos.schema.json",import.meta.url),"utf8"));
test("strict top-level contract",()=>assert.equal(schema.additionalProperties,false));
test("strict nested contracts",()=>{assert.equal(schema.properties.customer_profile.additionalProperties,false);assert.equal(schema.properties.trip_parameters.additionalProperties,false)});
test("required fields",()=>{for(const f of schema.required)assert.ok(f)});
test("score bounds",()=>{const s=schema.properties.lead_scoring.properties.confidence_score;assert.equal(s.minimum,0);assert.equal(s.maximum,1)});
test("session is UUID",()=>assert.equal(schema.properties.session_id.format,"uuid"));