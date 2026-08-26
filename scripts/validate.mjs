import fs from "node:fs";
function fail(m){console.error("FAIL:",m);process.exitCode=1}
function exists(x){return fs.existsSync(x)}
for(const f of ["index.html","app.js","data.js","styles.css","manifest.json","sw.js","config.js","backend/worker.js"])if(!exists(f))fail(`missing ${f}`);
const manifest=JSON.parse(fs.readFileSync("manifest.json","utf8"));
if(manifest.display!=="standalone")fail("manifest display must be standalone");
const sw=fs.readFileSync("sw.js","utf8"),cfg=fs.readFileSync("config.js","utf8"),worker=fs.readFileSync("backend/worker.js","utf8");
const m=sw.match(/APP_VERSION\s*=\s*"([^"]+)"/),c=cfg.match(/version\s*:\s*"([^"]+)"/);
if(!m||!c||m[1]!==c[1])fail("version mismatch");
for(const marker of ["/api/transcribe","/api/coach","/healthz","/readyz"])if(!worker.includes(marker))fail(`backend missing ${marker}`);
if(!process.exitCode)console.log(`OK: Investor Coach ${m?.[1]||"?"} learning build validation passed.`);
