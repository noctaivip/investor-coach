const JSON_HEADERS={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"no-referrer"};
const aiSchema={type:"object",additionalProperties:false,properties:{
 score:{type:"integer",minimum:0,maximum:100},
 verdict:{type:"string"},
 strengths:{type:"array",items:{type:"string"}},
 improvements:{type:"array",items:{type:"string"}},
 red_flags:{type:"array",items:{type:"string"}},
 contradictions:{type:"array",items:{type:"string"}},
 model_answer:{type:"string"},
 next_question:{type:"string"},
 follow_up_reason:{type:"string"},
 memory_summary:{type:"string"},
 focus_topics:{type:"array",items:{type:"string"}},
 dimensions:{type:"object",additionalProperties:false,properties:{
  directness:{type:"integer",minimum:0,maximum:100},
  clarity:{type:"integer",minimum:0,maximum:100},
  evidence:{type:"integer",minimum:0,maximum:100},
  metrics:{type:"integer",minimum:0,maximum:100},
  terminology:{type:"integer",minimum:0,maximum:100},
  risk_handling:{type:"integer",minimum:0,maximum:100},
  structure:{type:"integer",minimum:0,maximum:100}
 },required:["directness","clarity","evidence","metrics","terminology","risk_handling","structure"]},
 session_complete:{type:"boolean"},
 session_summary:{type:"string"},
 next_drill:{type:"string",enum:["coach","speech","pitch","simulator","review"]}
},required:["score","verdict","strengths","improvements","red_flags","contradictions","model_answer","next_question","follow_up_reason","memory_summary","focus_topics","dimensions","session_complete","session_summary","next_drill"]};
function allowed(req,env){const o=req.headers.get("Origin")||"";const list=String(env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);return !o||list.includes(o)}
function headers(req,env){const h=new Headers(JSON_HEADERS),o=req.headers.get("Origin")||"";if(o&&allowed(req,env))h.set("Access-Control-Allow-Origin",o);h.set("Vary","Origin");h.set("Access-Control-Allow-Headers","Content-Type,Authorization,X-Request-Id");h.set("Access-Control-Allow-Methods","GET,POST,OPTIONS");return h}
function out(req,env,data,status=200,rid=""){const h=headers(req,env);if(rid)h.set("X-Request-Id",rid);return new Response(JSON.stringify(data),{status,headers:h})}
function requestId(req){const x=(req.headers.get("X-Request-Id")||"").trim();return /^[A-Za-z0-9._:-]{8,100}$/.test(x)?x:crypto.randomUUID()}
async function json(req){try{return await req.json()}catch{return {}}}
function outputText(r){if(typeof r.output_text==="string")return r.output_text;for(const x of r.output||[])for(const c of x.content||[])if(typeof c.text==="string")return c.text;return ""}
function instructions(mode){return `Ты — профессиональный Investor Coach и строгий тренер деловой речи. Язык ответа — русский, международные VC/SaaS термины оставляй в стандартной форме.

Главная задача — не похвалить пользователя, а быстро сделать его способным профессионально разговаривать с инвесторами. Не оценивай длину ответа как качество. Не выдумывай факты, цифры, клиентов или метрики пользователя.

Всегда оцени 7 навыков по шкале 0–100:
1) directness — ответил ли человек прямо на вопрос;
2) clarity — легко ли понять мысль;
3) evidence — есть ли доказательство/факт вместо общих слов;
4) metrics — корректны ли цифры, период, сегмент и определения там, где они нужны;
5) terminology — правильно ли употреблены профессиональные термины;
6) risk_handling — признаёт ли человек риск и умеет ли им управлять;
7) structure — логично ли построен ответ.

Режим: ${mode}.

Если режим sim:
- веди себя как опытный VC/investment committee interviewer;
- задавай РОВНО ОДИН следующий вопрос;
- follow-up должен исходить из слабого места, недоказанного утверждения или противоречия предыдущего ответа;
- не проходи по фиксированному списку, если предыдущий ответ требует углубления;
- сопоставляй текущий ответ с памятью и историей; реальные противоречия перечисляй в contradictions;
- не считай отсутствие универсальной benchmark-цифры ошибкой;
- если данных пользователя не хватает, прямо говори, какие данные нужны;
- session_complete=true только когда достигнут max_turns из context или разговор уже объективно покрывает ключевые риски; иначе false;
- session_summary при завершении: 2–4 предложения — что уже профессионально и что мешает реальной встрече.

Если режим coach:
- оцени только текущий термин и его применение;
- проверь, употреблён ли термин в правильном смысле;
- feedback должен добавлять новый вывод, а не повторять учебную карточку.

model_answer — короткий образец сильного ответа. Если у пользователя нет собственных цифр, используй placeholders вроде «[ваш CAC]», а не выдуманные значения.
next_drill выбери по главному дефициту навыка.`}
export default {async fetch(req,env){const rid=requestId(req),url=new URL(req.url),started=Date.now();try{
 if(req.method==="OPTIONS"){if(!allowed(req,env))return out(req,env,{error:"origin_not_allowed"},403,rid);return new Response(null,{status:204,headers:headers(req,env)})}
 if(!allowed(req,env))return out(req,env,{error:"origin_not_allowed"},403,rid);
 if(url.pathname==="/healthz")return out(req,env,{ok:true,service:"investor-coach-ai",version:"11.0.0"},200,rid);
 if(url.pathname==="/readyz")return out(req,env,{ok:!!env.OPENAI_API_KEY,openaiConfigured:!!env.OPENAI_API_KEY,version:"11.0.0"},env.OPENAI_API_KEY?200:503,rid);
 if(url.pathname==="/api/transcribe"&&req.method==="POST"){if(!env.OPENAI_API_KEY)return out(req,env,{error:"ai_not_configured"},503,rid);const incoming=await req.formData(),file=incoming.get("file");if(!file||typeof file==="string")return out(req,env,{error:"audio_file_required"},400,rid);if(file.size>24*1024*1024)return out(req,env,{error:"audio_too_large"},413,rid);const fd=new FormData();fd.append("file",file,file.name||"answer.webm");fd.append("model",env.TRANSCRIBE_MODEL||"gpt-4o-transcribe");fd.append("language",incoming.get("language")||"ru");fd.append("prompt","Русская деловая речь. Точно сохраняй числа и термины: SAFE, cap table, valuation, dilution, runway, burn rate, CAC, LTV, MRR, ARR, NRR, GRR, churn, retention, traction, TAM, SAM, SOM, ICP, PMF, GTM, SaaS, unit economics, gross margin, EBITDA, pitch, term sheet, due diligence.");const r=await fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:fd}),raw=await r.text();if(!r.ok)return out(req,env,{error:"transcription_failed",detail:raw.slice(0,300)},502,rid);return out(req,env,{text:JSON.parse(raw).text||""},200,rid)}
 if(url.pathname==="/api/coach"&&req.method==="POST"){if(!env.OPENAI_API_KEY)return out(req,env,{error:"ai_not_configured"},503,rid);const b=await json(req),transcript=String(b.transcript||"").slice(0,16000);if(!transcript)return out(req,env,{error:"transcript_required"},400,rid);const input=`Память проекта:\n${String(b.memory||"нет").slice(0,6000)}\n\nИстория:\n${JSON.stringify(b.history||[]).slice(0,6000)}\n\nСлабые темы: ${JSON.stringify(b.weak_topics||[])}\nКонтекст: ${JSON.stringify(b.context||{}).slice(0,5000)}\n\nОтвет пользователя:\n${transcript}`;const body={model:env.COACH_MODEL||"gpt-5.6-terra",instructions:instructions(String(b.mode||"sim")),input,text:{format:{type:"json_schema",name:"investor_coach_feedback",strict:true,schema:aiSchema}},max_output_tokens:1400};const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify(body)}),raw=await r.text();if(!r.ok)return out(req,env,{error:"coach_failed",detail:raw.slice(0,300)},502,rid);const text=outputText(JSON.parse(raw));if(!text)return out(req,env,{error:"empty_model_output"},502,rid);return out(req,env,JSON.parse(text),200,rid)}
 return out(req,env,{error:"not_found"},404,rid)
 }catch(e){console.log(JSON.stringify({type:"error",request_id:rid,path:url.pathname,error:String(e).slice(0,400),duration_ms:Date.now()-started}));return out(req,env,{error:"internal_error",request_id:rid},500,rid)}}};