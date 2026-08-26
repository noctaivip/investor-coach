import fs from "node:fs";
const fail=m=>{console.error("FAIL:",m);process.exitCode=1};
const read=p=>fs.readFileSync(p,"utf8");
const app=read("app.js"),sw=read("sw.js"),data=read("data.js");
const manifest=JSON.parse(read("manifest.json"));
if(manifest.display!=="standalone")fail("manifest.display must be standalone");
for(const v of ["20.0.0"]){
 if(!sw.includes(v))fail("SW version mismatch");
 if(!read("config.js").includes(v))fail("config version mismatch");
}
if((app.match(/window\.addEventListener\(["']popstate/g)||[]).length!==1)fail("must have exactly one popstate handler");
if(app.includes("state.navStack="))fail("legacy duplicate navStack still present");
if(!app.includes("retentionCheckHtml"))fail("real retention check missing");
if(sw.includes('self.addEventListener("install", event => {\n  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));\n  self.skipWaiting();'))fail("SW must not force skipWaiting during install");
const ids=[...data.matchAll(/\{id:"([^"]+)",word:/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)fail("duplicate term ids");
if(!process.exitCode)console.log("OK: Investor Coach v20 release QA invariants passed.");
