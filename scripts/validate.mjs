import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const exists=f=>fs.existsSync(path.join(root,f));

for(const f of ['index.html','styles.css','app.js','data.js','manifest.json','sw.js','config.js','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon-180.png','backend/worker.js','backend/schema.sql'])if(!exists(f))fail(`missing ${f}`);

const manifest=JSON.parse(read('manifest.json'));
if(manifest.display!=='standalone')fail('manifest display must be standalone');
if(!manifest.name||!manifest.short_name)fail('manifest name/short_name missing');
if(!Array.isArray(manifest.icons)||manifest.icons.length<3)fail('manifest icons incomplete');

const sw=read('sw.js'),cfg=read('config.js'),pkg=JSON.parse(read('backend/package.json'));
const swv=sw.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const cfgv=cfg.match(/version:\s*"([^"]+)"/)?.[1];
if(!swv||swv!==cfgv||swv!==pkg.version)fail(`version mismatch sw=${swv} config=${cfgv} backend=${pkg.version}`);

const html=read('index.html');
for(const marker of ['lang="ru"','class="skip-link"','id="mainContent"','aria-label="Основная навигация"','aria-label="Мобильная навигация"','aria-live="polite"'])if(!html.includes(marker))fail(`accessibility marker missing: ${marker}`);

const worker=read('backend/worker.js');
for(const endpoint of ['/healthz','/readyz','/api/account/reports/export','/scim/v2/'])if(!worker.includes(endpoint))fail(`backend endpoint missing: ${endpoint}`);
for(const h of ['X-Content-Type-Options','X-Frame-Options','Referrer-Policy'])if(!worker.includes(h))fail(`security header missing: ${h}`);
if(!worker.includes('GET,POST,DELETE,OPTIONS'))fail('CORS methods must allow DELETE for SCIM token revocation');

function pngSize(file){const b=fs.readFileSync(path.join(root,file));if(b.toString('ascii',1,4)!=='PNG')throw new Error(`${file} is not PNG`);return [b.readUInt32BE(16),b.readUInt32BE(20)]}
for(const [f,w,h] of [['icons/icon-192.png',192,192],['icons/icon-512.png',512,512],['icons/icon-maskable-512.png',512,512],['icons/apple-touch-icon-180.png',180,180]]){const [x,y]=pngSize(f);if(x!==w||y!==h)fail(`${f} expected ${w}x${h}, got ${x}x${y}`)}

for(const marker of ['X-Request-Id','rate_limited','http_request'])if(!worker.includes(marker))fail(`observability marker missing: ${marker}`);
if(!exists('backend/migrations/0006_observability_rate_limits.sql'))fail('missing v9.2 rate-limit migration');
if(!exists('backend/scripts/backup_d1.sh')||!exists('backend/scripts/restore_d1.sh'))fail('missing D1 backup/restore scripts');

if(!process.exitCode)console.log(`OK: Investor Coach ${swv} static production validation passed.`);
