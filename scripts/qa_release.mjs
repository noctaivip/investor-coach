import fs from "node:fs";
const fail=m=>{console.error("FAIL:",m);process.exitCode=1};
const read=p=>fs.readFileSync(p,"utf8");
const app=read("app.js"),sw=read("sw.js"),data=read("data.js");
const manifest=JSON.parse(read("manifest.json"));
if(manifest.display!=="standalone")fail("manifest.display must be standalone");
for(const v of ["27.0.0"]){
 if(!sw.includes(v))fail("SW version mismatch");
 if(!read("config.js").includes(v))fail("config version mismatch");
}
if((app.match(/window\.addEventListener\(["']popstate/g)||[]).length!==1)fail("must have exactly one popstate handler");
if(app.includes("state.navStack="))fail("legacy duplicate navStack still present");
if(!app.includes("retentionCheckHtml"))fail("real retention check missing");
if(sw.includes('self.addEventListener("install", event => {\n  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));\n  self.skipWaiting();'))fail("SW must not force skipWaiting during install");
const ids=[...data.matchAll(/\{id:"([^"]+)",word:/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)fail("duplicate term ids");

if(!app.includes("Pilot Data Integrity + Session Resume v25"))fail("v25 persistence layer missing");
if(!app.includes("persistStateSafe"))fail("safe state persistence missing");
if(!app.includes("checkpointSession"))fail("session checkpoint missing");
if(!app.includes("sessionResumeHtml"))fail("investor session resume UI missing");
if((app.match(/window\.addEventListener\(["']popstate/g)||[]).length!==1)fail("must retain one popstate handler");


if(!app.includes("Pilot Instrumentation v26"))fail("pilot instrumentation missing");
if(!app.includes("pilotSessionMinutes"))fail("pilot session duration metric missing");
if(!app.includes("pilotCoachAccuracy"))fail("pilot Coach accuracy metric missing");
if(!app.includes("schemaVersion=26"))fail("state schema version mismatch");
if(!app.includes("pilotMetricSummary"))fail("pilot summary missing");
if(!app.includes("exportPilotMetrics"))fail("pilot report export missing");
if(!app.includes('pilotEvent("coach_answer"'))fail("Coach instrumentation missing");
if(!app.includes('pilotEvent("ai_evaluation"'))fail("AI evaluation instrumentation missing");
if(app.includes('pilotEvent("ai_evaluation",{mode:String(mode||""),score,userText'))fail("pilot telemetry must not store transcript text");

if(!process.exitCode)console.log("OK: Investor Coach v27 release QA invariants passed.");
