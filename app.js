const DEFAULT_STATE={day:1,streak:0,learned:{},correct:0,total:0,weak:[],pitchScores:[],simStep:0,messages:[],srs:{},daily:{},voiceScores:[],courseMode:"30",lastStudyDate:""};
const state=Object.assign({},DEFAULT_STATE,JSON.parse(localStorage.getItem("investorCoachState")||"null")||{});
state.learned=state.learned||{};state.weak=state.weak||[];state.srs=state.srs||{};state.daily=state.daily||{};state.messages=state.messages||[];state.pitchScores=state.pitchScores||[];state.voiceScores=state.voiceScores||[];
state.coachStats=state.coachStats||{};state.coachPlan=["7","14","30"].includes(state.coachPlan)?state.coachPlan:"30";state.coachPlanDays=state.coachPlanDays||{"7":state.coachDay||1,"30":1};state.coachRecent=Array.isArray(state.coachRecent)?state.coachRecent.slice(-12):[];
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
let save=()=>localStorage.setItem("investorCoachState",JSON.stringify(state));
const toast=m=>{const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)};
const pct=(a,b)=>b?Math.round(a/b*100):0;const term=id=>TERMS.find(x=>x.id===id);const today=()=>new Date().toISOString().slice(0,10);
const CATEGORY_ORDER=["Метрики","Рынок","Финансы","Фандрайзинг","Рост","Бизнес","Коммуникация","Право"];
const SRS_DAYS=[0,1,3,7,14,30,60];
function srsInfo(id){if(!state.srs[id])state.srs[id]={box:0,due:today(),right:0,wrong:0,last:""};return state.srs[id]}
function addDays(dateStr,n){const d=new Date((dateStr||today())+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function updateSRS(id,ok){const s=srsInfo(id);if(ok){s.box=Math.min(6,(s.box||0)+1);s.right=(s.right||0)+1}else{s.box=Math.max(0,(s.box||0)-1);s.wrong=(s.wrong||0)+1} s.last=today();s.due=addDays(today(),SRS_DAYS[s.box]);state.learned[id]=true;const wi=state.weak.indexOf(id);if(ok&&s.box>=2&&wi>=0)state.weak.splice(wi,1);if(!ok&&wi<0)state.weak.unshift(id);save()}
function dueTerms(){return TERMS.filter(t=>{const s=state.srs[t.id];return s&&s.due<=today()}).sort((a,b)=>{const A=srsInfo(a.id),B=srsInfo(b.id);return (B.wrong-B.right)-(A.wrong-A.right)})}
function mastery(){if(!TERMS.length)return 0;return Math.round(TERMS.reduce((n,t)=>n+Math.min(1,(srsInfo(t.id).box||0)/5),0)/TERMS.length*100)}
function studiedToday(){return Object.values(state.srs).filter(x=>x.last===today()).length}
function setDaily(key){state.daily[key]=today();save();renderDashboard()}
function doneDaily(key){return state.daily[key]===today()}
function safe(s){return String(s??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]))}

function renderDashboard(){const avg=pct(state.correct,state.total),master=mastery();
$("#view-dashboard").innerHTML=`
<div class="grid grid-2"><div class="card hero"><div class="eyebrow hero-eyebrow">INVESTOR COACH</div><h2>Учитесь. Отвечайте. Практикуйтесь.</h2><p>Короткая теория, понятные тесты и голосовые встречи с инвестором.</p><div class="row"><button class="btn" onclick="go('coach')">Coach</button><button class="btn secondary" onclick="go('investor')">Встреча с инвестором</button></div></div>
<div class="card"><div class="eyebrow">ПРОГРЕСС</div><div class="metric">${master}%</div><div class="progress"><div style="width:${master}%"></div></div><p class="muted">Тесты: ${avg}% · Ответов: ${state.total}</p><button class="btn secondary" onclick="go('roadmap')">Открыть курс</button></div></div>
<div class="grid grid-4 stats-grid"><button class="card daily-task" onclick="go('coach')"><strong>Coach</strong><small>Главная тренировка</small></button><button class="card daily-task" onclick="go('learn')"><strong>Термины</strong><small>${TERMS.length} карточек</small></button><button class="card daily-task" onclick="go('speak')"><strong>Живая речь</strong><small>Объясняйте голосом</small></button><button class="card daily-task" onclick="go('investor')"><strong>Инвестор</strong><small>Голосовая встреча</small></button></div>`}

let learnCat="Все",learnQuery="";
function renderLearn(){const cats=["Все",...new Set(TERMS.map(t=>t.cat))];const list=TERMS.filter(t=>(learnCat==="Все"||t.cat===learnCat)&&(!learnQuery||(`${t.word} ${t.full} ${t.simple}`).toLowerCase().includes(learnQuery.toLowerCase())));
$("#view-learn").innerHTML=`<div class="card learn-intro"><h2>Термины</h2><input class="input" placeholder="Найти термин" value="${safe(learnQuery)}" oninput="learnQuery=this.value;renderLearn()"></div><div class="filterbar">${cats.map(c=>`<button class="${c===learnCat?'active':''}" onclick="setLearnCat('${c}')">${c}</button>`).join("")}</div><div class="grid grid-3">${list.map(t=>`<div class="card term-card"><div><span class="tag">${t.cat}</span><div class="term-word">${t.word}</div><div class="muted small">${t.full}</div><details class="recall-details"><summary>Показать объяснение</summary><p class="definition"><strong>Просто:</strong> ${t.simple}</p>${t.formula?`<div class="formula small"><strong>Формула:</strong> ${t.formula}</div>`:""}<p class="small"><strong>Пример:</strong> ${t.example||'Пример зависит от бизнеса.'}</p><p class="small"><strong>Инвестор может спросить:</strong> ${t.investor}</p><p class="small"><strong>Зачем знать:</strong> ${t.why}</p></details></div><div class="recall-actions"><button class="btn secondary" onclick="rateRecall('${t.id}',false)">Не знаю</button><button class="btn" onclick="rateRecall('${t.id}',true)">Знаю</button></div></div>`).join("")}</div>`}
function setLearnCat(c){learnCat=c;renderLearn()} function rateRecall(id,ok){updateSRS(id,ok);setDaily('learn');renderLearn();renderDashboard();toast(ok?'Следующее повторение отложено.':'Термин вернётся быстрее.')}


// Coach — главный адаптивный тренер: смысл → пример → логика инвестора → применение → повтор.
let coachSession=null;
const COACH_WEEK=[["cac","ltv","retention","churn","runway","burn","mrr","arr"],["gross_margin","payback","nrr","grr","arpu","arpa","conversion","cohort"],["tam","sam","som","bottom_up","icp","pmf","traction","competition"],["gtm","plg","sales_led","sales_cycle","pipeline","pricing","enterprise","saas"],["valuation","pre_money","post_money","dilution","cap_table","safe","term","milestone"],["liquidation","pro_rata","vesting","cliff","board","protective","due_diligence","data_room"],["pitch","pitch_deck","one_liner","ask","use_of_funds","why_now","founder_market","risk_register"]];
const COACH_PLANS={
 "7":{label:"7 дней",title:"Интенсив",pace:"2–4 часа в день",newPerDay:14,days:7,desc:"Быстрое погружение: термины → ситуации → вопросы инвестора → голосовая речь."},
 "14":{label:"14 дней",title:"Ускоренный профессиональный курс",pace:"90–150 минут в день",newPerDay:8,days:14,desc:"Баланс скорости и закрепления: новые термины, применение, речь и интервальные проверки."},
 "30":{label:"30 дней",title:"Профессиональный курс",pace:"45–90 минут в день",newPerDay:4,days:30,desc:"Системное освоение языка инвесторов с интервальным повторением и живой практикой."}
};
const COACH_GUIDES={
cac:{benchmark:"CAC оценивают вместе с LTV, gross margin и payback. Сам по себе низкий CAC ничего не доказывает.",investorGoal:"Понять, можно ли масштабировать привлечение без разрушения экономики.",best:"Назовите CAC, сегмент, канал, период, динамику и payback."},
ltv:{benchmark:"Частый ориентир для подписочных моделей — LTV/CAC около 3× и выше, но LTV должен учитывать churn и маржу.",investorGoal:"Понять, сколько экономической ценности создаёт один клиент за всё время жизни.",best:"Покажите формулу LTV, retention/churn и отношение LTV к CAC."},
retention:{benchmark:"Универсального проходного retention нет. Смотрите когорты, частоту использования и стабилизацию retention со временем.",investorGoal:"Понять, возвращаются ли люди потому, что продукт действительно нужен.",best:"Покажите retention по когортам и периодам, подходящим вашей модели, плюс динамику новых когорт."},
churn:{benchmark:"Чем ниже churn, тем лучше, но норма зависит от сегмента. В SaaS полезно показывать logo churn и revenue churn отдельно.",investorGoal:"Понять, как быстро вы теряете клиентов и выручку и почему они уходят.",best:"Назовите churn за конкретный период, причины ухода и тренд по когортам."},
runway:{benchmark:"После раунда часто планируют примерно 12–18+ месяцев runway до следующего сильного milestone. Это ориентир, не правило.",investorGoal:"Понять, сколько времени у команды до следующей потребности в капитале.",best:"Назовите cash, net burn, runway и milestones, которые должны быть достигнуты."},
burn:{benchmark:"Burn оценивают по эффективности: сколько доказательств и роста компания получает на каждый потраченный доллар.",investorGoal:"Понять скорость расходования капитала и дисциплину управления.",best:"Покажите gross/net burn, runway и что именно этот burn покупает."},
gross_margin:{benchmark:"Для software/SaaS 70%+ часто воспринимается как сильный ориентир, но инфраструктурные и сервисные модели могут быть ниже.",investorGoal:"Понять качество выручки и сколько остаётся после прямой себестоимости.",best:"Назовите gross margin, состав COGS, динамику и эффект масштаба."},
payback:{benchmark:"Для SaaS payback до ~12 месяцев часто выглядит сильным; 12–18 месяцев может быть нормальным в enterprise при высоком ACV и удержании.",investorGoal:"Понять, как быстро возвращаются деньги, потраченные на привлечение.",best:"Назовите payback по сегментам и каналам и покажите динамику."},
nrr:{benchmark:"NRR выше 100% значит, что существующая база растёт без новых клиентов. 110–120%+ часто выглядит сильным в B2B SaaS, но зависит от сегмента.",investorGoal:"Понять, растёт ли выручка внутри существующих клиентов после churn и contraction.",best:"Покажите NRR по зрелым когортам и разложите expansion, contraction и churn."},
grr:{benchmark:"GRR показывает удержание без допродаж. Чем ближе к 100%, тем меньше утечка базовой выручки.",investorGoal:"Отделить реальное удержание от эффекта expansion revenue.",best:"Покажите GRR и NRR вместе."},
mrr:{benchmark:"Нет минимального MRR, который автоматически приводит к инвестиции. Важнее рост, retention и качество recurring revenue.",investorGoal:"Понять масштаб и предсказуемость ежемесячной повторяющейся выручки.",best:"Назовите MRR, рост, new/expansion/churned MRR и концентрацию клиентов."},
arr:{benchmark:"ARR оценивают вместе с growth rate, retention, gross margin и качеством контрактов.",investorGoal:"Понять годовой масштаб recurring revenue и скорость развития бизнеса.",best:"Покажите ARR, рост год-к-году, NRR/GRR и качество recurring revenue."},
conversion:{benchmark:"Нормальная conversion зависит от этапа и канала. Важнее bottleneck и динамика по cohort/channel.",investorGoal:"Понять, где пользователь переходит к следующей стадии ценности или оплаты.",best:"Покажите воронку по этапам, период, сегменты и изменения."},
tam:{benchmark:"Большой TAM полезен, но 1% огромного рынка без bottom-up логики слабый аргумент.",investorGoal:"Понять, достаточно ли велик конечный рынок для масштаба фонда.",best:"Дайте bottom-up TAM: число потенциальных клиентов × реалистичный annual spend."},
sam:{benchmark:"SAM должен отражать рынок, который реально обслуживает текущий продукт и география.",investorGoal:"Понять реальный доступный рынок вашей текущей модели.",best:"Покажите, какие сегменты TAM исключены и почему."},
som:{benchmark:"SOM должен быть достижимым, а не просто маленьким процентом TAM.",investorGoal:"Понять, какую часть рынка компания реально способна захватить.",best:"Свяжите SOM с каналами, sales capacity и временным горизонтом."},
pmf:{benchmark:"PMF не имеет одной магической цифры. Сильные сигналы: стабильный retention, willingness to pay, органический спрос и повторное использование.",investorGoal:"Понять, нашёл ли продукт рынок, который действительно его хочет.",best:"Покажите несколько независимых сигналов PMF, а не одну красивую метрику."},
traction:{benchmark:"Traction — не просто скачивания. Сильнее revenue, retention, usage, contracts и качественный pipeline.",investorGoal:"Понять, уменьшилась ли неопределённость бизнеса благодаря реальным данным.",best:"Назовите 2–4 метрики traction, период и темп изменения."},
gtm:{benchmark:"Сильный GTM повторяем: ясны ICP, канал, conversion, CAC, sales cycle и ответственный motion.",investorGoal:"Понять, как компания превращает рынок в предсказуемую выручку.",best:"Опишите ICP → канал → conversion → CAC → sales cycle → expansion."},
valuation:{benchmark:"Универсальной правильной valuation нет: она зависит от стадии, traction, рынка, условий и спроса на раунд.",investorGoal:"Понять, соответствует ли цена риску, upside и ownership фонда.",best:"Обоснуйте valuation стадией, traction, размером раунда и следующим milestone."},
dilution:{benchmark:"Нет одной идеальной dilution. Моделируйте этот и будущие раунды, option pool и контроль.",investorGoal:"Понять, как изменится ownership и мотивация команды.",best:"Покажите cap table до/после раунда на fully diluted basis."},
safe:{benchmark:"У SAFE нет универсально лучших cap/discount. Главное — понимать будущую конверсию и накопленный dilution.",investorGoal:"Понять экономику конвертации и скрытые обязательства cap table.",best:"Назовите тип SAFE, cap/discount, pro-rata/MFN при наличии и смоделируйте конверсию."},
term:{benchmark:"Term Sheet оценивают не только по valuation. Control и downside terms могут быть важнее нескольких процентов цены.",investorGoal:"Зафиксировать основные экономические и governance-условия сделки.",best:"Смотрите valuation, liquidation preference, board, protective provisions, pro-rata, option pool и vesting вместе."},
liquidation:{benchmark:"В venture часто встречается 1× non-participating preference; более жёсткие структуры требуют отдельного внимания.",investorGoal:"Понять порядок распределения денег при exit или ликвидации.",best:"Объясните multiple, participating/non-participating и seniority на простом числовом примере."},
cap_table:{benchmark:"Сильный cap table точный, прозрачный и без неожиданных прав или скрытых конвертируемых инструментов.",investorGoal:"Понять реальное ownership, dilution и обязательства перед держателями бумаг.",best:"Покажите current и pro-forma fully diluted cap table, включая options и SAFE/notes."},
due_diligence:{benchmark:"Критерий — не объём документов, а отсутствие расхождений между pitch и доказательствами.",investorGoal:"Проверить цифры, права, IP, клиентов, финансы и корпоративную историю.",best:"Организуйте data room так, чтобы ключевой тезис подтверждался документом за минуты."},
pitch:{benchmark:"Сильный pitch понятен без специальных знаний: проблема, клиент, решение, доказательство, рынок, модель, команда и ask.",investorGoal:"Быстро решить, достаточно ли интересна возможность для следующего шага.",best:"Говорите причинно: проблема → решение → доказательство → масштаб → почему вы → почему сейчас → ask."},
ask:{benchmark:"Ask должен финансировать конкретный следующий уровень доказательства, а не абстрактные маркетинг и развитие.",investorGoal:"Понять сколько капитала нужно, на какой срок и какой value-inflection он создаст.",best:"Сумма → runway → use of funds → измеримые milestones → состояние компании после их достижения."}
};
Object.assign(COACH_GUIDES,{
 arpu:{benchmark:"У ARPU нет универсального хорошего числа. Важно, растёт ли он и покрывает ли стоимость привлечения и обслуживания.",investorGoal:"Понять качество монетизации одного пользователя.",best:"Назовите ARPU по сегменту, динамику и связь с gross margin и CAC."},
 arpa:{benchmark:"Сильный ARPA устойчиво растёт без ухудшения churn и sales efficiency. Универсального порога нет.",investorGoal:"Понять монетизацию одного клиентского аккаунта.",best:"Покажите ARPA по сегментам и его динамику."},
 conversion:{benchmark:"Нормальная conversion зависит от этапа и канала. Инвестор смотрит на bottleneck, динамику и качество когорт.",investorGoal:"Понять, где пользователь переходит к следующей стадии ценности или оплаты.",best:"Покажите воронку по этапам, сегментам и каналам."},
 cap_table:{benchmark:"Сильный cap table — актуальный, юридически подтверждённый и понятный на fully diluted basis.",investorGoal:"Понять реальную структуру ownership и будущую dilution.",best:"Покажите founders, options, инвесторов и конвертируемые инструменты до/после раунда."},
 due_diligence:{benchmark:"Хороший diligence — когда каждое важное утверждение быстро подтверждается документом или данными.",investorGoal:"Проверить слова основателя и найти скрытые риски.",best:"Подготовьте corporate docs, cap table, IP, financials, KPI, contracts и customer evidence."}
});
function coachPlan(){return COACH_PLANS[state.coachPlan]||COACH_PLANS["30"]}
function coachDay(){const p=coachPlan();return Math.max(1,Math.min(p.days,Number(state.coachPlanDays[state.coachPlan]||1)))}
function setCoachPlan(id){if(!COACH_PLANS[id])return;state.coachPlan=id;if(!state.coachPlanDays[id])state.coachPlanDays[id]=1;coachSession=null;save();renderCoach();renderDashboard();pushAppHistory("coach",{coachSession:false})}
function termUse(t){const map={"Фандрайзинг":"Раунды, переговоры с инвесторами и условия сделки.","Финансы":"Финансовая модель, бюджет и экономика бизнеса.","Метрики":"Отчёты, рост продукта и вопросы инвестора о цифрах.","Рынок":"Оценка рынка, клиентов и конкурентов.","Рост":"Продажи, маркетинг и масштабирование.","Бизнес":"Бизнес-модель, продукт и монетизация.","Коммуникация":"Pitch, встречи и ответы инвестору.","Право":"Документы, права инвесторов и структура компании."};return map[t?.cat]||"В разговоре с инвестором и управлении стартапом."}
function coachGuide(t){const g=COACH_GUIDES[t.id]||{},goals={"Метрики":"Понять качество роста через цифры, а не впечатления.","Финансы":"Понять устойчивость экономики и потребность в капитале.","Рынок":"Понять кому нужен продукт и насколько велик рынок.","Рост":"Понять, можно ли повторяемо привлекать клиентов.","Фандрайзинг":"Понять экономику раунда, ownership и риски условий.","Право":"Понять контроль, права сторон и юридические риски.","Бизнес":"Понять как продукт создаёт ценность и выручку.","Коммуникация":"Понять, может ли основатель ясно объяснить бизнес."};let benchmark=g.benchmark;if(!benchmark)benchmark=(t.cat==="Метрики"||t.cat==="Финансы")?"Универсального проходного числа нет. Важно точное определение, период, динамика, сегмент и связь с соседними метриками.":"Универсального числового порога нет. Сильный ответ конкретный и подтверждён данными, примером или документом.";return {purpose:t.why||`Термин нужен, чтобы точно говорить о ${termUse(t).toLowerCase()}`,investorGoal:g.investorGoal||goals[t.cat]||"Понять конкретный риск или качество бизнеса.",benchmark,best:g.best||"Ответьте одним тезисом и подтвердите его цифрой, примером или документом.",use:termUse(t)}}
function coachStat(id){if(!state.coachStats[id])state.coachStats[id]={seen:0,right:0,wrong:0,streak:0,last:"",mastery:0,nextReview:0};const s=state.coachStats[id];s.mastery=Number(s.mastery||0);s.nextReview=Number(s.nextReview||0);return s}
function coachAccuracy(id){const s=coachStat(id),n=(s.right||0)+(s.wrong||0);return n?s.right/n:0}
function coachLevel(id){const s=coachStat(id),a=coachAccuracy(id);if(s.seen<2||a<.55)return 1;if(s.seen<5||a<.82)return 2;return 3}
function coachLevelName(id){return ["","Разбираем с нуля","Закрепляем на примерах","Тренируем как на встрече"][coachLevel(id)]}
function coachPriority(t){const s=coachStat(t.id),a=coachAccuracy(t.id),weak=state.weak.includes(t.id)?8:0,due=(state.srs[t.id]&&state.srs[t.id].due<=today())?7:0,unseen=s.seen===0?14:0,recent=state.coachRecent.includes(t.id)?22:0,review=s.nextReview&&Date.now()>=s.nextReview?9:0;return unseen+weak+due+review+(s.wrong||0)*2+(s.seen?Math.round((1-a)*8):0)-Math.min(10,Math.round((s.mastery||0)/10))-recent}
function coachFocusTerms(){const p=coachPlan(),d=coachDay();if(state.coachPlan==="7")return (COACH_WEEK[(d-1)%7]||[]).map(term).filter(Boolean);const start=((d-1)*p.newPerDay)%TERMS.length,out=[];for(let i=0;i<Math.min(p.newPerDay,TERMS.length);i++)out.push(TERMS[(start+i)%TERMS.length]);return out}
function coachPool(){const preferred=[...dueTerms(),...state.weak.map(term).filter(Boolean),...coachFocusTerms()].filter(Boolean),seen=new Set(),out=[];const add=t=>{if(t&&!seen.has(t.id)){seen.add(t.id);out.push(t)}};for(const t of preferred.sort((a,b)=>coachPriority(b)-coachPriority(a)))if(!state.coachRecent.includes(t.id))add(t);for(const t of TERMS.slice().sort((a,b)=>coachPriority(b)-coachPriority(a)))if(!state.coachRecent.includes(t.id))add(t);for(const t of preferred.sort((a,b)=>coachPriority(b)-coachPriority(a)))add(t);for(const t of TERMS.slice().sort((a,b)=>coachPriority(b)-coachPriority(a)))add(t);return out}
function coachDecoys(correct,count=2){const same=TERMS.filter(t=>t.id!==correct.id&&t.cat===correct.cat),pool=[...same,...TERMS.filter(t=>t.id!==correct.id&&!same.some(x=>x.id===t.id))],out=[];for(const t of pool){if(out.length>=count)break;if(!out.some(x=>x.id===t.id))out.push(t)}return out}
function coachShuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function coachChoices(t,field){const options=coachShuffle([t,...coachDecoys(t,2)]);return {options:options.map(x=>field(x)),answer:options.findIndex(x=>x.id===t.id)}}
function coachOptionTask(type,t,prompt,values,answer){return {type,termId:t.id,prompt,options:values,answer,answered:false,selected:-1}}
function buildCoachTasks(t){const g=coachGuide(t),level=coachLevel(t.id),dec=coachDecoys(t,2),tasks=[];
 if(coachStat(t.id).seen===0)tasks.push({type:"lesson",termId:t.id});
 const meaning=coachShuffle([t.simple,dec[0]?.simple||"Другое понятие",dec[1]?.simple||"Другое понятие"]);
 if(level<=1)tasks.push(coachOptionTask("meaning",t,`Как точнее всего объяснить «${t.word}» простыми словами?`,meaning,meaning.indexOf(t.simple)));
 const scenario=coachChoices(t,x=>x.word);tasks.push(coachOptionTask("scenario",t,`Ситуация: ${t.example||t.simple} Какой термин здесь нужен?`,scenario.options,scenario.answer));
 const purpose=coachShuffle([g.investorGoal,coachGuide(dec[0]).investorGoal,coachGuide(dec[1]).investorGoal]);tasks.push(coachOptionTask("investor",t,`Инвестор спрашивает: «${t.investor||`Что показывает ${t.word}?`}» Что он пытается понять?`,purpose,purpose.indexOf(g.investorGoal)));
 if(level>=2){const usage=coachShuffle([g.use,coachGuide(dec[0]).use,coachGuide(dec[1]).use]);tasks.push(coachOptionTask("usage",t,`Где «${t.word}» используется наиболее уместно?`,usage,usage.indexOf(g.use)))}
 const responses=coachShuffle([g.best,coachGuide(dec[0]).best,coachGuide(dec[1]).best]);tasks.push(coachOptionTask("response",t,`Какой ответ на вопрос про «${t.word}» звучит профессиональнее?`,responses,responses.indexOf(g.best)));
 if(level>=2)tasks.push({type:"transfer",termId:t.id,prompt:`Сформулируйте своими словами, как вы примените «${t.word}» в разговоре с инвестором. Привяжите ответ к цифре, факту или решению.`,answered:false});
 tasks.push({type:"speech",termId:t.id,prompt:`Ответьте голосом 20–40 секунд. Инвестор спрашивает: «${t.investor||`Объясните ${t.word} применительно к вашему бизнесу.`}»`,answered:false,score:null,feedback:""});
 return tasks}
function startCoach(count=2){const chosen=coachPool().slice(0,Math.max(1,Math.min(2,count))),groups=chosen.map(buildCoachTasks),tasks=[],max=Math.max(...groups.map(g=>g.length));for(let step=0;step<max;step++)for(const group of groups)if(group[step])tasks.push(group[step]);coachSession={count:chosen.length,index:0,tasks,terms:chosen.map(t=>t.id),plan:state.coachPlan,day:coachDay(),answered:0,correct:0,mistakes:[]};state.coachRecent=[...state.coachRecent,...chosen.map(t=>t.id)].slice(-12);voiceBuffers.coach="";save();renderCoach();pushAppHistory("coach",{coachSession:true,coachIndex:0})}
function coachRecordResult(task,ok){const s=coachStat(task.termId);s.seen=(s.seen||0)+1;s.last=today();coachSession.answered=(coachSession.answered||0)+1;if(ok){s.right=(s.right||0)+1;s.streak=(s.streak||0)+1;s.mastery=Math.min(100,(s.mastery||0)+8);s.nextReview=Date.now()+((s.mastery||0)>=70?3:1)*86400000;coachSession.correct=(coachSession.correct||0)+1}else{s.wrong=(s.wrong||0)+1;s.streak=0;s.mastery=Math.max(0,(s.mastery||0)-6);s.nextReview=Date.now()+20*60000;if(!coachSession.mistakes.includes(task.termId))coachSession.mistakes.push(task.termId)}updateSRS(task.termId,ok)}
function answerValue(v){return String(v??"").trim().normalize("NFKC").replace(/\s+/g," ").toLocaleLowerCase("ru-RU")}
function answerMatches(options,selected,answer){
 const si=Number(selected),ai=Number(answer);
 if(Number.isInteger(si)&&Number.isInteger(ai)&&si===ai)return true;
 const selectedValue=Array.isArray(options)?answerValue(options[si]):"";
 const correctValue=Array.isArray(options)?answerValue(options[ai]):"";
 return !!selectedValue&&!!correctValue&&selectedValue===correctValue;
}
function coachAnswer(i){const task=coachSession?.tasks?.[coachSession.index];if(!task||["lesson","speech"].includes(task.type)||task.answered)return;task.selected=Number(i);task.answered=true;const ok=answerMatches(task.options,task.selected,task.answer);coachRecordResult(task,ok);save();renderCoach();renderDashboard()}
function coachNext(){if(!coachSession)return;const task=coachSession.tasks[coachSession.index];if(task.type!=="lesson"&&!task.answered)return;if(task.type==="lesson"){const s=coachStat(task.termId);s.seen=(s.seen||0)+1;s.last=today();save()}coachSession.index++;voiceBuffers.coach="";renderCoach();pushAppHistory("coach",{coachSession:true,coachIndex:coachSession.index})}
function coachBack(){if(history.state?.view==='coach'&&window.history.length>1){history.back();return}if(coachSession&&coachSession.index>0){coachSession.index--;voiceBuffers.coach="";renderCoach()}else{coachSession=null;renderCoach()}}
function coachNextDay(){const p=coachPlan(),d=coachDay();state.coachPlanDays[state.coachPlan]=d>=p.days?1:d+1;save();coachSession=null;renderCoach();renderDashboard();pushAppHistory("coach",{coachSession:false})}
function coachSpeechLocal(text,t){const low=(text||"").toLowerCase(),source=`${t.word} ${t.simple} ${t.why||""} ${t.investor||""}`.toLowerCase().replace(/[(),—]/g," "),keywords=[...new Set(source.split(/\s+/).filter(x=>x.length>5))],hits=keywords.filter(k=>low.includes(k)).length;let score=35+Math.min(35,hits*7)+(low.length>120?15:low.length>60?8:0)+(/\d/.test(low)?8:0);score=Math.min(100,score);return {score,feedback:score>=82?"Сильный ответ: смысл понятен и звучит применимо.":score>=68?"Смысл есть. Добавьте конкретику: цифру, период, сегмент или пример из бизнеса.":"Ответ пока слишком общий. Скажите: что означает термин → зачем инвестору → один конкретный пример."}}
function coachTaskComment(task,t){const g=coachGuide(t);if(task.type==="meaning")return `Коротко: ${t.simple}`;if(task.type==="scenario")return `Это проверка применения: термин должен работать в реальной ситуации, а не только в определении.`;if(task.type==="investor")return `Инвестор проверяет: ${g.investorGoal}`;if(task.type==="usage")return `Рабочий контекст: ${g.use}`;if(task.type==="response")return `Профессиональный ответ строится как тезис → конкретика → доказательство. ${g.best}`;return t.simple}
function coachFeedback(task,t){const ok=answerMatches(task.options,task.selected,task.answer);return `<div class="answer-result ${ok?'is-correct':'is-wrong'}"><strong>${ok?'Правильно':'Неправильно'}</strong></div>${!ok?`<div class="answer-line wrong-line"><span>Ваш ответ</span><strong>${safe(task.options[task.selected])}</strong></div>`:''}<div class="answer-line correct-line"><span>Правильный ответ</span><strong>${safe(task.options[task.answer])}</strong></div><div class="feedback lesson-feedback"><p><strong>Комментарий:</strong> ${safe(coachTaskComment(task,t))}</p></div>`}
function coachPlanTabs(){return `<div class="filterbar coach-plan-tabs">${Object.entries(COACH_PLANS).map(([id,p])=>`<button class="${state.coachPlan===id?'active':''}" onclick="setCoachPlan('${id}')">${p.label}</button>`).join('')}</div>`}
function coachBackButton(){return `<button class="btn secondary coach-back" onclick="coachBack()">← Назад</button>`}
function coachTransferDone(){if(!coachSession)return;const task=coachSession.tasks?.[coachSession.index];if(!task||task.type!=="transfer"||task.answered)return;task.answered=true;const s=coachStat(task.termId);s.seen=(s.seen||0)+1;s.mastery=Math.min(100,(s.mastery||0)+4);s.nextReview=Date.now()+2*86400000;s.last=today();save();renderCoach()}
function renderCoach(){const root=$("#view-coach");if(!root)return;const p=coachPlan(),d=coachDay();if(!coachSession){const focus=coachFocusTerms().slice(0,6).map(t=>t.word).join(" · "),weak=TERMS.filter(t=>state.weak.includes(t.id)).length;root.innerHTML=`<div class="card"><div class="row between"><div><span class="tag">ГЛАВНЫЙ РЕЖИМ</span><h2>Coach</h2><p class="muted">Понимание → ситуация → логика инвестора → сильный ответ → живая речь.</p></div><div class="score-ring" style="--score:${mastery()}"><span>${mastery()}%</span></div></div>${coachPlanTabs()}<div class="grid grid-2"><div><strong>${p.title}</strong><p class="muted">${p.desc}</p><small>${p.pace} · день ${d} из ${p.days}</small></div><div><strong>Сегодня</strong><p class="muted">${focus||"Адаптивный набор терминов"}</p><small>Слабых тем: ${weak}</small></div></div><div class="row"><button class="btn" onclick="startCoach(1)">Начать 1 термин</button><button class="btn" onclick="startCoach(2)">Начать 2 термина</button></div><p class="muted small">Coach не повторяет один и тот же разбор подряд. Ошибки возвращаются позже и в другом контексте.</p></div>`;return}
 if(coachSession.index>=coachSession.tasks.length){const score=pct(coachSession.correct,coachSession.answered),names=coachSession.terms.map(id=>term(id)?.word).filter(Boolean).join(" · ");root.innerHTML=`<div class="card"><span class="tag">ПОДХОД ЗАВЕРШЁН</span><h2>${score}%</h2><p><strong>${safe(names)}</strong></p><p class="muted">Следующий подход даст другие термины. Ошибки вернутся позже по интервальному повторению, а не на соседнем экране.</p><div class="row">${coachBackButton()}<button class="btn" onclick="coachSession=null;renderCoach()">Новый подход</button><button class="btn secondary" onclick="coachNextDay()">Следующий день</button></div></div>`;return}
 const task=coachSession.tasks[coachSession.index],t=term(task.termId),g=coachGuide(t),n=coachSession.index+1,total=coachSession.tasks.length,level=coachLevelName(t.id);
 if(task.type==="lesson"){root.innerHTML=`<div class="quiz"><div class="row between">${coachBackButton()}<span class="tag">COACH · ${n}/${total}</span></div><div class="card quiz-card"><div class="row between"><div><span class="tag">${safe(t.cat)}</span><h2>${safe(t.word)}</h2></div><span class="muted small">${safe(level)}</span></div><p class="definition"><strong>Просто:</strong> ${safe(t.simple)}</p><p><strong>Зачем это нужно:</strong> ${safe(g.purpose)}</p><p><strong>Пример:</strong> ${safe(t.example||"Пример зависит от бизнеса.")}</p><p><strong>Что хочет понять инвестор:</strong> ${safe(g.investorGoal)}</p>${t.formula?`<p><strong>Формула:</strong> ${safe(t.formula)}</p>`:""}<button class="btn feedback-next" onclick="coachNext()">Проверить на практике</button></div></div>`;return}
 if(task.type==="transfer"){root.innerHTML=`<div class="quiz"><div class="row between">${coachBackButton()}<span class="tag">COACH · ${n}/${total}</span></div><div class="card quiz-card"><span class="tag">ПЕРЕНОС ЗНАНИЯ</span><h2>${safe(task.prompt)}</h2><p class="muted">Не повторяйте определение. Скажите это так, как сказали бы на реальной встрече.</p>${task.answered?`<div class="feedback"><strong>Готово.</strong><p>Вы связали термин со своей собственной формулировкой.</p></div><button class="btn feedback-next" onclick="coachNext()">Следующий шаг</button>`:`<button class="btn" onclick="coachTransferDone()">Я сформулировал ответ</button>`}</div></div>`;return}
 if(task.type==="speech"){root.innerHTML=`<div class="quiz"><div class="row between">${coachBackButton()}<span class="tag">COACH · ${n}/${total}</span></div><div class="card quiz-card"><span class="tag">ЖИВАЯ РЕЧЬ</span><h2>${safe(task.prompt)}</h2><p class="muted">Не читайте определение. Ответьте как на встрече: коротко, своими словами, с одним конкретным примером или цифрой.</p>${voicePanel('coach')}<div id="coachSpeechResult">${task.feedback||""}</div>${task.answered?`<button class="btn feedback-next" onclick="coachNext()">Следующий шаг</button>`:""}</div></div>`;restoreVoiceTranscript('coach');return}
 const labels={meaning:"Смысл",scenario:"Применение",investor:"Логика инвестора",usage:"Где употребляется",response:"Ответ на встрече"};root.innerHTML=`<div class="quiz"><div class="row between">${coachBackButton()}<span class="muted small">${safe(level)}</span></div><div class="row between"><span class="tag">COACH · ${n}/${total}</span><span class="muted small">${labels[task.type]||"Практика"}</span></div><div class="card quiz-card"><h2>${safe(task.prompt)}</h2><div>${task.options.map((o,i)=>`<button class="option ${task.answered?(i===task.answer?'correct':i===task.selected?'wrong':''):''}" ${task.answered?'disabled':''} onclick="coachAnswer(${i})">${safe(o)}</button>`).join("")}</div>${task.answered?`${coachFeedback(task,t)}<button class="btn feedback-next" onclick="coachNext()">Следующий шаг</button>`:""}</div></div>`}


let quizIndex=0,quizAnswered=false,lastAnswer=-1,currentQuiz=null;
function buildQuizQueue(){const dueIds=new Set(dueTerms().map(t=>t.id));const weakIds=new Set(state.weak);return [...QUIZ].sort((a,b)=>(dueIds.has(b.termId)?3:0)+(weakIds.has(b.termId)?2:0)-((dueIds.has(a.termId)?3:0)+(weakIds.has(a.termId)?2:0)))}
function getQuiz(){const q=buildQuizQueue();return q[quizIndex%q.length]}
function quizFeedback(q){const t=term(q.termId);const ok=answerMatches(q.options,lastAnswer,q.a);return `<div class="answer-result ${ok?'is-correct':'is-wrong'}"><strong>${ok?'Правильно':'Неправильно'}</strong></div>${!ok?`<div class="answer-line wrong-line"><span>Ваш ответ</span><strong>${safe(q.options[lastAnswer])}</strong></div>`:''}<div class="answer-line correct-line"><span>Правильный ответ</span><strong>${safe(q.options[q.a])}</strong></div><div class="feedback lesson-feedback"><p><strong>Просто:</strong> ${safe(t?.simple||q.why)}</p><p><strong>Почему:</strong> ${safe(q.why)}</p>${t?.example?`<p><strong>Пример:</strong> ${safe(t.example)}</p>`:''}<p><strong>Где используется:</strong> ${safe(termUse(t))}</p></div>`}
function renderTrain(){if(!currentQuiz)currentQuiz=getQuiz();const q=currentQuiz;$("#view-train").innerHTML=`<div class="quiz"><div class="row between"><span class="tag">ВОПРОС ${quizIndex+1}</span><span class="muted small">Выберите один ответ</span></div><div class="card quiz-card"><h2>${q.q}</h2><div>${q.options.map((o,i)=>`<button class="option ${quizAnswered?(answerMatches(q.options,i,q.a)?'correct':Number(i)===Number(lastAnswer)?'wrong':''):''}" ${quizAnswered?'disabled':''} onclick="answerQuiz(${i})">${o}</button>`).join("")}</div>${quizAnswered?`${quizFeedback(q)}<button class="btn feedback-next" onclick="nextQuiz()">Следующий вопрос</button>`:""}</div></div>`}
function answerQuiz(i){if(quizAnswered)return;const q=currentQuiz||getQuiz();currentQuiz=q;lastAnswer=Number(i);quizAnswered=true;state.total++;const ok=answerMatches(q.options,lastAnswer,q.a);if(ok)state.correct++;updateSRS(q.termId,ok);setDaily('review');save();renderTrain();renderDashboard()}
function nextQuiz(){if(!quizAnswered)return;quizIndex++;quizAnswered=false;lastAnswer=-1;currentQuiz=null;renderTrain()}

let speakTerm=TERMS[0];
function chooseSpeakTerm(){const candidates=[...dueTerms(),...state.weak.map(term).filter(Boolean)];speakTerm=candidates[0]||TERMS[Math.floor(Math.random()*TERMS.length)]}
function renderSpeak(){if(!speakTerm)chooseSpeakTerm();$("#view-speak").innerHTML=`<div class="grid grid-2"><div class="card voice-card"><span class="tag">ГОЛОСОВОЙ ACTIVE RECALL</span><h2>${speakTerm.word}</h2><p class="muted">${speakTerm.full}</p><h3>Объясните термин своими словами и приведите пример.</h3>${voicePanel('speak')}<div id="speakResult"></div><button class="btn secondary" onclick="newSpeakTerm()">Следующий термин</button></div><div class="card"><h3>После ответа сравните</h3><p><strong>Коротко:</strong> ${speakTerm.simple}</p>${speakTerm.formula?`<p><strong>Формула:</strong> ${speakTerm.formula}</p>`:""}<p><strong>Пример:</strong> ${speakTerm.example||'Сформулируйте собственный пример.'}</p><p><strong>Вопрос инвестора:</strong> ${speakTerm.investor}</p></div></div>`;restoreVoiceTranscript('speak')}
function newSpeakTerm(){chooseSpeakTerm();voiceBuffers.speak="";renderSpeak()}
function evaluateSpeak(text){const low=(text||"").toLowerCase();const base=(speakTerm.word+" "+speakTerm.full+" "+speakTerm.simple+" "+(speakTerm.why||"")).toLowerCase().replace(/[(),—]/g," ");const keywords=[...new Set(base.split(/\s+/).filter(x=>x.length>5))];const hits=keywords.filter(k=>low.includes(k)).length;const score=Math.min(100,25+hits*10+(low.length>100?20:0)+(/\d/.test(low)?10:0));updateSRS(speakTerm.id,score>=70);state.voiceScores.push(score);setDaily('voice');save();const el=$("#speakResult");if(el)el.innerHTML=`<div class="feedback"><strong>Оценка объяснения: ${score}/100</strong><p>${score>=80?'Хорошо: смысл воспроизводится из памяти.':score>=60?'Основа есть. Добавьте пример и связь с решением инвестора.':'Повторите термин через короткий интервал и попробуйте снова без подсказки.'}</p><p class="small"><strong>Эталон:</strong> ${speakTerm.simple}</p></div>`;renderDashboard()}

let pitchTopic="SaaS-стартап";const PITCH_LABELS={problem:"Проблема",solution:"Решение",market:"Рынок",traction:"Traction",model:"Модель",ask:"Запрос"};
function renderPitch(){const p=PITCH_TOPICS[pitchTopic]||Object.values(PITCH_TOPICS)[0];$("#view-pitch").innerHTML=`<div class="grid grid-2"><div class="card"><div class="row between"><div><span class="tag">ГОЛОСОВОЙ PITCH</span><h2>Рассказ о своём проекте</h2></div><select class="input pitch-select" onchange="pitchTopic=this.value;renderPitch()">${Object.keys(PITCH_TOPICS).map(x=>`<option ${x===pitchTopic?'selected':''}>${x}</option>`).join("")}</select></div><p class="muted">Структура — только опора. Сначала посмотрите, затем уберите подсказку и расскажите всё голосом одним заходом.</p><div class="grid">${Object.entries(p).map(([k,v])=>`<div class="card pitch-part"><strong>${PITCH_LABELS[k]||k}</strong><p class="muted">${v}</p></div>`).join("")}</div></div><div class="card voice-card"><h3>Запишите pitch голосом</h3><p class="muted">Нажмите «Начать». Говорите сколько нужно. Текст будет накапливаться. Нажмите «Отправить pitch» — запись остановится и только тогда ответ будет оценён.</p>${voicePanel('pitch')}<div id="pitchScore"></div><div class="small muted pitch-checklist">Проверка: проблема → решение → рынок → traction → бизнес-модель → конкуренция → команда → раунд → использование капитала.</div></div></div>`;restoreVoiceTranscript('pitch')}
function scorePitchText(text){const t=(text||"").toLowerCase();const groups=[["проблем","боль"],["решен","продукт"],["рын","tam","sam"],["traction","retention","mrr","выруч","рост"],["модел","saas","подпис"],["клиент","icp","сегмент"],["конкур","альтернатив"],["команд","основател","опыт"],["раунд","привлека","инвест"],["капитал","средств","runway","milestone"]];const present=groups.map(g=>g.some(k=>t.includes(k)));let score=Math.round(present.filter(Boolean).length/groups.length*85);if(t.length>400)score+=8;if(/\d/.test(t))score+=7;score=Math.min(100,score);state.pitchScores.push(score);state.voiceScores.push(score);save();const missing=["проблема","решение","рынок","traction/цифры","модель","ICP","конкуренция","команда","раунд","use of funds"].filter((_,i)=>!present[i]);const el=$("#pitchScore");if(el)el.innerHTML=`<div class="feedback"><strong>Оценка pitch: ${score}/100</strong><p>${score>=80?'Структура сильная. Теперь сокращайте лишнее и тренируйте ответы на вопросы.':score>=60?'Хорошая основа. Добавьте конкретные цифры и причинную связь.':'Pitch пока больше похож на описание продукта. Нужна инвестиционная логика.'}</p><p class="small"><strong>Не хватает:</strong> ${missing.join(', ')||'ключевые блоки найдены'}.</p></div>`;renderDashboard()}

const SIM=[
{q:"Расскажите о компании за одну минуту.",good:["проблем","решен","клиент","рын"],numbers:false,tip:"Проблема → для кого → решение → доказательство."},
{q:"Кто ваш первый узкий целевой клиент и почему именно он?",good:["сегмент","клиент","icp","боль"],numbers:false,tip:"Назовите конкретный сегмент, не «все»."},
{q:"Какие данные доказывают, что продукт нужен рынку?",good:["retention","выруч","mrr","клиент","рост","плат"],numbers:true,tip:"Скачивания слабее retention, активного использования и выручки."},
{q:"Какова ваша unit economics: CAC, LTV, gross margin и payback?",good:["cac","ltv","марж","payback","окуп"],numbers:true,tip:"Если метрики ещё неизвестны, честно назовите, что измеряете и к какой дате получите данные."},
{q:"Как вы будете масштабировать go-to-market без пропорционального роста затрат?",good:["gtm","канал","organic","plg","sales","cac","conversion"],numbers:false,tip:"Опишите повторяемый канал и economics."},
{q:"Кто ваши конкуренты и почему вы выиграете?",good:["конкур","альтернатив","moat","преимущ","position"],numbers:false,tip:"Никогда не отвечайте «конкурентов нет»."},
{q:"Сколько вы привлекаете, на сколько месяцев runway и какие milestones должны получить?",good:["раунд","привлека","runway","месяц","milestone","капитал"],numbers:true,tip:"Свяжите сумму с временем и измеримыми результатами."},
{q:"Назовите три главных риска и что вы делаете для их снижения.",good:["риск","если","сниз","провер","план"],numbers:false,tip:"Сильный основатель не отрицает риск, а управляет им."},
{q:"Почему именно ваша команда имеет право выиграть этот рынок?",good:["опыт","команд","insight","сеть","эксперт","traction"],numbers:false,tip:"Founder-market fit — конкретный опыт и уникальный insight."},
{q:"Почему сейчас правильный момент для этой компании?",good:["сейчас","рынок","технолог","регуля","поведен","измен"],numbers:false,tip:"Why Now должно опираться на изменение среды, а не на желание основателя."}
];
function renderInvestor(){const msgs=state.messages.length?state.messages:[{who:"ai",text:SIM[Math.min(state.simStep,SIM.length-1)].q}];$("#view-investor").innerHTML=`<div class="grid grid-2"><div class="card voice-card"><div class="row between"><div><span class="tag">ГОЛОСОВОЙ СИМУЛЯТОР</span><h2>Встреча с инвестором</h2></div><span class="muted small">${Math.min(state.simStep+1,SIM.length)}/${SIM.length}</span></div><div class="sim-chat" id="simChat">${msgs.map(m=>`<div class="bubble ${m.who}">${safe(m.text)}</div>`).join("")}</div><p class="muted">Ответьте голосом. Можно говорить долго: распознанный текст накапливается. Ответ уходит только после кнопки «Отправить ответ».</p>${voicePanel('sim')}<div class="row"><button class="btn secondary" onclick="resetSim()">Начать заново</button></div></div><div class="card"><h3>Что оценивает тренер</h3><p class="muted">Прямой ответ на вопрос, конкретика, цифры там, где они нужны, отсутствие red flags и понимание причинно-следственной связи.</p><div id="simFeedback"><div class="feedback">${state.simStep?'Следующий вопрос сложнее предыдущего.':'Начните коротко и конкретно.'}</div></div><h3>Red flags</h3><div>${["У нас нет конкурентов","Наш клиент — каждый","Скачивания = PMF","Нам нужен только маркетинг","Мы не знаем ключевые метрики"].map(x=>`<span class="tag red-flag">🚩 ${x}</span>`).join("")}</div></div></div>`;const chat=$("#simChat");if(chat)chat.scrollTop=chat.scrollHeight;restoreVoiceTranscript('sim')}
function evaluateSim(text){const step=Math.min(state.simStep,SIM.length-1),s=SIM[step],low=(text||"").toLowerCase();const hits=s.good.filter(k=>low.includes(k)).length;let score=40+Math.round(hits/Math.max(1,s.good.length)*45);if(s.numbers&&/\d/.test(low))score+=15;score=Math.min(100,score);state.messages.push({who:"you",text:text},{who:"ai",text:step+1<SIM.length?SIM[step+1].q:"Базовая встреча завершена. Повторите её позже: вопросы те же, но ответы должны стать короче, точнее и сильнее по цифрам."});state.simStep=Math.min(step+1,SIM.length);state.voiceScores.push(score);setDaily('sim');save();voiceBuffers.sim="";renderInvestor();setTimeout(()=>{const f=$("#simFeedback");if(f)f.innerHTML=`<div class="feedback"><strong>Оценка ответа: ${score}/100</strong><p>${score>=80?'Сильный ответ.':score>=60?'Смысл есть, но добавьте больше доказательств и точности.':'Ответ пока не закрывает инвесторский вопрос.'}</p><p class="small">${s.tip}</p></div>`},30);renderDashboard()}
function resetSim(){state.simStep=0;state.messages=[];voiceBuffers.sim="";save();renderInvestor()}

function renderRoadmap(){const mode=state.courseMode||"30";const arr=mode==="7"?WEEK_COURSE:COURSE;$("#view-roadmap").innerHTML=`<div class="card"><div class="row between roadmap-head"><div><span class="tag">УЧЕБНЫЙ ТРЕК</span><h2>${mode==='7'?'Интенсив за 7 дней':'Системный курс на 30 дней'}</h2><p class="muted">Курс не заменяет повторения: завершённый день не считается освоенным, пока слабые темы не прошли несколько успешных интервалов.</p></div><div class="course-switch"><button class="${mode==='7'?'active':''}" onclick="setCourseMode('7')">7 дней</button><button class="${mode==='30'?'active':''}" onclick="setCourseMode('30')">30 дней</button></div></div></div><div class="timeline roadmap-timeline">${arr.map((c,i)=>{const d=i+1,done=mode==='30'&&state.day>d;return `<div class="card day ${done?'done':''}"><div class="day-num">${done?'✓':'Д'+d}</div><div><h3>${c[0]}</h3><p>${c[1]}</p><div class="row"><button class="btn secondary" onclick="go('learn')">Термины</button><button class="btn secondary" onclick="go('train')">Тест</button>${d>=5?`<button class="btn secondary" onclick="go('investor')">Голосовая практика</button>`:''}</div></div></div>`}).join("")}</div>${mode==='30'?`<div class="card roadmap-rule"><h3>Завершение дня</h3><p class="muted">Завершайте день после активного повторения, а не после чтения. На следующий день приложение снова покажет то, что пора вспоминать.</p><button class="btn" onclick="advanceDay()">Завершить сегодняшний день</button></div>`:''}`}
function setCourseMode(m){state.courseMode=m;save();renderRoadmap()} function advanceDay(){if(state.day<30){state.day++;state.streak++;save();renderAll();toast("День завершён. Повторения уже запланированы.")}else toast("30-дневный курс завершён")}

// Voice capture: accumulated speech is only submitted when the user presses Send.
const voiceBuffers={speak:"",pitch:"",sim:"",coach:""};let recognition=null,voiceChannel=null,voiceRunning=false,voiceStoppingForSend=false;
function voicePanel(ch){return `<div class="voice-recorder" id="voice-${ch}"><div class="voice-status"><span class="rec-dot"></span><strong id="voiceStatus-${ch}">Готов к записи</strong><small>Распознавание речи выполняет браузер</small></div><div class="voice-transcript" id="voiceTranscript-${ch}">Ваш распознанный ответ появится здесь.</div><div class="row action-row"><button class="btn" id="voiceStart-${ch}" onclick="toggleVoice('${ch}')">🎙 Начать голосовой ответ</button><button class="btn send-voice" onclick="submitVoice('${ch}')">➤ Отправить</button></div></div>`}
function speechAvailable(){return 'SpeechRecognition' in window||'webkitSpeechRecognition' in window}
function restoreVoiceTranscript(ch){const el=$("#voiceTranscript-"+ch);if(el&&voiceBuffers[ch])el.textContent=voiceBuffers[ch]}
function setVoiceUI(ch,status,running){const st=$("#voiceStatus-"+ch),btn=$("#voiceStart-"+ch),wrap=$("#voice-"+ch);if(st)st.textContent=status;if(btn){btn.textContent=running?'● Запись идёт':'🎙 Начать запись';btn.disabled=!!running}if(wrap)wrap.classList.toggle('recording',running)}
function toggleVoice(ch){if(voiceRunning&&voiceChannel===ch){toast('Чтобы закончить запись, нажмите «Отправить».');return}startVoice(ch)}
function startVoice(ch){if(!speechAvailable()){toast("В этом браузере нет SpeechRecognition. Для голосовой тренировки используйте Chrome/Edge на Android/desktop или Safari с поддержкой распознавания речи.");return}if(voiceRunning)stopVoice(false);const R=window.SpeechRecognition||window.webkitSpeechRecognition;recognition=new R();recognition.lang='ru-RU';recognition.continuous=true;recognition.interimResults=true;voiceChannel=ch;voiceRunning=true;voiceStoppingForSend=false;let sessionFinal="";recognition.onstart=()=>setVoiceUI(ch,'Идёт запись…',true);recognition.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const tx=e.results[i][0].transcript;if(e.results[i].isFinal)sessionFinal+=(sessionFinal?' ':'')+tx;else interim+=tx}const base=[voiceBuffers[ch],sessionFinal].filter(Boolean).join(' ').trim();const el=$("#voiceTranscript-"+ch);if(el)el.textContent=(base+(interim?' '+interim:'')).trim()||'Слушаю…'};recognition.onerror=e=>{if(e.error!=='no-speech'&&e.error!=='aborted')toast('Ошибка распознавания: '+e.error)};recognition.onend=()=>{if(sessionFinal){voiceBuffers[ch]=[voiceBuffers[ch],sessionFinal].filter(Boolean).join(' ').trim();sessionFinal=""}restoreVoiceTranscript(ch);if(voiceRunning&&voiceChannel===ch&&!voiceStoppingForSend){try{recognition.start();return}catch(_){}}voiceRunning=false;setVoiceUI(ch,'Запись остановлена',false);if(voiceStoppingForSend){voiceStoppingForSend=false;finalSubmit(ch)}};try{recognition.start()}catch(e){voiceRunning=false;toast('Не удалось запустить микрофон')}}
function stopVoice(forSend){if(!voiceRunning||!recognition){if(forSend)finalSubmit(voiceChannel);return}voiceStoppingForSend=forSend;voiceRunning=false;try{recognition.stop()}catch(_){if(forSend)finalSubmit(voiceChannel)}}
function submitVoice(ch){voiceChannel=ch;if(voiceRunning&&voiceChannel===ch){voiceStoppingForSend=true;voiceRunning=false;try{recognition.stop()}catch(_){finalSubmit(ch)}}else finalSubmit(ch)}
function finalSubmit(ch){const text=(voiceBuffers[ch]||"").trim();if(!text){toast("Сначала запишите голосовой ответ.");return}setVoiceUI(ch,'Ответ отправлен',false);if(ch==='speak')evaluateSpeak(text);if(ch==='pitch')scorePitchText(text);if(ch==='sim')evaluateSim(text)}

const views={dashboard:"Главная",learn:"Изучение",coach:"Coach",train:"Тесты",speak:"Живая речь",pitch:"Pitch",investor:"Симуляция инвестора",roadmap:"Курс"};
let currentView="dashboard",historyReady=false;
function pushAppHistory(view,extra={}){if(!historyReady)return;const next={view,...extra},cur=history.state||{};if(cur.view===next.view&&cur.coachSession===next.coachSession&&cur.coachIndex===next.coachIndex)return;history.pushState(next,"",location.href)}
function go(v,opts={}){if(voiceRunning){if(typeof cancelVoiceCapture==='function')cancelVoiceCapture();else stopVoice(false);}$$('.view').forEach(x=>x.classList.remove('active'));const target=$("#view-"+v);if(target)target.classList.add('active');$$('.nav-item,.bottom-nav-item').forEach(x=>{const active=x.dataset.view===v;x.classList.toggle('active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});const title=$("#pageTitle");if(title)title.textContent=views[v]||v;currentView=v;renderView(v);if(opts.focus!==false&&target)try{target.focus({preventScroll:true})}catch{}window.scrollTo({top:0,behavior:opts.history===false?'auto':'smooth'});const sb=$('.sidebar');if(sb)sb.classList.remove('open');if(mm)mm.setAttribute('aria-expanded','false');if(opts.history!==false)pushAppHistory(v,{coachSession:v==='coach'?!!coachSession:false,coachIndex:v==='coach'&&coachSession?coachSession.index:null})}
function restoreHistoryState(st){const target=st?.view||"dashboard";if(target==='coach'){if(st.coachSession===false)coachSession=null;else if(coachSession&&Number.isInteger(st.coachIndex))coachSession.index=Math.max(0,Math.min(st.coachIndex,coachSession.tasks.length));go('coach',{history:false});return}go(target,{history:false})}
window.addEventListener('popstate',e=>restoreHistoryState(e.state));
function renderView(v){({dashboard:renderDashboard,learn:renderLearn,coach:renderCoach,train:renderTrain,speak:renderSpeak,pitch:renderPitch,investor:renderInvestor,roadmap:renderRoadmap})[v]?.()}
function renderAll(){renderDashboard();renderLearn();renderCoach();renderTrain();renderSpeak();renderPitch();renderInvestor();renderRoadmap();$("#streak").textContent=state.streak;$("#dayLabel").textContent=`День ${state.day} из 30`;$("#sideProgress").style.width=(state.day/30*100)+'%'}
const mm=$("#mobileMenu");$$('.nav-item,.bottom-nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));if(mm){mm.setAttribute('aria-expanded','false');mm.addEventListener('click',()=>{const sb=$('.sidebar'),open=!sb.classList.contains('open');sb.classList.toggle('open',open);mm.setAttribute('aria-expanded',String(open))})}renderAll();history.replaceState({view:'dashboard',coachSession:false,coachIndex:null},'',location.href);historyReady=true;

// PWA installation/update logic kept intact and update checks remain network-first.
let deferredInstallPrompt=null;const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function setInstallState(){const b=$("#installApp"),t=$("#installState");if(!b||!t)return;if(isStandalone()){b.hidden=true;t.hidden=false;t.textContent='Приложение установлено'}else{t.hidden=true;b.hidden=false;b.textContent='Установить приложение'}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;setInstallState()});addEventListener('appinstalled',()=>{deferredInstallPrompt=null;setInstallState();toast('Приложение установлено')});
async function installApp(){if(isStandalone()){setInstallState();return}if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;setInstallState();return}openInstallHelp()}
let installModalReturnFocus=null;function openInstallHelp(){installModalReturnFocus=document.activeElement;const m=$("#installModal"),body=$("#installHelpText");if(isIOS())body.innerHTML='<strong>iPhone / iPad:</strong><br>1. Откройте сайт в Safari.<br>2. Нажмите <strong>«Поделиться»</strong>.<br>3. Выберите <strong>«На экран „Домой“»</strong>.<br>4. Подтвердите добавление.';else body.innerHTML='<strong>Android:</strong><br>Откройте меню браузера и выберите <strong>«Установить приложение»</strong> или используйте системную кнопку установки.';m.hidden=false;document.body.classList.add('modal-open');setTimeout(()=>$("#installClose")?.focus(),0)}
function closeInstallHelp(){$("#installModal").hidden=true;document.body.classList.remove('modal-open');if(installModalReturnFocus&&typeof installModalReturnFocus.focus==='function')installModalReturnFocus.focus();installModalReturnFocus=null}$("#installApp")?.addEventListener('click',installApp);$("#installClose")?.addEventListener('click',closeInstallHelp);$("#installModal")?.addEventListener('click',e=>{if(e.target.id==='installModal')closeInstallHelp()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$("#installModal")?.hidden)closeInstallHelp()});setInstallState();
function updateCanActivate(){return !voiceRunning&&!coachSession&&!state.exam?.active&&!state.accel?.active}
if('serviceWorker' in navigator)addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await reg.update();let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});const activateWaiting=()=>{if(reg.waiting&&updateCanActivate())reg.waiting.postMessage({type:'SKIP_WAITING'})};activateWaiting();reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){if(updateCanActivate())w.postMessage({type:'SKIP_WAITING'});else toast('Обновление готово и установится после текущей сессии.')}})});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')activateWaiting()})}catch(err){console.error('Service Worker:',err)}});


/* ===== Production learning engine + AI Investor v5 ===== */
state.aiMemory=state.aiMemory||"";
state.aiHistory=state.aiHistory||[];
state.aiWeakTopics=state.aiWeakTopics||[];
state.aiScores=state.aiScores||[];
state.projectProfile=state.projectProfile||{};
state.sessionPlan=state.sessionPlan||{};

function apiBase(){return (localStorage.getItem('investorCoachApiBase')||(window.INVESTOR_COACH_CONFIG&&window.INVESTOR_COACH_CONFIG.apiBase)||'').replace(/\/$/,'')}
function aiReady(){return /^https:\/\//.test(apiBase())}
function saveApiBase(){const el=document.querySelector('#aiApiBase');if(!el)return;const v=el.value.trim().replace(/\/$/,'');if(v&&!/^https:\/\//.test(v)){toast('Нужен HTTPS URL AI-backend.');return}localStorage.setItem('investorCoachApiBase',v);toast(v?'AI-backend сохранён.':'AI-backend отключён.');renderAll()}
function aiStatusHtml(){return aiReady()?'<span class="ai-pill online">● AI подключён</span>':'<span class="ai-pill offline">● Локальный режим</span>'}
function priorityScore(t){const s=srsInfo(t.id),now=new Date(today()+'T12:00:00'),due=new Date((s.due||today())+'T12:00:00');const overdue=Math.max(0,Math.round((now-due)/86400000));const attempts=(s.right||0)+(s.wrong||0);const errorRate=attempts?(s.wrong||0)/attempts:.45;const novelty=attempts?0:1;const weak=state.weak.includes(t.id)?2:0;const aiWeak=state.aiWeakTopics.some(x=>(t.word+' '+t.cat+' '+t.full).toLowerCase().includes(String(x).toLowerCase()))?1.5:0;return overdue*1.6+errorRate*4+novelty*2+weak+aiWeak-(s.box||0)*.7}
buildQuizQueue=function(){return [...QUIZ].sort((a,b)=>priorityScore(term(b.termId)||TERMS[0])-priorityScore(term(a.termId)||TERMS[0]))}
chooseSpeakTerm=function(){speakTerm=[...TERMS].sort((a,b)=>priorityScore(b)-priorityScore(a))[0]||TERMS[0]}
function readinessScore(){const knowledge=mastery();const voice=state.aiScores.length?Math.round(state.aiScores.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,state.aiScores.length)):(state.voiceScores.length?Math.round(state.voiceScores.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,state.voiceScores.length)):0);const tests=pct(state.correct,state.total);return Math.round(knowledge*.4+tests*.25+voice*.35)}
function todayPlan(){const due=dueTerms().slice(0,8).map(t=>t.word);const weak=[...TERMS].sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,3).map(t=>t.word);return {review:due,newCount:Math.min(4,Math.max(1,8-due.length)),voice:weak[0]||'CAC',investor:state.aiWeakTopics[0]||weak[1]||'unit economics'} }
const _renderDashboardProd=renderDashboard;
renderDashboard=function(){_renderDashboardProd()}

async function aiCoach(mode,text,extra={}){if(!aiReady())throw new Error('AI_NOT_CONFIGURED');const payload={mode,transcript:text,memory:state.aiMemory,history:state.aiHistory.slice(-12),weak_topics:state.aiWeakTopics.slice(0,12),course_day:state.day,project_profile:state.projectProfile,context:extra};const r=await fetch(apiBase()+'/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok){const e=await r.text();throw new Error('AI '+r.status+': '+e.slice(0,180))}return r.json()}
function applyAiResult(res,mode,userText){const score=Math.max(0,Math.min(100,Number(res.score)||0));state.aiScores.push(score);state.voiceScores.push(score);state.aiMemory=String(res.memory_summary||state.aiMemory||'').slice(0,6000);state.aiWeakTopics=[...new Set([...(res.focus_topics||[]),...state.aiWeakTopics])].slice(0,20);state.aiHistory.push({role:'user',text:userText.slice(0,5000)},{role:'investor',text:String(res.next_question||res.verdict||'').slice(0,1500)});state.aiHistory=state.aiHistory.slice(-30);save();return score}
function feedbackHtml(res){return `<div class="feedback ai-feedback"><div class="row between"><strong>AI-оценка: ${safe(res.score)}/100</strong><span class="tag">production AI</span></div><p>${safe(res.verdict)}</p>${(res.strengths||[]).length?`<p><strong>Сильные стороны:</strong> ${(res.strengths||[]).map(safe).join(' • ')}</p>`:''}${(res.improvements||[]).length?`<p><strong>Исправить:</strong> ${(res.improvements||[]).map(safe).join(' • ')}</p>`:''}${(res.red_flags||[]).length?`<p><strong>Red flags:</strong> ${(res.red_flags||[]).map(safe).join(' • ')}</p>`:''}${res.model_answer?`<details><summary>Показать сильный вариант ответа</summary><p>${safe(res.model_answer)}</p></details>`:''}</div>`}

const _renderPitchProd=renderPitch;
renderPitch=function(){_renderPitchProd();const card=document.querySelector('#view-pitch .voice-card');if(card){const badge=document.createElement('div');badge.className='ai-mode-line';badge.innerHTML=`${aiStatusHtml()} <span class="small muted">При AI-режиме оценивается смысл, логика, цифры, investor narrative и риски.</span>`;card.prepend(badge)}}
renderInvestor=function(){const msgs=state.messages.length?state.messages:[{who:'ai',text:(state.aiHistory.slice().reverse().find(x=>x.role==='investor')||{}).text||SIM[Math.min(state.simStep,SIM.length-1)].q}];document.querySelector('#view-investor').innerHTML=`<div class="grid grid-2"><div class="card voice-card"><div class="row between"><div><span class="tag">PRODUCTION AI INVESTOR</span><h2>Голосовая встреча с инвестором</h2></div>${aiStatusHtml()}</div><div class="sim-chat" id="simChat">${msgs.map(m=>`<div class="bubble ${m.who}">${safe(m.text)}</div>`).join('')}</div><p class="muted">Нажмите запись, говорите как на реальной встрече и только затем нажмите «Отправить». В AI-режиме вопрос формируется из вашего предыдущего ответа и слабых мест, а не идёт по фиксированному скрипту.</p>${voicePanel('sim')}<div class="row"><button class="btn secondary" onclick="resetSim()">Новая встреча</button></div></div><div class="card"><h3>AI-память и адаптация</h3><p class="muted">Инвестор помнит факты вашего проекта, замечает противоречия и возвращается к слабым темам.</p><div id="simFeedback"><div class="feedback">${state.aiMemory?safe(state.aiMemory):'Память проекта сформируется после первых ответов.'}</div></div>${!aiReady()?`<div class="ai-connect"><h3>Подключить production AI</h3><p class="small muted">GitHub Pages не хранит секретные API-ключи. Разверните backend из папки <code>backend</code> и вставьте его HTTPS URL один раз.</p><input id="aiApiBase" class="input" placeholder="https://investor-coach-ai.YOUR.workers.dev" value="${safe(apiBase())}"><button class="btn" onclick="saveApiBase()">Сохранить AI URL</button></div>`:''}</div></div>`;const chat=document.querySelector('#simChat');if(chat)chat.scrollTop=chat.scrollHeight;restoreVoiceTranscript('sim')}

async function evaluateWithAI(ch,text){const status=document.querySelector('#voiceStatus-'+ch);if(status)status.textContent='AI анализирует ответ…';try{let extra={};if(ch==='speak')extra={term:{word:speakTerm.word,definition:speakTerm.simple,example:speakTerm.example,investor:speakTerm.investor}};else if(ch==='pitch')extra={pitch_topic:pitchTopic};else if(ch==='coach'){const task=coachSession?.tasks?.[coachSession.index],t=task?term(task.termId):null;extra={training_mode:"coach_speech",term:t?{word:t.word,definition:t.simple,example:t.example,investor:t.investor,why:t.why}:null,prompt:task?.prompt||""}}
 const res=await aiCoach(ch,text,extra),score=applyAiResult(res,ch,text);
 if(ch==='speak'){updateSRS(speakTerm.id,score>=75);setDaily('voice');const el=document.querySelector('#speakResult');if(el)el.innerHTML=feedbackHtml(res)}
 else if(ch==='pitch'){state.pitchScores.push(score);const el=document.querySelector('#pitchScore');if(el)el.innerHTML=feedbackHtml(res)}
 else if(ch==='sim'){state.messages.push({who:'you',text},{who:'ai',text:res.next_question||'Продолжайте.'});setDaily('sim');voiceBuffers.sim='';renderInvestor();setTimeout(()=>{const f=document.querySelector('#simFeedback');if(f)f.innerHTML=feedbackHtml(res)},20)}
 else if(ch==='coach'){const task=coachSession?.tasks?.[coachSession.index];if(task&&task.type==='speech'&&!task.answered){task.answered=true;task.score=score;task.feedback=feedbackHtml(res);coachRecordResult(task,score>=75);voiceBuffers.coach="";save();renderCoach();renderDashboard()}}
 save();renderDashboard();if(status)status.textContent='Ответ оценён'}catch(e){console.error(e);toast(e.message==='AI_NOT_CONFIGURED'?'AI не подключён — использую локальную оценку.':'AI временно недоступен — использую локальную оценку.');if(ch==='speak')evaluateSpeak(text);if(ch==='pitch')scorePitchText(text);if(ch==='sim')evaluateSim(text);if(ch==='coach')evaluateCoachSpeechLocal(text)}}
function evaluateCoachSpeechLocal(text){const task=coachSession?.tasks?.[coachSession.index];if(!task||task.type!=="speech"||task.answered)return;const t=term(task.termId),r=coachSpeechLocal(text,t);task.answered=true;task.score=r.score;task.feedback=`<div class="feedback"><strong>Оценка речи: ${r.score}/100</strong><p>${safe(r.feedback)}</p><p class="small"><strong>Сильный ориентир:</strong> ${safe(coachGuide(t).best)}</p></div>`;coachRecordResult(task,r.score>=70);voiceBuffers.coach="";save();renderCoach();renderDashboard()}


// Real recorder: audio is kept locally until Send, then transcribed server-side.
const mediaState={recorder:null,stream:null,ch:null,chunks:[],startedAt:0};
function cancelVoiceCapture(){try{if(mediaState.recorder&&(mediaState.recorder.state==='recording'||mediaState.recorder.state==='paused'))mediaState.recorder.stop()}catch(_){}try{mediaState.stream?.getTracks().forEach(t=>t.stop())}catch(_){}mediaState.recorder=null;mediaState.stream=null;mediaState.ch=null;mediaState.chunks=[];voiceRunning=false;if(recognition){try{recognition.abort()}catch(_){}}}
function canMediaRecord(){return !!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder)}
voicePanel=function(ch){return `<div class="voice-recorder" id="voice-${ch}"><div class="voice-status"><span class="rec-dot"></span><strong id="voiceStatus-${ch}">Готов к записи</strong><small>${aiReady()?'Запись хранится локально и отправляется только после кнопки «Отправить»':'Для точной расшифровки подключите production AI'}</small></div><div class="voice-transcript" id="voiceTranscript-${ch}">${voiceBuffers[ch]||'Во время записи можно говорить свободно. Текст появится после отправки.'}</div><div class="row action-row"><button class="btn" id="voiceStart-${ch}" onclick="toggleVoice('${ch}')">🎙 Начать запись</button><button class="btn send-voice" onclick="submitVoice('${ch}')">➤ Отправить</button></div></div>`}
async function startMediaVoice(ch){if(mediaState.recorder&&mediaState.recorder.state==='recording')return;try{const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});let mime='';for(const t of ['audio/webm;codecs=opus','audio/mp4','audio/webm']){if(MediaRecorder.isTypeSupported(t)){mime=t;break}}const rec=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:48000}:{audioBitsPerSecond:48000});mediaState.recorder=rec;mediaState.stream=stream;mediaState.ch=ch;mediaState.chunks=[];mediaState.startedAt=Date.now();voiceChannel=ch;voiceRunning=true;rec.ondataavailable=e=>{if(e.data&&e.data.size)mediaState.chunks.push(e.data)};rec.onstop=()=>{voiceRunning=false;setVoiceUI(ch,'Запись готова к отправке',false);stream.getTracks().forEach(t=>t.stop())};rec.start(1000);setVoiceUI(ch,'Идёт запись…',true);const el=document.querySelector('#voiceTranscript-'+ch);if(el)el.textContent='● Запись идёт. Нажмите «Отправить», когда закончите.'}catch(e){console.error(e);toast('Нет доступа к микрофону.');}}
toggleVoice=async function(ch){if(aiReady()&&canMediaRecord()){if(mediaState.recorder&&mediaState.ch===ch&&(mediaState.recorder.state==='recording'||mediaState.recorder.state==='paused')){toast('Чтобы закончить запись, нажмите «Отправить».');return}await startMediaVoice(ch);return}if(voiceRunning&&voiceChannel===ch){toast('Чтобы закончить запись, нажмите «Отправить».');return}startVoice(ch)}
async function transcribeBlob(blob){const fd=new FormData();const ext=blob.type.includes('mp4')?'m4a':'webm';fd.append('file',blob,'answer.'+ext);fd.append('language','ru');const r=await fetch(apiBase()+'/api/transcribe',{method:'POST',body:fd});if(!r.ok)throw new Error('TRANSCRIBE_'+r.status);const j=await r.json();return (j.text||'').trim()}
submitVoice=async function(ch){voiceChannel=ch;if(aiReady()&&mediaState.recorder&&mediaState.ch===ch&&(mediaState.recorder.state==='recording'||mediaState.recorder.state==='paused')){const rec=mediaState.recorder;const done=new Promise(resolve=>rec.addEventListener('stop',resolve,{once:true}));if(rec.state==='paused')rec.resume();rec.stop();await done;const blob=new Blob(mediaState.chunks,{type:rec.mimeType||'audio/webm'});if(blob.size<1000){toast('Запись слишком короткая.');return}setVoiceUI(ch,'Распознаю запись…',false);try{const text=await transcribeBlob(blob);voiceBuffers[ch]=text;const el=document.querySelector('#voiceTranscript-'+ch);if(el)el.textContent=text||'Речь не распознана.';if(!text){toast('Не удалось распознать речь.');return}await evaluateWithAI(ch,text)}catch(e){console.error(e);toast('Не удалось отправить аудио. Проверьте AI-backend.')}finally{mediaState.recorder=null;mediaState.chunks=[]}return}if(voiceRunning&&voiceChannel===ch){voiceStoppingForSend=true;voiceRunning=false;try{recognition.stop()}catch(_){finalSubmit(ch)}}else finalSubmit(ch)}
finalSubmit=async function(ch){const text=(voiceBuffers[ch]||'').trim();if(!text){toast('Сначала запишите голосовой ответ.');return}setVoiceUI(ch,'Ответ отправлен',false);if(aiReady())await evaluateWithAI(ch,text);else{if(ch==='speak')evaluateSpeak(text);if(ch==='pitch')scorePitchText(text);if(ch==='sim')evaluateSim(text);if(ch==='coach')evaluateCoachSpeechLocal(text)}}
resetSim=function(){state.simStep=0;state.messages=[];state.aiHistory=[];voiceBuffers.sim='';save();renderInvestor()}


// Production Accelerated Coach v7: silent, persistent 1/3/6-hour learning sessions.
state.accel=Object.assign({active:false,targetMin:360,startedAt:0,pausedAt:0,totalPauseMs:0,blockIndex:0,completedBlocks:0,hints:true},state.accel||{});
let accelTicker=null,accelWakeLock=null,lastAccelPhase=-1;
const ACCEL_BLOCK_MIN=20,ACCEL_BREAK_MIN=5;
const ACCEL_TASKS=[
  {view:'learn',title:'Термины',desc:'Короткие карточки и примеры.'},
  {view:'speak',title:'Голосовая практика',desc:'Объясните термин своими словами.'},
  {view:'investor',title:'AI-инвестор',desc:'Отвечайте голосом на вопросы инвестора.'},
  {view:'pitch',title:'Pitch',desc:'Проблема → решение → рынок → traction → ask.'},
  {view:'train',title:'Тесты',desc:'Ответьте и сразу разберите ошибку.'}
];
function accelElapsedMs(){const a=state.accel;if(!a.startedAt)return 0;const end=a.pausedAt||Date.now();return Math.max(0,end-a.startedAt-(a.totalPauseMs||0))}
function accelTargetMs(){return (state.accel.targetMin||360)*60000}
function accelRemainingMs(){return Math.max(0,accelTargetMs()-accelElapsedMs())}
function formatDuration(ms){const total=Math.max(0,Math.floor(ms/1000)),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),sec=total%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`}
function accelCyclePosition(){const work=ACCEL_BLOCK_MIN*60000,br=ACCEL_BREAK_MIN*60000,cycle=work+br,pos=accelElapsedMs()%cycle;return {isBreak:pos>=work,remaining:(pos>=work?cycle:work)-pos}}
function accelTask(){const workBlocks=Math.floor(accelElapsedMs()/((ACCEL_BLOCK_MIN+ACCEL_BREAK_MIN)*60000));return ACCEL_TASKS[workBlocks%ACCEL_TASKS.length]}
function accelProgress(){return Math.min(100,Math.round(accelElapsedMs()/Math.max(1,accelTargetMs())*100))}
function accelIsPaused(){return !!state.accel.pausedAt}
function accelStatusText(){if(!state.accel.active)return 'Не запущен';if(accelIsPaused())return 'Пауза';return accelCyclePosition().isBreak?'Перерыв':'Сессия идёт'}
async function requestWakeLock(){if(!state.accel.active||accelIsPaused()||!('wakeLock' in navigator))return;try{if(!accelWakeLock)accelWakeLock=await navigator.wakeLock.request('screen');accelWakeLock.addEventListener?.('release',()=>{accelWakeLock=null})}catch(_){accelWakeLock=null}}
async function releaseWakeLock(){try{await accelWakeLock?.release()}catch(_){}accelWakeLock=null}
function setAccelTarget(min){if(state.accel.active){toast('Сначала завершите текущую сессию.');return}state.accel.targetMin=min;save();refreshAccelUI()}
async function startAccel(min=state.accel.targetMin||360){state.accel={...state.accel,active:true,targetMin:min,startedAt:Date.now(),pausedAt:0,totalPauseMs:0,blockIndex:0,completedBlocks:0,hints:state.accel.hints!==false};save();lastAccelPhase=-1;await requestWakeLock();startAccelTicker();refreshAccelUI();toast('Ускоренный коуч запущен')}
async function pauseAccel(){if(!state.accel.active||accelIsPaused())return;state.accel.pausedAt=Date.now();save();await releaseWakeLock();refreshAccelUI()}
async function resumeAccel(){if(!state.accel.active||!accelIsPaused())return;const now=Date.now();state.accel.totalPauseMs=(state.accel.totalPauseMs||0)+(now-state.accel.pausedAt);state.accel.pausedAt=0;save();await requestWakeLock();refreshAccelUI()}
async function stopAccel(completed=false){if(!state.accel.active)return;state.accel.active=false;state.accel.pausedAt=0;save();await releaseWakeLock();clearInterval(accelTicker);accelTicker=null;refreshAccelUI();toast(completed?'Интенсив завершён':'Сессия завершена')}
function toggleAccelHints(){state.accel.hints=state.accel.hints===false;save();refreshAccelUI()}
function openAccelTask(){if(!state.accel.active)return;go(accelTask().view)}
function accelBlockNumber(){return Math.floor(accelElapsedMs()/((ACCEL_BLOCK_MIN+ACCEL_BREAK_MIN)*60000))+1}
function maybeAdvanceAccel(){if(!state.accel.active||accelIsPaused())return;if(accelRemainingMs()<=0){stopAccel(true);return}const pos=accelCyclePosition(),phase=accelBlockNumber()*2+(pos.isBreak?1:0);if(phase!==lastAccelPhase){lastAccelPhase=phase;refreshAccelUI()}}
function accelCoachHtml(){
 const a=state.accel,pos=a.active?accelCyclePosition():{isBreak:false,remaining:ACCEL_BLOCK_MIN*60000},task=accelTask(),progress=accelProgress(),hints=a.hints!==false;
 const controls=a.active?`<div class="accel-controls-under-clock"><button class="btn secondary" onclick="resumeAccel()" ${!accelIsPaused()?'disabled':''}>Продолжить</button><button class="btn secondary" onclick="pauseAccel()" ${accelIsPaused()?'disabled':''}>Пауза</button><button class="btn" onclick="openAccelTask()">Открыть текущий блок</button><button class="btn secondary" onclick="toggleAccelHints()">${hints?'Скрыть подсказки':'Подсказки'}</button><button class="btn secondary danger-lite" onclick="stopAccel(false)">Завершить</button></div>`:'';
 return `<div class="card accel-coach ${a.active?'running':''}"><div class="accel-head"><div><span class="tag">УСКОРЕННОЕ ОБУЧЕНИЕ</span><h2>Интенсив</h2><p class="muted">1, 3 или 6 часов.</p></div><div class="accel-clock"><strong>${a.active?formatDuration(accelRemainingMs()):formatDuration(accelTargetMs())}</strong><small>${a.active?'осталось':'план'}</small>${controls}</div></div><div class="accel-targets">${[[60,'1 час'],[180,'3 часа'],[360,'6 часов']].map(([m,l])=>`<button class="${a.targetMin===m?'active':''}" onclick="setAccelTarget(${m})" ${a.active?'disabled':''}>${l}</button>`).join('')}</div>${a.active?`<div class="accel-live"><div class="row between"><strong>${accelStatusText()} · блок ${accelBlockNumber()}</strong><span>${progress}%</span></div><div class="progress"><div style="width:${progress}%"></div></div>${hints?`<div class="accel-task"><span>${pos.isBreak?'☕':'•'}</span><div><strong>${pos.isBreak?'Короткий перерыв':safe(task.title)}</strong><p>${pos.isBreak?'Можно сделать паузу, пройтись или сразу открыть следующий блок.':safe(task.desc)}</p><small>До следующего блока: ${formatDuration(pos.remaining)}</small></div></div>`:''}</div>`:`<div class="accel-preview"><p class="muted">Можно остановить и продолжить позже.</p><button class="btn accel-start" onclick="startAccel(${a.targetMin||360})">Запустить ускоренный коуч</button></div>`}</div>`
}
function refreshAccelUI(){document.querySelectorAll('[data-accel-slot]').forEach(el=>el.innerHTML=accelCoachHtml());if(state.accel.active&&!accelIsPaused())requestWakeLock()}
function startAccelTicker(){clearInterval(accelTicker);if(!state.accel.active)return;accelTicker=setInterval(()=>{maybeAdvanceAccel();refreshAccelUI()},1000);maybeAdvanceAccel()}

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.accel.active&&!accelIsPaused())requestWakeLock()});


function installCtaHtml(){return `<div class="card install-cta"><div><span class="tag">PWA ДЛЯ ТЕЛЕФОНА</span><h2>Investor Coach как приложение</h2><p class="muted">Установите сайт на телефон: отдельная иконка, standalone-режим и офлайн-доступ к основным материалам.</p></div><button class="btn install-download" onclick="installApp()">⬇ Скачать приложение</button></div>`}
const _renderDashboardV6=renderDashboard;
renderDashboard=function(){_renderDashboardV6();const root=document.querySelector('#view-dashboard');if(root){const top=document.createElement('div');top.className='v6-dashboard-top';top.innerHTML=installCtaHtml();root.prepend(top)}setInstallState()}
const _renderRoadmapV6=renderRoadmap;
renderRoadmap=function(){_renderRoadmapV6();const root=document.querySelector('#view-roadmap');if(root){const slot=document.createElement('div');slot.setAttribute('data-accel-slot','');slot.innerHTML=accelCoachHtml();root.prepend(slot)}}
const _setInstallStateV6=setInstallState;
setInstallState=function(){_setInstallStateV6();document.querySelectorAll('.install-download').forEach(b=>{if(isStandalone()){b.textContent='✓ Приложение установлено';b.disabled=true}else{b.textContent='⬇ Скачать приложение';b.disabled=false}})}

if(state.accel.active){if(state.accel.pausedAt&&state.accel.pausedAt<state.accel.startedAt)state.accel.pausedAt=0;startAccelTicker()}

renderAll();



/* ===== Professional Learning Engine v11 ===== */
state.skillProfile=state.skillProfile||{};
state.termSpeech=state.termSpeech||{};
state.simScenario=state.simScenario||"first_meeting";
state.simSession=Object.assign({active:false,turn:0,maxTurns:6,complete:false,scores:[],summary:"",lastFeedback:""},state.simSession||{});

const PROFESSIONAL_SKILLS={
 directness:"Прямой ответ",
 clarity:"Ясность",
 evidence:"Доказательность",
 metrics:"Цифры",
 terminology:"Терминология",
 risk_handling:"Работа с риском",
 structure:"Структура"
};
const INVESTOR_SCENARIOS={
 first_meeting:{title:"Первая встреча",desc:"Проверка инвестиционной истории: проблема, рынок, traction, экономика и команда.",opening:"Расскажите о компании за одну минуту: для кого вы работаете, какую проблему решаете и какое у вас главное доказательство спроса?"},
 investment_committee:{title:"Инвесткомитет",desc:"Жёсткая проверка допущений, экономики, конкуренции, рисков и использования капитала.",opening:"Начнём с главного риска. Какое допущение в вашей модели сейчас самое опасное и какими данными вы его проверяете?"},
 due_diligence:{title:"Due diligence",desc:"Проверка качества метрик и непротиворечивости фактов перед сделкой.",opening:"Назовите три метрики, на которые вы опираетесь при доказательстве качества бизнеса, и объясните, как именно они рассчитаны."}
};

function skillEntry(id){if(!state.skillProfile[id])state.skillProfile[id]={score:0,samples:0};return state.skillProfile[id]}
function updateSkillProfile(dimensions){
 if(!dimensions||typeof dimensions!=="object")return;
 Object.keys(PROFESSIONAL_SKILLS).forEach(id=>{
  const v=Number(dimensions[id]);if(!Number.isFinite(v))return;
  const s=skillEntry(id),n=Math.min(12,s.samples||0),old=Number(s.score||0);
  s.score=Math.round((old*n+Math.max(0,Math.min(100,v)))/(n+1));s.samples=n+1;
 });
}
function skillProfileScore(){const vals=Object.keys(PROFESSIONAL_SKILLS).map(k=>skillEntry(k)).filter(x=>x.samples>0).map(x=>x.score);return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0}
function termProfessionalScore(id){
 const t=term(id);if(!t)return 0;
 const s=srsInfo(id),c=coachStat(id),speech=Number(state.termSpeech[id]||0);
 const knowledge=Math.min(100,Math.round((s.box||0)/5*100));
 const applied=Math.min(100,Number(c.mastery||0));
 return Math.round(knowledge*.35+applied*.35+speech*.30);
}
function professionalKnowledgeScore(){return TERMS.length?Math.round(TERMS.reduce((sum,t)=>sum+termProfessionalScore(t.id),0)/TERMS.length):0}
function professionalReadiness(){
 const knowledge=professionalKnowledgeScore();
 const tests=pct(state.correct,state.total);
 const speech=skillProfileScore()||(state.aiScores.length?Math.round(state.aiScores.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,state.aiScores.length)):0);
 const sim=state.simSession.scores.length?Math.round(state.simSession.scores.slice(-8).reduce((a,b)=>a+b,0)/Math.min(8,state.simSession.scores.length)):speech;
 return Math.round(knowledge*.30+tests*.15+speech*.25+sim*.30);
}
readinessScore=professionalReadiness;

function weakestProfessionalSkill(){
 const sampled=Object.keys(PROFESSIONAL_SKILLS).map(id=>({id,...skillEntry(id)})).filter(x=>x.samples>0).sort((a,b)=>a.score-b.score);
 return sampled[0]||{id:"terminology",score:0,samples:0};
}
function nextBestTraining(){
 const weak=weakestProfessionalSkill();
 if(professionalKnowledgeScore()<60)return {view:"coach",title:"Coach",why:"Закрепить термины через применение, а не чтение."};
 if(weak.id==="terminology")return {view:"coach",title:"Coach",why:"Термины пока недостаточно свободно используются в речи."};
 if(["clarity","directness","structure"].includes(weak.id))return {view:"speak",title:"Живая речь",why:"Нужен короткий структурированный ответ без лишних слов."};
 if(["evidence","metrics","risk_handling"].includes(weak.id))return {view:"investor",title:"Встреча с инвестором",why:"Нужна практика доказательств, цифр и неудобных follow-up вопросов."};
 return {view:"investor",title:"Встреча с инвестором",why:"Следующий рост даст живая профессиональная практика."};
}
function skillBarsHtml(){
 return `<div class="skill-profile">${Object.entries(PROFESSIONAL_SKILLS).map(([id,label])=>{const s=skillEntry(id);return `<div class="skill-row"><div class="row between"><span>${label}</span><strong>${s.samples?s.score+"%":"—"}</strong></div><div class="progress"><div style="width:${s.samples?s.score:0}%"></div></div></div>`}).join("")}</div>`;
}

function startInvestorScenario(id){
 if(!INVESTOR_SCENARIOS[id])return;
 state.simScenario=id;
 state.simSession={active:true,turn:0,maxTurns:6,complete:false,scores:[],summary:"",lastFeedback:""};
 state.messages=[{who:"ai",text:INVESTOR_SCENARIOS[id].opening}];
 state.aiHistory=[];
 voiceBuffers.sim="";
 save();renderInvestor();
}
function simulatorScenarioTabs(){
 return `<div class="filterbar">${Object.entries(INVESTOR_SCENARIOS).map(([id,s])=>`<button class="${state.simScenario===id?'active':''}" onclick="startInvestorScenario('${id}')">${s.title}</button>`).join("")}</div>`;
}
function simulatorSummaryHtml(){
 if(!state.simSession.complete)return "";
 const avg=state.simSession.scores.length?Math.round(state.simSession.scores.reduce((a,b)=>a+b,0)/state.simSession.scores.length):0;
 const weak=weakestProfessionalSkill(),next=nextBestTraining();
 return `<div class="feedback"><strong>Встреча завершена · ${avg}/100</strong><p>${safe(state.simSession.summary||"Сессия завершена. Повторите слабое место в отдельной тренировке.")}</p><p><strong>Слабее всего:</strong> ${safe(PROFESSIONAL_SKILLS[weak.id])}${weak.samples?` · ${weak.score}%`:""}.</p><button class="btn" onclick="go('${next.view}')">Следующий лучший шаг: ${safe(next.title)}</button></div>`;
}

const _applyAiResultV10=applyAiResult;
applyAiResult=function(res,mode,userText){
 const score=_applyAiResultV10(res,mode,userText);
 updateSkillProfile(res.dimensions);
 if(mode==="sim"){state.simSession.scores.push(score);state.simSession.lastFeedback=res.verdict||""}
 save();return score;
};

feedbackHtml=function(res){
 const dims=res.dimensions||{};
 return `<div class="feedback ai-feedback"><div class="row between"><strong>AI-оценка: ${safe(res.score)}/100</strong><span class="tag">PRO COACH</span></div><p>${safe(res.verdict)}</p>
 ${(res.strengths||[]).length?`<p><strong>Сильные стороны:</strong> ${(res.strengths||[]).map(safe).join(" • ")}</p>`:""}
 ${(res.improvements||[]).length?`<p><strong>Исправить:</strong> ${(res.improvements||[]).map(safe).join(" • ")}</p>`:""}
 ${(res.contradictions||[]).length?`<p><strong>Противоречия:</strong> ${(res.contradictions||[]).map(safe).join(" • ")}</p>`:""}
 ${(res.red_flags||[]).length?`<p><strong>Red flags:</strong> ${(res.red_flags||[]).map(safe).join(" • ")}</p>`:""}
 ${Object.keys(PROFESSIONAL_SKILLS).some(k=>Number.isFinite(Number(dims[k])))?`<details><summary>Оценка навыков</summary>${Object.entries(PROFESSIONAL_SKILLS).map(([id,label])=>`<p class="small"><strong>${label}:</strong> ${safe(dims[id]??"—")}/100</p>`).join("")}</details>`:""}
 ${res.follow_up_reason?`<p class="small"><strong>Почему следующий вопрос:</strong> ${safe(res.follow_up_reason)}</p>`:""}
 ${res.model_answer?`<details><summary>Показать сильный вариант ответа</summary><p>${safe(res.model_answer)}</p></details>`:""}</div>`;
};

renderInvestor=function(){
 if(!state.simSession.active&&!state.messages.length)state.messages=[];
 const scenario=INVESTOR_SCENARIOS[state.simScenario]||INVESTOR_SCENARIOS.first_meeting;
 const msgs=state.messages.length?state.messages:[{who:"ai",text:scenario.opening}];
 const turn=Math.min(state.simSession.turn+1,state.simSession.maxTurns);
 document.querySelector("#view-investor").innerHTML=`<div class="grid grid-2"><div class="card voice-card"><div class="row between"><div><span class="tag">AI INVESTOR SIMULATOR</span><h2>${safe(scenario.title)}</h2></div>${aiStatusHtml()}</div>${simulatorScenarioTabs()}<p class="muted">${safe(scenario.desc)}</p><div class="sim-chat" id="simChat">${msgs.map(m=>`<div class="bubble ${m.who}">${safe(m.text)}</div>`).join("")}</div>${state.simSession.complete?simulatorSummaryHtml():`<p class="muted">Вопрос ${turn} из ${state.simSession.maxTurns}. Ответьте голосом как на реальной встрече. Следующий вопрос будет выбран по слабому месту или противоречию вашего ответа.</p>${voicePanel("sim")}`}<div class="row"><button class="btn secondary" onclick="startInvestorScenario('${state.simScenario}')">Начать заново</button></div></div><div class="card"><h3>Профессиональный профиль</h3><p class="muted">Оценивается не длина ответа, а качество профессионального мышления и речи.</p>${skillBarsHtml()}<div id="simFeedback">${state.simSession.lastFeedback?`<div class="feedback">${safe(state.simSession.lastFeedback)}</div>`:`<div class="feedback">После каждого ответа здесь будет конкретный разбор.</div>`}</div>${!aiReady()?`<div class="ai-connect"><h3>Подключить AI</h3><p class="small muted">Для динамических follow-up вопросов и точной голосовой оценки нужен backend из папки <code>backend</code>.</p><input id="aiApiBase" class="input" placeholder="https://investor-coach-ai.YOUR.workers.dev" value="${safe(apiBase())}"><button class="btn" onclick="saveApiBase()">Сохранить AI URL</button></div>`:""}</div></div>`;
 const chat=document.querySelector("#simChat");if(chat)chat.scrollTop=chat.scrollHeight;restoreVoiceTranscript("sim");
};

const _evaluateWithAIV10=evaluateWithAI;
evaluateWithAI=async function(ch,text){
 if(ch!=="sim"&&ch!=="coach")return _evaluateWithAIV10(ch,text);
 const status=document.querySelector("#voiceStatus-"+ch);if(status)status.textContent="AI анализирует ответ…";
 try{
  let extra={};
  if(ch==="coach"){
   const task=coachSession?.tasks?.[coachSession.index],t=task?term(task.termId):null;
   extra={training_mode:"coach_speech",term:t?{id:t.id,word:t.word,definition:t.simple,example:t.example,investor:t.investor,why:t.why}:null,prompt:task?.prompt||"",skill_profile:state.skillProfile};
  }else{
   const scenario=INVESTOR_SCENARIOS[state.simScenario]||INVESTOR_SCENARIOS.first_meeting;
   extra={training_mode:"investor_simulator",scenario:{id:state.simScenario,title:scenario.title,description:scenario.desc},turn:state.simSession.turn,max_turns:state.simSession.maxTurns,skill_profile:state.skillProfile,session_scores:state.simSession.scores.slice(-8)};
  }
  const res=await aiCoach(ch,text,extra),score=applyAiResult(res,ch,text);
  if(ch==="coach"){
   const task=coachSession?.tasks?.[coachSession.index];
   if(task&&task.type==="speech"&&!task.answered){
    task.answered=true;task.score=score;task.feedback=feedbackHtml(res);
    state.termSpeech[task.termId]=Math.round((Number(state.termSpeech[task.termId]||score)+score)/2);
    coachRecordResult(task,score>=75);voiceBuffers.coach="";save();renderCoach();renderDashboard();
   }
  }else{
   state.simSession.turn++;
   const finished=!!res.session_complete||state.simSession.turn>=state.simSession.maxTurns;
   state.simSession.complete=finished;
   state.simSession.summary=String(res.session_summary||res.verdict||"").slice(0,2000);
   state.messages.push({who:"you",text},{who:"ai",text:finished?"Встреча завершена. Разберите результат справа и отработайте слабое место.":(res.next_question||"Уточните ответ конкретнее.")});
   setDaily("sim");voiceBuffers.sim="";save();renderInvestor();setTimeout(()=>{const f=document.querySelector("#simFeedback");if(f)f.innerHTML=feedbackHtml(res)},20);renderDashboard();
  }
  if(status)status.textContent="Ответ оценён";
 }catch(e){
  console.error(e);toast("AI временно недоступен — использую локальную оценку.");
  if(ch==="sim")evaluateSim(text);else evaluateCoachSpeechLocal(text);
 }
};

const _renderDashboardV10=renderDashboard;
renderDashboard=function(){
 _renderDashboardV10();
 const root=document.querySelector("#view-dashboard");if(!root)return;
 const next=nextBestTraining(),score=professionalReadiness(),weak=weakestProfessionalSkill();
 root.insertAdjacentHTML("beforeend",`<div class="card"><div class="row between"><div><span class="tag">PROFESSIONAL READINESS</span><h2>${score}%</h2><p class="muted">Знание терминов + применение + речь + ответы инвестору.</p></div><div><strong>${weak.samples?`Слабее: ${safe(PROFESSIONAL_SKILLS[weak.id])}`:"Начните голосовую практику"}</strong><p class="muted small">${safe(next.why)}</p><button class="btn" onclick="go('${next.view}')">${safe(next.title)}</button></div></div></div>`);
};

const _renderCoachV10=renderCoach;
renderCoach=function(){
 _renderCoachV10();
 if(!coachSession)return;
 if(coachSession.index>=coachSession.tasks.length){
  const card=document.querySelector("#view-coach .card");if(!card)return;
  const next=nextBestTraining();
  card.insertAdjacentHTML("beforeend",`<div class="feedback"><strong>Следующая лучшая тренировка</strong><p>${safe(next.why)}</p><button class="btn secondary" onclick="go('${next.view}')">${safe(next.title)}</button></div>`);
 }
};
try{renderDashboard()}catch{}


/* ===== Placement + Retention Learning Engine v12 ===== */
state.placement=Object.assign({done:false,active:false,current:0,answers:[],score:null,recommended:"",completedAt:""},state.placement||{});
state.coachPlanDays=state.coachPlanDays||{"7":1,"14":1,"30":1};
if(!state.coachPlanDays["14"])state.coachPlanDays["14"]=1;

function placementQuestions(){
 const valid=QUIZ.filter(q=>term(q.termId));
 const buckets={};
 valid.forEach(q=>{const c=term(q.termId)?.cat||"Другое";(buckets[c]||(buckets[c]=[])).push(q)});
 const cats=Object.keys(buckets),out=[];let round=0;
 while(out.length<12&&cats.length){
  let added=false;
  for(const c of cats){const q=buckets[c][round];if(q&&out.length<12){out.push(q);added=true}}
  if(!added)break;round++;
 }
 return out.slice(0,12);
}
function startPlacement(){state.placement={done:false,active:true,current:0,answers:[],score:null,recommended:"",completedAt:""};save();renderDashboard()}
function answerPlacement(i){
 const p=state.placement,qs=placementQuestions(),q=qs[p.current];if(!p.active||!q||p.answers[p.current])return;
 p.answers[p.current]={selected:i,correct:i===q.a};save();renderDashboard();
}
function nextPlacement(){
 const p=state.placement,qs=placementQuestions();if(!p.answers[p.current])return;
 if(p.current>=qs.length-1){finishPlacement();return}
 p.current++;save();renderDashboard();
}
function finishPlacement(){
 const p=state.placement,qs=placementQuestions(),right=p.answers.filter(x=>x?.correct).length,score=Math.round(right/Math.max(1,qs.length)*100);
 const recommended=score>=72?"7":score>=45?"14":"30";
 p.active=false;p.done=true;p.score=score;p.recommended=recommended;p.completedAt=new Date().toISOString();
 state.coachPlan=recommended;if(!state.coachPlanDays[recommended])state.coachPlanDays[recommended]=1;
 save();renderDashboard();renderCoach();
}
function placementHtml(){
 const p=state.placement;
 if(!p.active)return "";
 const qs=placementQuestions(),q=qs[p.current],a=p.answers[p.current],n=p.current+1;
 return `<div class="card quiz-card"><div class="row between"><span class="tag">ВХОДНАЯ ДИАГНОСТИКА · ${n}/${qs.length}</span><span class="muted small">Маршрут будет выбран по результату</span></div><h2>${safe(q.q)}</h2><div>${q.options.map((o,i)=>`<button class="option ${a?(i===q.a?'correct':i===a.selected?'wrong':''):''}" ${a?'disabled':''} onclick="answerPlacement(${i})">${safe(o)}</button>`).join("")}</div>${a?`${quizFeedback(q)}<button class="btn feedback-next" onclick="nextPlacement()">${n===qs.length?'Завершить диагностику':'Следующий вопрос'}</button>`:""}</div>`;
}
function retentionScore(){
 if(!TERMS.length)return 0;
 const strong=TERMS.reduce((n,t)=>{const s=srsInfo(t.id),c=coachStat(t.id);return n+(((s.box||0)>=3&&(c.mastery||0)>=45)?1:0)},0);
 return Math.round(strong/TERMS.length*100);
}
function professionalLevel(){
 const s=professionalReadiness();
 if(s>=82)return {title:"Профессиональный",text:"Знания уже переносятся в речь и ответы инвестору."};
 if(s>=62)return {title:"Уверенный",text:"База сильная. Основной рост даст живая практика и сложные follow-up вопросы."};
 if(s>=38)return {title:"Рабочий",text:"Термины знакомы, но их ещё нужно закрепить в применении и речи."};
 return {title:"Начальный",text:"Сначала создаём фундамент терминов и правильных смысловых связей."};
}
function dailyNextAction(){
 if(!state.placement.done)return {view:"dashboard",label:"Пройти диагностику",why:"Сначала определим стартовый уровень и подходящую скорость обучения.",action:"startPlacement()"};
 const due=dueTerms().length,weak=state.weak.length,skill=weakestProfessionalSkill();
 if(due>=5||weak>=5)return {view:"coach",label:"Coach",why:`Сегодня важнее закрепить ${Math.max(due,weak)} слабых/просроченных тем.`,action:"go('coach')"};
 if(skill.samples===0||["clarity","directness","structure","terminology"].includes(skill.id))return {view:"speak",label:"Живая речь",why:"Следующий рост даст самостоятельная формулировка без подсказки.",action:"go('speak')"};
 return {view:"investor",label:"Встреча с инвестором",why:"Пора переносить знания в давление реального вопроса.",action:"go('investor')"};
}
function placementResultHtml(){
 if(!state.placement.done)return `<div class="card"><span class="tag">СТАРТОВЫЙ УРОВЕНЬ</span><h3>Определить правильный маршрут</h3><p class="muted">12 коротких вопросов. После них Coach автоматически предложит 7, 14 или 30 дней.</p><button class="btn" onclick="startPlacement()">Начать диагностику</button></div>`;
 const p=state.placement,plan=COACH_PLANS[p.recommended]||COACH_PLANS["30"];
 return `<div class="card"><div class="row between"><div><span class="tag">СТАРТОВЫЙ УРОВЕНЬ</span><h3>${p.score}% · ${safe(plan.title)}</h3><p class="muted">Рекомендованный маршрут: ${plan.label}. Его можно поменять вручную в Coach.</p></div><button class="btn secondary" onclick="startPlacement()">Пройти заново</button></div></div>`;
}

const _renderDashboardV11Placement=renderDashboard;
renderDashboard=function(){
 if(state.placement.active){
  const root=$("#view-dashboard");if(!root)return;root.innerHTML=placementHtml();return;
 }
 _renderDashboardV11Placement();
 const root=$("#view-dashboard");if(!root)return;
 const next=dailyNextAction(),level=professionalLevel(),ret=retentionScore();
 root.insertAdjacentHTML("afterbegin",`${placementResultHtml()}<div class="grid grid-2"><div class="card"><span class="tag">СЛЕДУЮЩИЙ ШАГ</span><h3>${safe(next.label)}</h3><p class="muted">${safe(next.why)}</p><button class="btn" onclick="${next.action}">Начать</button></div><div class="card"><span class="tag">УДЕРЖАНИЕ ЗНАНИЙ</span><h3>${ret}% · ${safe(level.title)}</h3><div class="progress"><div style="width:${ret}%"></div></div><p class="muted">${safe(level.text)}</p></div></div>`);
};

const _renderCoachV11Placement=renderCoach;
renderCoach=function(){
 _renderCoachV11Placement();
 if(!state.placement.done||coachSession)return;
 const root=$("#view-coach");if(!root)return;
 const p=state.placement,plan=COACH_PLANS[p.recommended];
 root.insertAdjacentHTML("afterbegin",`<div class="card"><div class="row between"><div><span class="tag">ПЕРСОНАЛЬНЫЙ МАРШРУТ</span><strong>${safe(plan.label)} · старт ${p.score}%</strong></div><button class="btn secondary" onclick="go('dashboard')">Диагностика</button></div></div>`);
};

try{renderDashboard()}catch{}


/* ===== Adaptive Brain Engine v13 ===== */
state.brainModel=state.brainModel||{};
state.confusionPairs=state.confusionPairs||{};

const BRAIN_STAGE_LABELS={
 exposure:"Знакомство",
 recognition:"Узнавание",
 recall:"Воспроизведение",
 application:"Применение",
 speech:"Свободная речь",
 mastery:"Освоено"
};
function brainEntry(id){
 if(!state.brainModel[id])state.brainModel[id]={stage:"exposure",recognition:0,recall:0,application:0,speech:0,errors:0,lastError:"",confidence:0};
 return state.brainModel[id];
}
function brainSyncTerm(id){
 const b=brainEntry(id),s=coachStat(id),sr=srsInfo(id),sp=Number(state.termSpeech[id]||0);
 b.recognition=Math.max(b.recognition,Math.min(100,Math.round(((sr.box||0)/5)*100)));
 b.application=Math.max(b.application,Math.min(100,Number(s.mastery||0)));
 b.speech=Math.max(b.speech,sp);
 if(b.speech>=78&&b.application>=72&&b.recognition>=70)b.stage="mastery";
 else if(b.speech>=55)b.stage="speech";
 else if(b.application>=48)b.stage="application";
 else if(b.recall>=45)b.stage="recall";
 else if(b.recognition>=35)b.stage="recognition";
 else b.stage="exposure";
 return b;
}
function brainRecord(task,ok,selected){
 if(!task?.termId)return;
 const b=brainSyncTerm(task.termId),type=task.type||"";
 if(["meaning","scenario","investor","usage","response"].includes(type)){
  b.recognition=Math.max(0,Math.min(100,b.recognition+(ok?8:-5)));
  if(type==="scenario"||type==="usage"||type==="response")b.application=Math.max(0,Math.min(100,b.application+(ok?10:-7)));
 }
 if(type==="transfer")b.recall=Math.min(100,b.recall+8);
 if(!ok){
  b.errors++;b.lastError=type||"unknown";
  const q=coachSession?.tasks?.[coachSession.index];
  if(q?.options&&Number.isInteger(selected)&&selected>=0){
   const chosen=String(q.options[selected]||"").trim();
   const other=TERMS.find(x=>x.word===chosen);
   if(other&&other.id!==task.termId){
    const key=[task.termId,other.id].sort().join("|");
    state.confusionPairs[key]=(state.confusionPairs[key]||0)+1;
   }
  }
 }
 brainSyncTerm(task.termId);
}
function brainWeakness(id){
 const b=brainSyncTerm(id);
 if(b.recognition<40)return "meaning";
 if(b.recall<45)return "recall";
 if(b.application<55)return "application";
 if(b.speech<65)return "speech";
 return "retention";
}
function brainPriority(t){
 const b=brainSyncTerm(t.id),weak=brainWeakness(t.id);
 const stageWeight={meaning:12,recall:10,application:8,speech:6,retention:2}[weak]||0;
 return stageWeight+(b.errors||0)*2-(b.stage==="mastery"?15:0);
}
function strongestConfusionFor(id){
 let best=null;
 Object.entries(state.confusionPairs).forEach(([k,n])=>{
  const ids=k.split("|");if(!ids.includes(id))return;
  const other=ids[0]===id?ids[1]:ids[0];
  if(!best||n>best.n)best={id:other,n};
 });
 return best;
}
function brainTaskFor(t){
 const b=brainSyncTerm(t.id),weak=brainWeakness(t.id),g=coachGuide(t),conf=strongestConfusionFor(t.id);
 if(weak==="meaning"){
  const d=coachDistractors(t,3),opts=coachShuffle([t.simple,...d.map(x=>x.simple)]);
  return coachOptionTask("meaning",t,`Как точнее всего объяснить «${t.word}»?`,opts,opts.indexOf(t.simple));
 }
 if(weak==="recall")return {type:"transfer",termId:t.id,prompt:`Без подсказки объясните «${t.word}» одним предложением, затем приведите один пример из бизнеса.`,answered:false,brain:"recall"};
 if(weak==="application"){
  if(conf){
   const other=term(conf.id);
   if(other){
    const opts=coachShuffle([t.word,other.word]);
    return coachOptionTask("scenario",t,`Не перепутайте близкие понятия. Ситуация: ${t.example||t.simple} Какой термин здесь точнее?`,opts,opts.indexOf(t.word));
   }
  }
  const c=coachChoices(t,x=>x.word);
  return coachOptionTask("scenario",t,`Применение: ${t.example||t.simple} Какой термин нужен?`,c.options,c.answer);
 }
 if(weak==="speech")return {type:"speech",termId:t.id,prompt:`Ответьте голосом 20–40 секунд: «${t.investor||`Как ${t.word} влияет на ваш бизнес и почему инвестору это важно?`}»`,answered:false,score:null,feedback:"",brain:"speech"};
 return {type:"transfer",termId:t.id,prompt:`Через интервальное воспроизведение: объясните «${t.word}» без карточки и свяжите с цифрой, решением или риском.`,answered:false,brain:"retention"};
}
function brainNextTerms(count=2){
 return TERMS.map(t=>({t,p:coachPriority(t)+brainPriority(t)})).sort((a,b)=>b.p-a.p).slice(0,count).map(x=>x.t);
}
function startBrainDrill(){
 const selected=brainNextTerms(2);
 if(!selected.length)return;
 coachSession={termIds:selected.map(t=>t.id),tasks:selected.map(brainTaskFor),index:0,correct:0,answered:0,mistakes:[],startedAt:Date.now(),brain:true};
 save();renderCoach();
}
function brainSummary(){
 const counts={};
 TERMS.forEach(t=>{const s=brainSyncTerm(t.id).stage;counts[s]=(counts[s]||0)+1});
 return counts;
}
function brainDashboardHtml(){
 const c=brainSummary(),next=brainNextTerms(1)[0],b=next?brainSyncTerm(next.id):null;
 return `<div class="card"><div class="row between"><div><span class="tag">ADAPTIVE BRAIN ENGINE</span><h3>${next?`Следующий термин: ${safe(next.word)}`:"Маршрут построен"}</h3><p class="muted">${next?`Сейчас слабое место: ${safe(BRAIN_STAGE_LABELS[b.stage])}. Тренировка будет выбрана автоматически.`:""}</p></div><button class="btn" onclick="go('coach');setTimeout(startBrainDrill,0)">Умная тренировка</button></div><div class="small muted">Узнавание: ${c.recognition||0} · Воспроизведение: ${c.recall||0} · Применение: ${c.application||0} · Речь: ${c.speech||0} · Освоено: ${c.mastery||0}</div></div>`;
}

const _coachAnswerV12Brain=coachAnswer;
coachAnswer=function(i){
 const task=coachSession?.tasks?.[coachSession.index],before=task?{...task}:null;
 _coachAnswerV12Brain(i);
 if(before&&["meaning","scenario","investor","usage","response"].includes(before.type)){
  brainRecord(before,answerMatches(before.options,i,before.answer),i);save();
 }
};
const _coachTransferDoneV12Brain=coachTransferDone;
coachTransferDone=function(){
 const task=coachSession?.tasks?.[coachSession.index];
 if(task?.termId){const b=brainEntry(task.termId);b.recall=Math.min(100,(b.recall||0)+10)}
 _coachTransferDoneV12Brain();if(task?.termId){brainSyncTerm(task.termId);save()}
};

const _applyAiResultV12Brain=applyAiResult;
applyAiResult=function(res,mode,userText){
 const score=_applyAiResultV12Brain(res,mode,userText);
 if(mode==="coach"){
  const task=coachSession?.tasks?.[coachSession.index];
  if(task?.termId){const b=brainEntry(task.termId);b.speech=Math.round((Number(b.speech||0)+Number(score||0))/2);brainSyncTerm(task.termId)}
 }
 save();return score;
};

const _renderDashboardV12Brain=renderDashboard;
renderDashboard=function(){
 _renderDashboardV12Brain();
 if(state.placement.active)return;
 const root=$("#view-dashboard");if(root)root.insertAdjacentHTML("beforeend",brainDashboardHtml());
};
const _renderCoachV12Brain=renderCoach;
renderCoach=function(){
 _renderCoachV12Brain();
 if(coachSession)return;
 const root=$("#view-coach");if(!root)return;
 const next=brainNextTerms(1)[0],b=next?brainSyncTerm(next.id):null;
 root.insertAdjacentHTML("afterbegin",`<div class="card"><div class="row between"><div><span class="tag">УМНАЯ ТРЕНИРОВКА</span><strong>${next?safe(next.word)+" · "+safe(BRAIN_STAGE_LABELS[b.stage]):"Адаптивный маршрут"}</strong><p class="muted small">Приложение выбирает упражнение по типу пробела: смысл → воспроизведение → применение → речь → удержание.</p></div><button class="btn" onclick="startBrainDrill()">Начать</button></div></div>`);
};

try{renderDashboard()}catch{}


/* ===== Investor Meeting Exam v14 ===== */
state.exam=Object.assign({active:false,complete:false,turn:0,maxTurns:10,scenario:"investment_committee",startedAt:0,finishedAt:0,scores:[],dimensions:[],claims:[],contradictions:[],summary:"",grade:"",history:[]},state.exam||{});

function startInvestorExam(){
 state.exam={active:true,complete:false,turn:0,maxTurns:10,scenario:"investment_committee",startedAt:Date.now(),finishedAt:0,scores:[],dimensions:[],claims:[],contradictions:[],summary:"",grade:"",history:[]};
 state.messages=[{who:"ai",text:"У вас 10 вопросов без подсказок. Начнём. За 60 секунд объясните: что делает компания, для кого, какую проблему решает и какое главное доказательство спроса у вас уже есть?"}];
 state.aiHistory=[];voiceBuffers.sim="";save();renderInvestor();
}
function examAverage(){
 return state.exam.scores.length?Math.round(state.exam.scores.reduce((a,b)=>a+b,0)/state.exam.scores.length):0;
}
function examDimensionAverage(id){
 const vals=state.exam.dimensions.map(x=>Number(x?.[id])).filter(Number.isFinite);
 return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;
}
function examGrade(score){
 if(score>=85)return "Готов к сложной встрече";
 if(score>=72)return "Рабочий профессиональный уровень";
 if(score>=58)return "Нужна точечная доработка";
 return "К реальной встрече пока рано";
}
function examReportHtml(){
 const avg=examAverage(),grade=state.exam.grade||examGrade(avg);
 return `<div class="card"><span class="tag">INVESTOR MEETING EXAM</span><h2>${avg}/100 · ${safe(grade)}</h2><p>${safe(state.exam.summary||"Экзамен завершён.")}</p>
 <div class="skill-profile">${Object.entries(PROFESSIONAL_SKILLS).map(([id,label])=>{const v=examDimensionAverage(id);return `<div class="skill-row"><div class="row between"><span>${label}</span><strong>${v}%</strong></div><div class="progress"><div style="width:${v}%"></div></div></div>`}).join("")}</div>
 ${state.exam.contradictions.length?`<div class="feedback"><strong>Найденные противоречия</strong><p>${state.exam.contradictions.slice(-6).map(safe).join(" • ")}</p></div>`:""}
 <p class="muted small">Экзамен оценивает качество ответов внутри этой симуляции. Это учебная оценка, а не внешняя профессиональная сертификация.</p>
 <div class="row"><button class="btn" onclick="startInvestorExam()">Пройти ещё раз</button><button class="btn secondary" onclick="go('coach')">Отработать слабые места</button></div></div>`;
}
function examHeaderHtml(){
 const e=state.exam;
 return `<div class="row between"><div><span class="tag">ЭКЗАМЕН · ${Math.min(e.turn+1,e.maxTurns)}/${e.maxTurns}</span><h2>Investor Meeting Exam</h2></div><strong>${e.scores.length?examAverage()+" / 100":"Без подсказок"}</strong></div>`;
}

const _renderInvestorV13Exam=renderInvestor;
renderInvestor=function(){
 if(!state.exam.active&&!state.exam.complete){_renderInvestorV13Exam();const root=$("#view-investor");if(root)root.insertAdjacentHTML("afterbegin",`<div class="card"><div class="row between"><div><span class="tag">ФИНАЛЬНАЯ ПРОВЕРКА</span><h3>Investor Meeting Exam</h3><p class="muted">10 последовательных вопросов без подсказок. AI возвращается к вашим цифрам, проверяет логику и ищет противоречия.</p></div><button class="btn" onclick="startInvestorExam()">Начать экзамен</button></div></div>`);return}
 const root=$("#view-investor");if(!root)return;
 if(state.exam.complete){root.innerHTML=examReportHtml();return}
 const msgs=state.messages||[];
 root.innerHTML=`<div class="grid grid-2"><div class="card voice-card">${examHeaderHtml()}<div class="sim-chat" id="simChat">${msgs.map(m=>`<div class="bubble ${m.who}">${safe(m.text)}</div>`).join("")}</div><p class="muted">Отвечайте так, как на реальной встрече. Во время экзамена модельный ответ и подсказки не показываются.</p>${voicePanel("sim")}<button class="btn secondary" onclick="if(confirm('Начать экзамен заново?'))startInvestorExam()">Начать заново</button></div><div class="card"><h3>Что проверяется</h3><p class="muted">Прямота ответа, ясность, доказательность, цифры, терминология, работа с риском и структура.</p><div class="feedback">Разбор и модельные ответы будут доступны только после завершения экзамена.</div></div></div>`;
 const chat=$("#simChat");if(chat)chat.scrollTop=chat.scrollHeight;restoreVoiceTranscript("sim");
};

const _evaluateWithAIV13Exam=evaluateWithAI;
evaluateWithAI=async function(ch,text){
 if(ch!=="sim"||!state.exam.active)return _evaluateWithAIV13Exam(ch,text);
 const status=$("#voiceStatus-sim");if(status)status.textContent="Экзаменатор анализирует ответ…";
 try{
  const extra={training_mode:"investor_exam",exam:true,turn:state.exam.turn,max_turns:state.exam.maxTurns,skill_profile:state.skillProfile,claims:state.exam.claims.slice(-20),contradictions:state.exam.contradictions.slice(-10),history:state.exam.history.slice(-8)};
  const res=await aiCoach("sim",text,extra);
  const score=applyAiResult(res,"sim",text);
  state.exam.scores.push(score);state.exam.dimensions.push(res.dimensions||{});
  (res.claims||[]).forEach(x=>{if(x&&x.claim)state.exam.claims.push({claim:String(x.claim).slice(0,300),value:String(x.value||"").slice(0,120),turn:state.exam.turn+1})});
  (res.contradictions||[]).forEach(x=>{const s=String(x||"").trim();if(s&&!state.exam.contradictions.includes(s))state.exam.contradictions.push(s)});
  state.exam.history.push({turn:state.exam.turn+1,question:(state.messages||[]).slice().reverse().find(m=>m.who==="ai")?.text||"",answer:text,score});
  state.exam.turn++;
  const done=state.exam.turn>=state.exam.maxTurns||!!res.session_complete;
  state.messages.push({who:"you",text});
  if(done){
   state.exam.active=false;state.exam.complete=true;state.exam.finishedAt=Date.now();state.exam.summary=String(res.session_summary||res.verdict||"Экзамен завершён.").slice(0,2000);state.exam.grade=examGrade(examAverage());
  }else{
   state.messages.push({who:"ai",text:res.next_question||"Уточните ответ конкретнее и подтвердите его данными."});
  }
  voiceBuffers.sim="";save();renderInvestor();renderDashboard();
 }catch(e){
  console.error(e);toast("Для экзамена требуется подключённый AI backend.");if(status)status.textContent="AI недоступен";
 }
};

const _professionalReadinessV13Exam=professionalReadiness;
professionalReadiness=function(){
 const base=_professionalReadinessV13Exam();
 if(!state.exam.complete||!state.exam.scores.length)return base;
 return Math.round(base*.65+examAverage()*.35);
};
readinessScore=professionalReadiness;

const _renderDashboardV13Exam=renderDashboard;
renderDashboard=function(){
 _renderDashboardV13Exam();
 if(state.placement.active)return;
 const root=$("#view-dashboard");if(!root)return;
 const e=state.exam;
 root.insertAdjacentHTML("beforeend",`<div class="card"><div class="row between"><div><span class="tag">INVESTOR MEETING EXAM</span><h3>${e.complete?`${examAverage()}/100 · ${safe(e.grade)}`:"Финальная проверка без подсказок"}</h3><p class="muted">${e.complete?"Результат экзамена теперь учитывается в Professional Readiness.":"10 вопросов: follow-up, цифры, риски, терминология и непротиворечивость ответов."}</p></div><button class="btn" onclick="go('investor');setTimeout(${e.complete?"renderInvestor":"startInvestorExam"},0)">${e.complete?"Открыть результат":"Начать экзамен"}</button></div></div>`);
};

try{renderDashboard()}catch{}


/* ===== Measurable Proficiency Engine v15 ===== */
state.baseline=Object.assign({captured:false,at:"",placement:null,readiness:null,retention:null,skills:{}},state.baseline||{});
state.proficiencyHistory=state.proficiencyHistory||[];
state.validation=Object.assign({lastAt:"",lastScore:null,retentionAt:"",retentionScore:null},state.validation||{});

function snapshotSkills(){
 const o={};Object.keys(PROFESSIONAL_SKILLS).forEach(id=>o[id]=skillEntry(id).samples?skillEntry(id).score:null);return o;
}
function captureBaseline(force=false){
 if(state.baseline.captured&&!force)return;
 state.baseline={captured:true,at:new Date().toISOString(),placement:state.placement.score??null,readiness:professionalReadiness(),retention:retentionScore(),skills:snapshotSkills()};
 save();
}
function proficiencySnapshot(source="progress"){
 const snap={at:new Date().toISOString(),source,readiness:professionalReadiness(),retention:retentionScore(),exam:state.exam.complete?examAverage():null,skills:snapshotSkills()};
 state.proficiencyHistory.push(snap);state.proficiencyHistory=state.proficiencyHistory.slice(-60);save();return snap;
}
function delta(a,b){if(a==null||b==null)return null;return Math.round(Number(b)-Number(a))}
function deltaText(v){return v==null?"—":`${v>0?"+":""}${v} п.п.`}
function evidenceLevel(){
 const b=state.baseline.captured,e=state.exam.complete,r=state.validation.retentionScore!=null;
 if(b&&e&&r)return {title:"Проверено повторно",text:"Есть стартовая точка, экзамен и отдельная проверка удержания."};
 if(b&&e)return {title:"Измеримый прогресс",text:"Есть стартовая точка и финальный экзамен. Нужна повторная проверка удержания."};
 if(b)return {title:"Есть baseline",text:"Стартовый уровень сохранён. Пройдите курс и Investor Meeting Exam."};
 return {title:"Baseline не зафиксирован",text:"Сначала завершите входную диагностику."};
}
function validationScore(){
 const learned=TERMS.filter(t=>(srsInfo(t.id).box||0)>=2).sort((a,b)=>termProfessionalScore(a.id)-termProfessionalScore(b.id)).slice(0,12);
 if(!learned.length)return null;
 return Math.round(learned.reduce((sum,t)=>sum+termProfessionalScore(t.id),0)/learned.length);
}
function runRetentionValidation(){
 const score=validationScore();
 if(score==null){toast("Сначала пройдите обучение нескольких терминов.");return}
 state.validation.retentionAt=new Date().toISOString();state.validation.retentionScore=score;proficiencySnapshot("retention");save();renderDashboard();
}
function baselineProgressHtml(){
 const ev=evidenceLevel(),b=state.baseline,nowR=professionalReadiness(),nowRet=retentionScore();
 const dR=b.captured?delta(b.readiness,nowR):null,dRet=b.captured?delta(b.retention,nowRet):null;
 return `<div class="card"><div class="row between"><div><span class="tag">MEASURABLE PROFICIENCY</span><h3>${safe(ev.title)}</h3><p class="muted">${safe(ev.text)}</p></div><strong>${nowR}% readiness</strong></div>
 <div class="grid grid-2"><div><p class="small muted">Professional Readiness</p><strong>${b.captured?`${b.readiness}% → ${nowR}%`:`${nowR}%`}</strong><p class="small">${b.captured?deltaText(dR):"После диагностики сохранится стартовая точка."}</p></div>
 <div><p class="small muted">Удержание знаний</p><strong>${b.captured?`${b.retention}% → ${nowRet}%`:`${nowRet}%`}</strong><p class="small">${b.captured?deltaText(dRet):"—"}</p></div></div>
 <div class="row">${!b.captured&&state.placement.done?`<button class="btn" onclick="captureBaseline();renderDashboard()">Зафиксировать стартовый уровень</button>`:""}${b.captured?`<button class="btn secondary" onclick="runRetentionValidation()">Проверить удержание</button>`:""}</div>
 ${state.validation.retentionScore!=null?`<div class="feedback"><strong>Последняя проверка удержания: ${state.validation.retentionScore}%</strong><p class="small muted">${safe(new Date(state.validation.retentionAt).toLocaleDateString("ru-RU"))}. Используются уже изученные термины.</p></div>`:""}</div>`;
}
function skillDeltaHtml(){
 if(!state.baseline.captured)return "";
 return `<div class="card"><h3>Рост по навыкам</h3><div class="skill-profile">${Object.entries(PROFESSIONAL_SKILLS).map(([id,label])=>{const before=state.baseline.skills[id],after=skillEntry(id).samples?skillEntry(id).score:null,d=delta(before,after);return `<div class="skill-row"><div class="row between"><span>${label}</span><strong>${before==null||after==null?"—":`${before}% → ${after}% (${deltaText(d)})`}</strong></div><div class="progress"><div style="width:${after||0}%"></div></div></div>`}).join("")}</div></div>`;
}

const _finishPlacementV14Proficiency=finishPlacement;
finishPlacement=function(){_finishPlacementV14Proficiency();if(state.placement.done&&!state.baseline.captured){captureBaseline();renderDashboard()}};

const _renderInvestorV14Proficiency=renderInvestor;
renderInvestor=function(){
 _renderInvestorV14Proficiency();
 if(state.exam.complete&&state.exam.finishedAt){
  const key="exam:"+state.exam.finishedAt;
  if(!state.proficiencyHistory.some(x=>x.source===key))proficiencySnapshot(key);
 }
};

const _renderDashboardV14Proficiency=renderDashboard;
renderDashboard=function(){
 _renderDashboardV14Proficiency();
 if(state.placement.active)return;
 const root=$("#view-dashboard");if(root)root.insertAdjacentHTML("beforeend",baselineProgressHtml()+skillDeltaHtml());
};
try{renderDashboard()}catch{}


/* ===== Production Hardening v16 ===== */
state.runtimeHealth=Object.assign({lastBoot:"",lastError:"",errorCount:0},state.runtimeHealth||{});
state.runtimeHealth.lastBoot=new Date().toISOString();

window.addEventListener("error",e=>{
 try{state.runtimeHealth.lastError=String(e?.message||"Ошибка интерфейса").slice(0,500);state.runtimeHealth.errorCount=(state.runtimeHealth.errorCount||0)+1;save()}catch{}
});
window.addEventListener("unhandledrejection",e=>{
 try{state.runtimeHealth.lastError=String(e?.reason?.message||e?.reason||"Ошибка операции").slice(0,500);state.runtimeHealth.errorCount=(state.runtimeHealth.errorCount||0)+1;save()}catch{}
});

function safeGo(view){
 try{go(view)}catch(e){console.error(e);toast("Не удалось открыть раздел. Повторите действие.")}
}
function currentLearningCheckpoint(){
 if(state.exam?.active)return {view:"investor",label:"Продолжить экзамен"};
 if(coachSession)return {view:"coach",label:"Продолжить Coach"};
 if(state.accel?.active)return {view:"roadmap",label:"Продолжить интенсив"};
 return null;
}
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible"){
  try{refreshAccelUI();setInstallState();if(state.accel?.active&&!accelIsPaused())requestWakeLock()}catch{}
 }
});
window.addEventListener("online",()=>{try{toast("Соединение восстановлено")}catch{}});
window.addEventListener("offline",()=>{try{toast("Офлайн-режим: основные материалы доступны из кэша")}catch{}});


/* ===== Pilot Evidence Engine v17 ===== */
state.pilotEvidence=Object.assign({consent:false,startedAt:"",completedAt:"",pre:null,post:null,retention:null,notes:""},state.pilotEvidence||{});

function pilotSnapshot(){
 return {
  at:new Date().toISOString(),
  readiness:professionalReadiness(),
  retention:retentionScore(),
  exam:state.exam?.complete?examAverage():null,
  placement:state.placement?.score??null,
  skills:snapshotSkills()
 };
}
function startPilotEvidence(){
 if(!state.placement?.done){toast("Сначала завершите входную диагностику.");go("dashboard");return}
 state.pilotEvidence.consent=true;
 state.pilotEvidence.startedAt=new Date().toISOString();
 state.pilotEvidence.pre=pilotSnapshot();
 state.pilotEvidence.post=null;state.pilotEvidence.retention=null;state.pilotEvidence.completedAt="";
 save();renderDashboard();
}
function capturePilotPost(){
 if(!state.pilotEvidence.pre){toast("Сначала зафиксируйте старт пилота.");return}
 if(!state.exam?.complete){toast("Сначала завершите Investor Meeting Exam.");go("investor");return}
 state.pilotEvidence.post=pilotSnapshot();
 state.pilotEvidence.completedAt=new Date().toISOString();
 save();renderDashboard();
}
function capturePilotRetention(){
 if(!state.pilotEvidence.post){toast("Сначала зафиксируйте итог после экзамена.");return}
 const score=validationScore();
 if(score==null){toast("Недостаточно изученного материала для проверки удержания.");return}
 state.pilotEvidence.retention={at:new Date().toISOString(),score};
 save();renderDashboard();
}
function pilotSkillRows(){
 const pre=state.pilotEvidence.pre?.skills||{},post=state.pilotEvidence.post?.skills||{};
 return Object.entries(PROFESSIONAL_SKILLS).map(([id,label])=>{
  const a=pre[id],b=post[id],d=delta(a,b);
  return `<div class="skill-row"><div class="row between"><span>${label}</span><strong>${a==null||b==null?"—":`${a}% → ${b}% (${deltaText(d)})`}</strong></div><div class="progress"><div style="width:${b||0}%"></div></div></div>`;
 }).join("");
}
function pilotEvidenceHtml(){
 const p=state.pilotEvidence;
 if(!p.pre)return `<div class="card"><div class="row between"><div><span class="tag">PILOT EVIDENCE</span><h3>Зафиксировать результат обучения</h3><p class="muted">Сохраняет стартовую точку, затем итоговый экзамен и отдельную проверку удержания. Данные остаются на этом устройстве.</p></div><button class="btn" onclick="startPilotEvidence()">Начать измерение</button></div></div>`;
 const pre=p.pre,post=p.post;
 return `<div class="card"><div class="row between"><div><span class="tag">PILOT EVIDENCE</span><h3>${post?"Результат зафиксирован":"Идёт измерение"}</h3><p class="muted">Baseline: ${safe(new Date(pre.at).toLocaleDateString("ru-RU"))}${post?` · итог: ${safe(new Date(post.at).toLocaleDateString("ru-RU"))}`:""}</p></div><strong>${post?`${pre.readiness}% → ${post.readiness}%`:`Старт ${pre.readiness}%`}</strong></div>
 ${post?`<div class="feedback"><strong>Изменение Professional Readiness: ${deltaText(delta(pre.readiness,post.readiness))}</strong><p>Удержание: ${pre.retention}% → ${post.retention}% · Экзамен: ${post.exam??"—"}/100</p></div><div class="skill-profile">${pilotSkillRows()}</div>`:`<p>Пройдите выбранный маршрут и затем Investor Meeting Exam. До завершения экзамена итог не фиксируется.</p><button class="btn" onclick="go('investor')">Перейти к экзамену</button><button class="btn secondary" onclick="capturePilotPost()">Зафиксировать итог</button>`}
 ${post&&!p.retention?`<button class="btn secondary" onclick="capturePilotRetention()">Проверить удержание позже</button>`:""}
 ${p.retention?`<div class="feedback"><strong>Контроль удержания: ${p.retention.score}%</strong><p class="small muted">${safe(new Date(p.retention.at).toLocaleDateString("ru-RU"))}</p></div>`:""}
 <p class="small muted">Это внутренняя учебная метрика. Для коммерческих заявлений об эффективности требуется пилот на реальных пользователях и внешне проверяемая методика.</p></div>`;
}

const _renderDashboardV16Pilot=renderDashboard;
renderDashboard=function(){
 _renderDashboardV16Pilot();
 if(state.placement?.active)return;
 const root=$("#view-dashboard");if(root)root.insertAdjacentHTML("beforeend",pilotEvidenceHtml());
};
try{renderDashboard()}catch{}


/* ===== Release Candidate Update Check v18 ===== */
async function checkPwaUpdate(){
 if(!("serviceWorker" in navigator))return;
 try{
  const reg=await navigator.serviceWorker.getRegistration();
  if(reg)await reg.update();
 }catch(e){console.warn("PWA update check failed",e)}
}
window.addEventListener("load",()=>{
 setTimeout(checkPwaUpdate,2500);
 setInterval(checkPwaUpdate,60*60*1000);
});
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible")setTimeout(checkPwaUpdate,800);
});


/* ===== End-to-End QA Fixes v19 ===== */
state.retentionCheck=Object.assign({active:false,index:0,items:[],answers:[],startedAt:"",finishedAt:"",score:null},state.retentionCheck||{});

function retentionCandidates(){
 const learned=new Set(TERMS.filter(t=>{
  const sr=srsInfo(t.id),cs=coachStat(t.id);
  return (sr.box||0)>=1||(cs.seen||0)>=2||(cs.mastery||0)>=20;
 }).map(t=>t.id));
 let qs=QUIZ.filter(q=>learned.has(q.termId));
 if(qs.length<6)qs=QUIZ.filter(q=>term(q.termId));
 return qs;
}
function buildRetentionItems(limit=8){
 const pool=[...retentionCandidates()];
 const selected=[];
 while(pool.length&&selected.length<limit){
  const i=Math.floor(Math.random()*pool.length);
  selected.push(pool.splice(i,1)[0]);
 }
 return selected;
}
function startRetentionCheck(){
 const items=buildRetentionItems(8);
 if(items.length<4){toast("Сначала пройдите несколько терминов и тестов.");return}
 state.retentionCheck={active:true,index:0,items:items.map(q=>({termId:q.termId,q:q.q,options:[...q.options],a:q.a,comment:q.comment||""})),answers:[],startedAt:new Date().toISOString(),finishedAt:"",score:null};
 save();go("dashboard",{history:false});renderDashboard();
}
function answerRetentionCheck(i){
 const r=state.retentionCheck,item=r.items[r.index];
 if(!r.active||!item||r.answers[r.index])return;
 r.answers[r.index]={selected:i,correct:i===item.a};save();renderDashboard();
}
function nextRetentionCheck(){
 const r=state.retentionCheck;if(!r.active||!r.answers[r.index])return;
 if(r.index>=r.items.length-1){finishRetentionCheck();return}
 r.index++;save();renderDashboard();
}
function finishRetentionCheck(){
 const r=state.retentionCheck,right=r.answers.filter(x=>x?.correct).length;
 r.score=Math.round(right/Math.max(1,r.items.length)*100);r.active=false;r.finishedAt=new Date().toISOString();
 state.validation.retentionAt=r.finishedAt;state.validation.retentionScore=r.score;
 if(state.pilotEvidence?.post)state.pilotEvidence.retention={at:r.finishedAt,score:r.score};
 proficiencySnapshot("retention_check");
 save();renderDashboard();
}
function retentionCheckHtml(){
 const r=state.retentionCheck,item=r.items[r.index],ans=r.answers[r.index],n=r.index+1;
 if(!r.active||!item)return "";
 const t=term(item.termId);
 return `<div class="card quiz-card"><div class="row between"><span class="tag">ПРОВЕРКА УДЕРЖАНИЯ · ${n}/${r.items.length}</span><span class="muted small">Без карточек и подсказок</span></div><h2>${safe(item.q)}</h2><div>${item.options.map((o,i)=>`<button class="option ${ans?(i===item.a?'correct':i===ans.selected?'wrong':''):''}" ${ans?'disabled':''} onclick="answerRetentionCheck(${i})">${safe(o)}</button>`).join("")}</div>${ans?`<div class="feedback"><strong>${ans.correct?'Верно':'Ошибка'}</strong><p>Правильный ответ: <strong>${safe(item.options[item.a])}</strong>.</p>${t?`<p class="small muted">${safe(t.simple)}</p>`:""}</div><button class="btn feedback-next" onclick="nextRetentionCheck()">${n===r.items.length?'Завершить проверку':'Следующий вопрос'}</button>`:""}</div>`;
}

runRetentionValidation=function(){startRetentionCheck()};
capturePilotRetention=function(){
 if(!state.pilotEvidence?.post){toast("Сначала зафиксируйте итог после экзамена.");return}
 startRetentionCheck();
};

const _renderDashboardV18QA=renderDashboard;
renderDashboard=function(){
 if(state.retentionCheck?.active){
  const root=$("#view-dashboard");if(root)root.innerHTML=retentionCheckHtml();
  return;
 }
 _renderDashboardV18QA();
};

/* Single navigation authority:
   original pushAppHistory/go/restoreHistoryState remain the only Back-stack implementation. */
function qaNavigationInvariant(){
 return typeof pushAppHistory==="function"&&typeof restoreHistoryState==="function";
}
try{renderDashboard()}catch{}


/* ===== Live Investor Dialogue v20 ===== */
state.liveDialogue=Object.assign({started:false,scenario:"first_meeting"},state.liveDialogue||{});

function investorAvatarHtml(){
 return `<div class="investor-avatar" aria-hidden="true"><span>IC</span></div>`;
}
function liveScenarioTabs(){
 return `<div class="live-scenario-tabs" role="tablist">${Object.entries(INVESTOR_SCENARIOS).map(([id,s])=>`<button role="tab" aria-selected="${state.simScenario===id}" class="${state.simScenario===id?'active':''}" onclick="startInvestorScenario('${id}')">${safe(s.title)}</button>`).join("")}</div>`;
}
function liveTermsHtml(){
 const ids=(state.aiWeakTopics||[]).map(x=>term(x)?.id||x).filter(Boolean);
 const learned=TERMS.filter(t=>ids.includes(t.id)).slice(0,4);
 const fallback=TERMS.filter(t=>["traction","retention","cac","ltv","runway","valuation","dilution","tam","pmf","churn"].includes(t.id)).slice(0,4);
 const list=learned.length?learned:fallback;
 return `<div class="dialogue-term-strip">${list.map(t=>`<button onclick="go('learn');setTimeout(()=>openTerm('${t.id}'),0)">${safe(t.word)}</button>`).join("")}</div>`;
}
function liveMessageHtml(m){
 const mine=m.who==="you";
 return `<div class="live-message ${mine?'mine':'investor'}">${mine?'':investorAvatarHtml()}<div><div class="live-message-meta">${mine?'Вы':'AI-инвестор'}</div><div class="live-bubble">${safe(m.text)}</div></div></div>`;
}
function liveRecorderHtml(){
 const connected=aiReady();
 return `<div class="live-composer ${voiceRunning&&voiceChannel==='sim'?'is-recording':''}" id="voice-sim">
   <div class="live-record-head"><div><span class="live-dot"></span><strong id="voiceStatus-sim">${voiceRunning&&voiceChannel==='sim'?'Запись идёт':'Готов к ответу'}</strong></div><span class="live-privacy">${connected?'Аудио отправится только после «Отправить»':'Подключите AI для точной расшифровки'}</span></div>
   <div class="live-transcript" id="voiceTranscript-sim">${voiceBuffers.sim?safe(voiceBuffers.sim):'Говорите естественно. Не нужно диктовать по словам.'}</div>
   <div class="live-composer-actions"><button class="live-mic" id="voiceStart-sim" onclick="toggleVoice('sim')" aria-label="Начать запись"><span>●</span> ${voiceRunning&&voiceChannel==='sim'?'Идёт запись':'Записать ответ'}</button><button class="live-send" onclick="submitVoice('sim')" ${connected?'':'title="Для лучшего качества подключите production AI"'}>Отправить <span>↑</span></button></div>
 </div>`;
}

renderInvestor=function(){
 const scenario=INVESTOR_SCENARIOS[state.simScenario]||INVESTOR_SCENARIOS.first_meeting;
 const msgs=state.messages.length?state.messages:[{who:"ai",text:scenario.opening}];
 const turn=Math.min(state.simSession.turn+1,state.simSession.maxTurns);
 const avg=state.simSession.scores.length?Math.round(state.simSession.scores.reduce((a,b)=>a+b,0)/state.simSession.scores.length):null;
 document.querySelector("#view-investor").innerHTML=`<div class="live-investor-shell">
   <section class="live-investor-main">
    <div class="live-investor-top"><div><span class="tag">LIVE INVESTOR</span><h2>Диалог с инвестором</h2><p>${safe(scenario.desc)}</p></div><div class="live-session-state"><span>${state.simSession.complete?'Завершено':`Вопрос ${turn}/${state.simSession.maxTurns}`}</span>${avg!==null?`<strong>${avg}/100</strong>`:''}</div></div>
    ${liveScenarioTabs()}
    <div class="live-chat" id="simChat">${msgs.map(liveMessageHtml).join("")}</div>
    ${state.simSession.complete?simulatorSummaryHtml():liveRecorderHtml()}
    <div class="live-chat-footer"><button class="live-reset" onclick="startInvestorScenario('${state.simScenario}')">Новая встреча</button><span>${aiReady()?'AI адаптирует следующий вопрос к вашему ответу':'Локальный режим — подключите AI для живого диалога'}</span></div>
   </section>
   <aside class="live-investor-side">
    <div class="live-side-card"><span class="tag">ФОКУС ВСТРЕЧИ</span><h3>${safe(scenario.title)}</h3><p>Отвечайте коротко: тезис → доказательство → цифра или факт → вывод.</p></div>
    <div class="live-side-card"><h3>Термины в живой речи</h3><p>Тренер отслеживает, умеете ли вы применять термин по смыслу, а не просто произносить его.</p>${liveTermsHtml()}</div>
    <div class="live-side-card"><h3>Разбор ответа</h3><div id="simFeedback">${state.simSession.lastFeedback?`<p>${safe(state.simSession.lastFeedback)}</p>`:'<p>После ответа здесь появится только конкретная корректировка — без лишней теории.</p>'}</div></div>
    ${!aiReady()?`<div class="live-side-card ai-connect"><h3>Production voice</h3><p>Для точной серверной расшифровки и динамического диалога укажите HTTPS backend.</p><input id="aiApiBase" class="input" placeholder="https://your-worker.example" value="${safe(apiBase())}"><button class="btn" onclick="saveApiBase()">Подключить</button></div>`:''}
   </aside>
 </div>`;
 const chat=document.querySelector("#simChat");if(chat)chat.scrollTop=chat.scrollHeight;restoreVoiceTranscript("sim");
};

function normalizeTranscript(text){
 return String(text||"").replace(/\s+/g," ").replace(/([А-Яа-яA-Za-z0-9][,.!?])(?:\s+\1){1,}/gi,"$1").trim();
}
transcribeBlob=async function(blob){
 const fd=new FormData(),ext=blob.type.includes("mp4")?"m4a":"webm";
 fd.append("file",blob,"answer."+ext);fd.append("language","ru");
 fd.append("context",JSON.stringify({scenario:state.simScenario,memory:state.aiMemory||"",terms:TERMS.map(t=>t.word).slice(0,120)}));
 const r=await fetch(apiBase()+"/api/transcribe",{method:"POST",body:fd});
 if(!r.ok)throw new Error("TRANSCRIBE_"+r.status);
 const j=await r.json();return normalizeTranscript(j.text||"");
};

const _startMediaVoiceV20=startMediaVoice;
startMediaVoice=async function(ch){
 if(ch!=="sim")return _startMediaVoiceV20(ch);
 if(mediaState.recorder&&mediaState.recorder.state==="recording")return;
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1,sampleRate:48000}});
  let mime="";for(const t of ["audio/webm;codecs=opus","audio/mp4","audio/webm"]){if(MediaRecorder.isTypeSupported(t)){mime=t;break}}
  const rec=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:96000}:{audioBitsPerSecond:96000});
  mediaState.recorder=rec;mediaState.stream=stream;mediaState.ch=ch;mediaState.chunks=[];mediaState.startedAt=Date.now();voiceChannel=ch;voiceRunning=true;
  rec.ondataavailable=e=>{if(e.data&&e.data.size)mediaState.chunks.push(e.data)};
  rec.onstop=()=>{voiceRunning=false;setVoiceUI(ch,"Запись готова",false);stream.getTracks().forEach(t=>t.stop())};
  rec.start(750);setVoiceUI(ch,"Запись идёт",true);const el=document.querySelector("#voiceTranscript-"+ch);if(el)el.textContent="Слушаю… говорите свободно до кнопки «Отправить».";
 }catch(e){console.error(e);toast("Не удалось получить доступ к микрофону.")}
};

const _setVoiceUIV20=setVoiceUI;
setVoiceUI=function(ch,status,running){
 _setVoiceUIV20(ch,status,running);
 if(ch!=="sim")return;
 const wrap=document.querySelector("#voice-sim"),btn=document.querySelector("#voiceStart-sim");
 wrap?.classList.toggle("is-recording",!!running);
 if(btn)btn.innerHTML=running?"<span>●</span> Идёт запись":"<span>●</span> Записать ответ";
};

const _startInvestorScenarioV20=startInvestorScenario;
startInvestorScenario=function(id){
 _startInvestorScenarioV20(id);
 state.liveDialogue={started:true,scenario:id};save();
};


/* ===== Live Dialogue Reliability v21 ===== */
state.liveVoice=Object.assign({busy:false,lastTranscript:"",lastError:"",startedAt:0},state.liveVoice||{});

function setLiveVoiceBusy(busy,label){
 state.liveVoice.busy=!!busy;save();
 const wrap=document.querySelector("#voice-sim"),send=wrap?.querySelector(".live-send"),mic=document.querySelector("#voiceStart-sim"),st=document.querySelector("#voiceStatus-sim");
 if(wrap)wrap.classList.toggle("is-busy",!!busy);
 if(send)send.disabled=!!busy;
 if(mic)mic.disabled=!!busy;
 if(st&&label)st.textContent=label;
}
function liveRecordingSeconds(){return mediaState.startedAt?Math.max(0,Math.floor((Date.now()-mediaState.startedAt)/1000)):0}
function stopLiveTracks(){try{mediaState.stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}}
function liveVoiceError(message){
 state.liveVoice.lastError=String(message||"");state.liveVoice.busy=false;save();setLiveVoiceBusy(false,"Не отправлено");
 const el=document.querySelector("#voiceTranscript-sim");if(el)el.innerHTML=`<strong>Запись сохранена в этой сессии.</strong><br>${safe(message||"Повторите отправку.")}`;
}
function liveRecorderHtml(){
 const connected=aiReady(),recording=!!(mediaState.recorder&&mediaState.ch==="sim"&&mediaState.recorder.state==="recording"),busy=!!state.liveVoice.busy;
 return `<div class="live-composer ${recording?'is-recording':''} ${busy?'is-busy':''}" id="voice-sim">
   <div class="live-record-head"><div><span class="live-dot"></span><strong id="voiceStatus-sim">${busy?'Обрабатываю ответ…':recording?'Запись идёт':'Готов к ответу'}</strong></div><span class="live-privacy">${connected?'Отправка только после нажатия кнопки':'Для точной речи нужен production AI'}</span></div>
   <div class="live-transcript" id="voiceTranscript-sim">${voiceBuffers.sim?safe(voiceBuffers.sim):'Говорите обычным темпом. Можно делать паузы — запись не отправится сама.'}</div>
   <div class="live-composer-actions"><button class="live-mic" id="voiceStart-sim" onclick="toggleVoice('sim')" ${busy?'disabled':''}><span>●</span> ${recording?'Запись идёт':'Записать ответ'}</button><button class="live-send" onclick="submitVoice('sim')" ${busy?'disabled':''}>${busy?'Обработка…':'Отправить'} <span>↑</span></button></div>
 </div>`;
}

const _submitVoiceV21=submitVoice;
submitVoice=async function(ch){
 if(ch!=="sim")return _submitVoiceV21(ch);
 if(state.liveVoice.busy)return;
 const rec=mediaState.recorder;
 if(aiReady()&&rec&&mediaState.ch===ch&&(rec.state==="recording"||rec.state==="paused")){
   if(liveRecordingSeconds()<1){toast("Скажите ответ перед отправкой.");return}
   setLiveVoiceBusy(true,"Завершаю запись…");
   try{
     const done=new Promise((resolve,reject)=>{
       const timer=setTimeout(()=>reject(new Error("RECORDER_STOP_TIMEOUT")),5000);
       rec.addEventListener("stop",()=>{clearTimeout(timer);resolve()},{once:true});
     });
     if(rec.state==="paused")rec.resume();rec.stop();await done;
     const chunks=[...mediaState.chunks],mime=rec.mimeType||"audio/webm",blob=new Blob(chunks,{type:mime});
     if(blob.size<1000)throw new Error("Запись слишком короткая.");
     if(blob.size>23*1024*1024)throw new Error("Запись слишком длинная. Отправьте ответ короче.");
     setLiveVoiceBusy(true,"Точно распознаю речь…");
     const text=await transcribeBlob(blob);
     if(!text)throw new Error("Речь не распознана. Попробуйте ещё раз.");
     voiceBuffers.sim=text;state.liveVoice.lastTranscript=text;state.liveVoice.lastError="";save();
     const el=document.querySelector("#voiceTranscript-sim");if(el)el.textContent=text;
     setLiveVoiceBusy(true,"Инвестор анализирует ответ…");
     await evaluateWithAI("sim",text);
   }catch(e){
     console.error(e);liveVoiceError(e.message==="TRANSCRIBE_502"?"Сервис распознавания временно недоступен. Повторите отправку.":e.message);
   }finally{
     stopLiveTracks();mediaState.recorder=null;mediaState.stream=null;mediaState.chunks=[];voiceRunning=false;state.liveVoice.busy=false;save();
   }
   return;
 }
 if(!aiReady()){toast("Для живого диалога подключите production AI.");return}
 if(voiceBuffers.sim.trim()){
   setLiveVoiceBusy(true,"Инвестор анализирует ответ…");
   try{await evaluateWithAI("sim",voiceBuffers.sim.trim())}finally{state.liveVoice.busy=false;save()}
 }else toast("Сначала запишите ответ.");
};

const _startMediaVoiceV21=startMediaVoice;
startMediaVoice=async function(ch){
 if(ch!=="sim")return _startMediaVoiceV21(ch);
 if(state.liveVoice.busy)return;
 voiceBuffers.sim="";state.liveVoice.lastError="";state.liveVoice.startedAt=Date.now();save();
 return _startMediaVoiceV21(ch);
};

const _renderInvestorV21=renderInvestor;
renderInvestor=function(){
 _renderInvestorV21();
 const chat=document.querySelector("#simChat");
 if(chat){
   chat.setAttribute("aria-live","polite");
   chat.querySelectorAll(".live-bubble").forEach(x=>x.setAttribute("tabindex","0"));
 }
};


/* ===== Final Voice Note Flow v22 ===== */
let livePreparedBlob=null,liveRecordTimer=null,livePreparedSeconds=0;

function clearLiveRecordTimer(){if(liveRecordTimer){clearInterval(liveRecordTimer);liveRecordTimer=null}}
function formatLiveSeconds(sec){const s=Math.max(0,Number(sec)||0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function refreshLiveRecordClock(){
 const rec=mediaState.recorder,st=document.querySelector("#voiceStatus-sim");
 if(rec&&rec.state==="recording"&&st)st.textContent=`Запись идёт · ${formatLiveSeconds(liveRecordingSeconds())}`;
}
function beginLiveRecordClock(){clearLiveRecordTimer();refreshLiveRecordClock();liveRecordTimer=setInterval(refreshLiveRecordClock,500)}
function clearPreparedVoice(){
 livePreparedBlob=null;livePreparedSeconds=0;
 if(mediaState.ch==="sim"){mediaState.chunks=[];mediaState.recorder=null;mediaState.stream=null}
}
async function stopLiveRecordingOnly(){
 const rec=mediaState.recorder;
 if(!rec||mediaState.ch!=="sim"||!["recording","paused"].includes(rec.state))return false;
 try{
  const seconds=Math.max(1,liveRecordingSeconds());
  const done=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error("RECORDER_STOP_TIMEOUT")),5000);
   rec.addEventListener("stop",()=>{clearTimeout(timer);resolve()},{once:true});
  });
  if(rec.state==="paused")rec.resume();
  rec.stop();await done;clearLiveRecordTimer();
  const blob=new Blob([...mediaState.chunks],{type:rec.mimeType||"audio/webm"});
  stopLiveTracks();mediaState.stream=null;mediaState.recorder=null;voiceRunning=false;
  if(blob.size<1000){clearPreparedVoice();throw new Error("Запись слишком короткая.")}
  if(blob.size>23*1024*1024){clearPreparedVoice();throw new Error("Запись слишком длинная. Запишите ответ короче.")}
  livePreparedBlob=blob;livePreparedSeconds=seconds;
  state.liveVoice.lastError="";save();
  setLiveVoiceBusy(false,`Запись готова · ${formatLiveSeconds(seconds)}`);
  const el=document.querySelector("#voiceTranscript-sim");
  if(el)el.textContent=`Голосовой ответ ${formatLiveSeconds(seconds)} готов. Нажмите «Отправить» или запишите заново.`;
  const btn=document.querySelector("#voiceStart-sim");
  if(btn)btn.innerHTML="<span>●</span> Записать заново";
  return true;
 }catch(e){
  clearLiveRecordTimer();stopLiveTracks();mediaState.recorder=null;mediaState.stream=null;voiceRunning=false;
  liveVoiceError(e.message);return false;
 }
}

const _toggleVoiceV22=toggleVoice;
toggleVoice=async function(ch){
 if(ch!=="sim")return _toggleVoiceV22(ch);
 if(state.liveVoice.busy)return;
 const rec=mediaState.recorder;
 if(rec&&mediaState.ch==="sim"&&["recording","paused"].includes(rec.state)){
  await stopLiveRecordingOnly();
  return;
 }
 clearPreparedVoice();voiceBuffers.sim="";
 await startMediaVoice("sim");
 if(mediaState.recorder?.state==="recording")beginLiveRecordClock();
};

const _startMediaVoiceV22=startMediaVoice;
startMediaVoice=async function(ch){
 if(ch!=="sim")return _startMediaVoiceV22(ch);
 clearPreparedVoice();
 const result=await _startMediaVoiceV22(ch);
 if(mediaState.recorder?.state==="recording")beginLiveRecordClock();
 return result;
};

submitVoice=async function(ch){
 if(ch!=="sim")return _submitVoiceV21(ch);
 if(state.liveVoice.busy)return;

 if(mediaState.recorder&&mediaState.ch==="sim"&&["recording","paused"].includes(mediaState.recorder.state)){
  setLiveVoiceBusy(true,"Завершаю запись…");
  const ok=await stopLiveRecordingOnly();
  if(!ok){state.liveVoice.busy=false;save();return}
 }

 const blob=livePreparedBlob;
 if(!aiReady()){toast("Для живого диалога подключите production AI.");return}
 if(!blob){
  if(voiceBuffers.sim.trim()){
   setLiveVoiceBusy(true,"Инвестор анализирует ответ…");
   try{await evaluateWithAI("sim",voiceBuffers.sim.trim())}
   finally{state.liveVoice.busy=false;save()}
   return;
  }
  toast("Сначала запишите голосовой ответ.");return;
 }

 setLiveVoiceBusy(true,"Точно распознаю речь…");
 try{
  const text=await transcribeBlob(blob);
  if(!text)throw new Error("Речь не распознана. Попробуйте ещё раз.");
  voiceBuffers.sim=text;state.liveVoice.lastTranscript=text;state.liveVoice.lastError="";save();
  const el=document.querySelector("#voiceTranscript-sim");if(el)el.textContent=text;
  setLiveVoiceBusy(true,"Инвестор анализирует ответ…");
  await evaluateWithAI("sim",text);
  clearPreparedVoice();
 }catch(e){
  console.error(e);
  liveVoiceError(e.message==="TRANSCRIBE_502"?"Сервис распознавания временно недоступен. Запись сохранена — повторите отправку.":e.message);
 }finally{
  clearLiveRecordTimer();state.liveVoice.busy=false;save();
 }
};

liveRecorderHtml=function(){
 const connected=aiReady(),recording=!!(mediaState.recorder&&mediaState.ch==="sim"&&mediaState.recorder.state==="recording"),busy=!!state.liveVoice.busy,prepared=!!livePreparedBlob;
 return `<div class="live-composer ${recording?'is-recording':''} ${busy?'is-busy':''} ${prepared?'is-prepared':''}" id="voice-sim">
   <div class="live-record-head"><div><span class="live-dot"></span><strong id="voiceStatus-sim">${busy?'Обрабатываю ответ…':recording?`Запись идёт · ${formatLiveSeconds(liveRecordingSeconds())}`:prepared?`Запись готова · ${formatLiveSeconds(livePreparedSeconds)}`:'Готов к ответу'}</strong></div><span class="live-privacy">${connected?'Ничего не отправляется без «Отправить»':'Для точной речи нужен production AI'}</span></div>
   <div class="live-transcript" id="voiceTranscript-sim">${voiceBuffers.sim?safe(voiceBuffers.sim):prepared?`Голосовой ответ ${formatLiveSeconds(livePreparedSeconds)} готов к отправке.`:'Говорите обычным темпом. Можно делать паузы.'}</div>
   <div class="live-composer-actions"><button class="live-mic" id="voiceStart-sim" onclick="toggleVoice('sim')" ${busy?'disabled':''}><span>●</span> ${recording?'Остановить':prepared?'Записать заново':'Записать ответ'}</button><button class="live-send" onclick="submitVoice('sim')" ${busy?'disabled':''}>${busy?'Обработка…':'Отправить'} <span>↑</span></button></div>
 </div>`;
};

const _renderInvestorV22=renderInvestor;
renderInvestor=function(){
 _renderInvestorV22();
 const composer=document.querySelector("#voice-sim");
 if(composer&&livePreparedBlob){
  composer.classList.add("is-prepared");
  const st=document.querySelector("#voiceStatus-sim");if(st)st.textContent=`Запись готова · ${formatLiveSeconds(livePreparedSeconds)}`;
 }
};

window.addEventListener("pagehide",()=>{clearLiveRecordTimer();stopLiveTracks()});


/* ===== Adaptive Learning Loop v23 ===== */
state.adaptiveLoop=Object.assign({gaps:{},meetingReports:[],lastRecommendation:null},state.adaptiveLoop||{});

function adaptiveGapKey(res){
 const raw=(res?.focus_topics||[])[0]||state.aiWeakTopics?.[0]||"communication";
 return String(raw).slice(0,80);
}
function recordAdaptiveGap(res,score){
 const gap=String(res?.learning_gap||"none"),key=adaptiveGapKey(res);
 if(gap==="none"&&score>=80)return;
 const id=`${key}:${gap}`;
 const prev=state.adaptiveLoop.gaps[id]||{topic:key,gap,count:0,lastScore:100,reason:"",updatedAt:0};
 prev.count+=1;prev.lastScore=score;prev.reason=String(res?.learning_gap_reason||res?.verdict||"").slice(0,300);prev.updatedAt=Date.now();
 state.adaptiveLoop.gaps[id]=prev;
 state.adaptiveLoop.lastRecommendation={topic:key,gap,reason:prev.reason,nextDrill:res?.next_drill||"coach"};
}
function adaptiveRecommendation(){
 const rows=Object.values(state.adaptiveLoop.gaps||{}).sort((a,b)=>(b.count*12+(100-b.lastScore))-(a.count*12+(100-a.lastScore)));
 return rows[0]||null;
}
function buildMeetingReport(res){
 const scores=state.simSession?.scores||[],avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):Number(res?.score||0);
 const dims=res?.dimensions||{},weak=Object.entries(dims).filter(([,v])=>Number.isFinite(Number(v))).sort((a,b)=>a[1]-b[1]).slice(0,2);
 const report={at:Date.now(),scenario:state.simScenario,score:avg,summary:String(res?.session_summary||res?.verdict||""),strengths:(res?.strengths||[]).slice(0,3),improvements:(res?.improvements||[]).slice(0,3),contradictions:(res?.contradictions||[]).slice(0,4),redFlags:(res?.red_flags||[]).slice(0,4),weakSkills:weak,modelAnswer:String(res?.model_answer||""),nextDrill:res?.next_drill||"coach",gap:res?.learning_gap||"none",gapReason:res?.learning_gap_reason||""};
 state.adaptiveLoop.meetingReports.unshift(report);state.adaptiveLoop.meetingReports=state.adaptiveLoop.meetingReports.slice(0,12);save();return report;
}
function meetingReportHtml(report){
 if(!report)return "";
 const labels={directness:"Прямота",clarity:"Ясность",evidence:"Доказательства",metrics:"Метрики",terminology:"Терминология",risk_handling:"Работа с риском",structure:"Структура"};
 return `<div class="meeting-report"><div class="meeting-report-head"><div><span class="tag">РАЗБОР ВСТРЕЧИ</span><h3>${safe(report.score)}/100</h3></div><button class="btn" onclick="openAdaptiveTraining()">Тренировать слабое место</button></div>
 ${report.summary?`<p>${safe(report.summary)}</p>`:""}
 <div class="meeting-report-grid"><div><strong>Что уже хорошо</strong>${report.strengths.length?`<ul>${report.strengths.map(x=>`<li>${safe(x)}</li>`).join("")}</ul>`:"<p>Нужна дополнительная практика.</p>"}</div>
 <div><strong>Исправить в первую очередь</strong>${report.improvements.length?`<ul>${report.improvements.map(x=>`<li>${safe(x)}</li>`).join("")}</ul>`:"<p>Критичных замечаний нет.</p>"}</div></div>
 ${report.weakSkills.length?`<p class="small"><strong>Слабые навыки:</strong> ${report.weakSkills.map(([k,v])=>`${safe(labels[k]||k)} ${safe(v)}/100`).join(" · ")}</p>`:""}
 ${report.contradictions.length?`<p><strong>Противоречия:</strong> ${report.contradictions.map(safe).join(" • ")}</p>`:""}
 ${report.redFlags.length?`<p><strong>Red flags:</strong> ${report.redFlags.map(safe).join(" • ")}</p>`:""}
 ${report.modelAnswer?`<details><summary>Сильный вариант последнего ответа</summary><p>${safe(report.modelAnswer)}</p></details>`:""}</div>`;
}
function openAdaptiveTraining(){
 const r=adaptiveRecommendation();
 if(r){state.aiWeakTopics=[r.topic,...state.aiWeakTopics.filter(x=>x!==r.topic)].slice(0,20);save()}
 go("coach");
}
const _applyAiResultV23=applyAiResult;
applyAiResult=function(res,mode,userText){
 const score=_applyAiResultV23(res,mode,userText);
 recordAdaptiveGap(res,score);
 if(mode==="sim"&&res?.session_complete)buildMeetingReport(res);
 save();return score;
};

const _simulatorSummaryHtmlV23=simulatorSummaryHtml;
simulatorSummaryHtml=function(){
 const base=_simulatorSummaryHtmlV23();
 const report=state.adaptiveLoop.meetingReports?.[0];
 return `${base}${report?meetingReportHtml(report):""}`;
};

const _liveTermsHtmlV23=liveTermsHtml;
liveTermsHtml=function(){
 const rec=adaptiveRecommendation();
 const base=_liveTermsHtmlV23();
 return `${rec?`<div class="adaptive-focus"><strong>Текущий пробел:</strong> ${safe(rec.topic)}<br><span>${safe(rec.reason||"Нужно закрепить применение в речи.")}</span></div>`:""}${base}`;
};


/* ===== Network + Session Reliability v24 ===== */
state.aiTransport=Object.assign({lastReadyAt:0,lastReady:false,lastError:""},state.aiTransport||{});
state.adaptiveLoop.lastSimResult=state.adaptiveLoop.lastSimResult||null;

function waitMs(ms){return new Promise(r=>setTimeout(r,ms))}
function retryableStatus(status){return [408,425,429,500,502,503,504].includes(Number(status))}
async function fetchWithTimeoutRetry(url,options={},timeoutMs=45000,retries=1){
 let lastError=null;
 for(let attempt=0;attempt<=retries;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const r=await fetch(url,{...options,signal:controller.signal});
   clearTimeout(timer);
   if(r.ok||!retryableStatus(r.status)||attempt===retries)return r;
   lastError=new Error(`HTTP_${r.status}`);
  }catch(e){
   clearTimeout(timer);lastError=e;
   if(attempt===retries)throw e;
  }
  await waitMs(500*(attempt+1));
 }
 throw lastError||new Error("NETWORK_ERROR");
}
async function checkAiBackend(force=false){
 if(!aiReady())return false;
 if(!force&&Date.now()-Number(state.aiTransport.lastReadyAt||0)<120000)return !!state.aiTransport.lastReady;
 try{
  const r=await fetchWithTimeoutRetry(apiBase()+"/readyz",{method:"GET"},8000,0);
  state.aiTransport.lastReady=r.ok;state.aiTransport.lastReadyAt=Date.now();state.aiTransport.lastError=r.ok?"":`HTTP_${r.status}`;
 }catch(e){
  state.aiTransport.lastReady=false;state.aiTransport.lastReadyAt=Date.now();state.aiTransport.lastError=String(e?.name==="AbortError"?"TIMEOUT":e?.message||e);
 }
 save();return state.aiTransport.lastReady;
}

aiCoach=async function(mode,text,extra={}){
 if(!aiReady())throw new Error("AI_NOT_CONFIGURED");
 const payload={mode,transcript:text,memory:state.aiMemory,history:state.aiHistory.slice(-12),weak_topics:state.aiWeakTopics.slice(0,12),course_day:state.day,project_profile:state.projectProfile,context:extra};
 const r=await fetchWithTimeoutRetry(apiBase()+"/api/coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)},50000,1);
 if(!r.ok){const e=await r.text();throw new Error("AI "+r.status+": "+e.slice(0,180))}
 return r.json();
};

transcribeBlob=async function(blob){
 if(!aiReady())throw new Error("AI_NOT_CONFIGURED");
 let last=null;
 for(let attempt=0;attempt<2;attempt++){
  const fd=new FormData(),ext=blob.type.includes("mp4")?"m4a":"webm";
  fd.append("file",blob,"answer."+ext);fd.append("language","ru");
  fd.append("context",JSON.stringify({scenario:state.simScenario,memory:state.aiMemory||"",terms:TERMS.map(t=>t.word).slice(0,120)}));
  try{
   const r=await fetchWithTimeoutRetry(apiBase()+"/api/transcribe",{method:"POST",body:fd},65000,0);
   if(r.ok){const j=await r.json();return normalizeTranscript(j.text||"")}
   last=new Error("TRANSCRIBE_"+r.status);
   if(!retryableStatus(r.status))throw last;
  }catch(e){last=e;if(attempt===1)throw e}
  await waitMs(650);
 }
 throw last||new Error("TRANSCRIBE_FAILED");
};

const _startMediaVoiceV24=startMediaVoice;
startMediaVoice=async function(ch){
 if(ch==="sim"&&aiReady())checkAiBackend(false).then(ok=>{if(!ok&&!voiceRunning)toast("AI backend сейчас недоступен. Запись можно сделать, но отправка может потребовать повторной попытки.")}).catch(()=>{});
 return _startMediaVoiceV24(ch);
};

const _applyAiResultV24=applyAiResult;
applyAiResult=function(res,mode,userText){
 if(mode==="sim")state.adaptiveLoop.lastSimResult=res;
 return _applyAiResultV24(res,mode,userText);
};

const _evaluateWithAIV24=evaluateWithAI;
evaluateWithAI=async function(ch,text){
 const wasComplete=!!state.simSession?.complete;
 const reportCount=state.adaptiveLoop?.meetingReports?.length||0;
 const result=await _evaluateWithAIV24(ch,text);
 if(ch==="sim"&&!state.exam?.active&&!wasComplete&&state.simSession?.complete){
  const currentCount=state.adaptiveLoop?.meetingReports?.length||0;
  if(currentCount===reportCount&&state.adaptiveLoop.lastSimResult){
   buildMeetingReport({...state.adaptiveLoop.lastSimResult,session_complete:true,session_summary:state.simSession.summary||state.adaptiveLoop.lastSimResult.session_summary||state.adaptiveLoop.lastSimResult.verdict||""});
   save();renderInvestor();renderDashboard();
  }
 }
 return result;
};

function aiTransportBadge(){
 if(!aiReady())return `<span class="transport-badge off">AI не подключён</span>`;
 if(!state.aiTransport.lastReadyAt)return `<span class="transport-badge">AI</span>`;
 return `<span class="transport-badge ${state.aiTransport.lastReady?'ok':'warn'}">${state.aiTransport.lastReady?'AI online':'AI недоступен'}</span>`;
}
const _renderInvestorV24=renderInvestor;
renderInvestor=function(){
 _renderInvestorV24();
 const top=document.querySelector(".live-investor-top .tag");
 if(top&&!document.querySelector(".transport-badge"))top.insertAdjacentHTML("afterend",aiTransportBadge());
};


/* ===== Pilot Data Integrity + Session Resume v25 ===== */
state.schemaVersion=28;
state.sessionRecovery=Object.assign({lastSavedAt:0,lastView:"dashboard"},state.sessionRecovery||{});

function compactStateForStorage(){
 const copy={...state};
 copy.aiHistory=(copy.aiHistory||[]).slice(-30);
 copy.messages=(copy.messages||[]).slice(-30);
 copy.proficiencyHistory=(copy.proficiencyHistory||[]).slice(-60);
 if(copy.adaptiveLoop){
  copy.adaptiveLoop={...copy.adaptiveLoop,
   meetingReports:(copy.adaptiveLoop.meetingReports||[]).slice(0,12),
   lastSimResult:copy.adaptiveLoop.lastSimResult||null
  };
 }
 return copy;
}
function persistStateSafe(){
 state.sessionRecovery.lastSavedAt=Date.now();
 try{
  localStorage.setItem("investorCoachState",JSON.stringify(compactStateForStorage()));
  return true;
 }catch(e){
  console.error("State save failed",e);
  try{
   const emergency={...compactStateForStorage(),aiHistory:(state.aiHistory||[]).slice(-8),messages:(state.messages||[]).slice(-12),proficiencyHistory:(state.proficiencyHistory||[]).slice(-20)};
   localStorage.setItem("investorCoachState",JSON.stringify(emergency));return true;
  }catch(e2){console.error("Emergency state save failed",e2);return false}
 }
}
const _saveV25=save;
save=function(){return persistStateSafe()};

function currentAppView(){
 return document.querySelector(".view.active")?.id?.replace(/^view-/,"")||"dashboard";
}
function checkpointSession(){
 state.sessionRecovery.lastView=currentAppView();
 persistStateSafe();
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")checkpointSession()});
window.addEventListener("pagehide",checkpointSession);

function cancelLiveVoiceSafely(){
 clearLiveRecordTimer?.();
 try{
  const rec=mediaState?.recorder;
  if(rec&&["recording","paused"].includes(rec.state))rec.stop();
 }catch(_){}
 stopLiveTracks?.();
 voiceRunning=false;
}
const _startInvestorScenarioV25=startInvestorScenario;
startInvestorScenario=function(id){
 cancelLiveVoiceSafely();
 clearPreparedVoice?.();
 _startInvestorScenarioV25(id);
 if(state.adaptiveLoop)state.adaptiveLoop.lastSimResult=null;
 save();
};

function sessionResumeHtml(){
 const s=state.simSession;
 if(!s?.active||s.complete||!state.messages?.length)return "";
 const title=INVESTOR_SCENARIOS[state.simScenario]?.title||"Встреча";
 return `<div class="session-resume"><strong>${safe(title)} · вопрос ${Math.min((s.turn||0)+1,s.maxTurns||6)}/${s.maxTurns||6}</strong><span>Сессия сохранена. Можно продолжить с текущего вопроса.</span></div>`;
}
const _renderInvestorV25=renderInvestor;
renderInvestor=function(){
 _renderInvestorV25();
 const main=document.querySelector(".live-investor-main");
 if(main&&!main.querySelector(".session-resume")){
  const html=sessionResumeHtml();
  if(html)main.insertAdjacentHTML("afterbegin",html);
 }
};

function exportLearningData(){
 const payload={exportedAt:new Date().toISOString(),schemaVersion:state.schemaVersion,
  progress:{day:state.day,streak:state.streak,learned:state.learned,srs:state.srs,coachStats:state.coachStats,skillProfile:state.skillProfile,baseline:state.baseline,proficiencyHistory:state.proficiencyHistory},
  investor:{scenario:state.simScenario,session:state.simSession,meetingReports:state.adaptiveLoop?.meetingReports||[],gaps:state.adaptiveLoop?.gaps||{}},
  readiness:typeof professionalReadiness==="function"?professionalReadiness():null};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`investor-coach-progress-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}


/* ===== Pilot Instrumentation v26 ===== */
state.pilotMetrics=Object.assign({firstSeenAt:"",events:[],lastSessionAt:""},state.pilotMetrics||{});
if(!state.pilotMetrics.firstSeenAt)state.pilotMetrics.firstSeenAt=new Date().toISOString();
const PILOT_RUNTIME_SESSION=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);

function pilotEvent(type,data={}){
 const clean={};
 Object.entries(data||{}).forEach(([k,v])=>{
  if(v==null)return;
  if(typeof v==="number"||typeof v==="boolean")clean[k]=v;
  else if(typeof v==="string")clean[k]=v.slice(0,120);
 });
 const e={at:Date.now(),day:today(),session:PILOT_RUNTIME_SESSION,type:String(type).slice(0,60),data:clean};
 state.pilotMetrics.events.push(e);
 state.pilotMetrics.events=state.pilotMetrics.events.slice(-800);
 state.pilotMetrics.lastSessionAt=new Date().toISOString();
 persistStateSafe();
 return e;
}
function pilotEvents(type){return (state.pilotMetrics.events||[]).filter(e=>!type||e.type===type)}
function pilotActiveDays(){
 return new Set((state.pilotMetrics.events||[]).map(e=>e.day).filter(Boolean)).size;
}
function pilotSessionMinutes(){
 const events=state.pilotMetrics.events||[],starts=events.filter(e=>e.type==="app_session_started"),ends=events.filter(e=>e.type==="app_session_ended");
 let ms=0;
 for(const s of starts){
  const e=ends.find(x=>x.data?.session===s.session&&x.at>=s.at);
  if(e)ms+=Math.max(0,Math.min(e.at-s.at,8*60*60*1000));
 }
 return Math.round(ms/60000);
}
function pilotCoachAccuracy(){
 const rows=pilotEvents("coach_answer"),n=rows.length;
 return n?Math.round(100*rows.filter(e=>e.data?.correct).length/n):null;
}
function pilotMetricSummary(){
 const events=state.pilotMetrics.events||[];
 const count=t=>events.filter(e=>e.type===t).length;
 const voice=events.filter(e=>e.type==="ai_evaluation"&&["sim","coach","speak","pitch"].includes(e.data?.mode)).length;
 const simAnswers=events.filter(e=>e.type==="ai_evaluation"&&e.data?.mode==="sim").length;
 const placement=state.baseline?.captured?state.baseline.readiness:(state.placement?.done?state.placement.score:null);
 const current=typeof professionalReadiness==="function"?professionalReadiness():null;
 return {
  activeDays:pilotActiveDays(),
  coachAnswers:count("coach_answer"),
  voiceEvaluations:voice,
  investorAnswers:simAnswers,
  meetingsStarted:count("investor_session_started"),
  examsStarted:count("exam_started"),
  retentionChecks:count("retention_completed"),
  baseline:placement,
  current,
  readinessDelta:placement==null||current==null?null:Math.round(current-placement),
  retention:state.validation?.retentionScore??null,
  coachAccuracy:pilotCoachAccuracy(),
  sessionMinutes:pilotSessionMinutes()
 };
}
function pilotSummaryHtml(){
 if(!state.placement?.done)return "";
 const s=pilotMetricSummary(),delta=s.readinessDelta;
 return `<div class="card pilot-metrics-card"><div class="row between"><div><span class="tag">РЕЗУЛЬТАТ ОБУЧЕНИЯ</span><h3>${s.current??0}% · Professional Readiness</h3><p class="muted">Локальная статистика реальной практики на этом устройстве.</p></div><button class="btn secondary" onclick="exportPilotMetrics()">Скачать отчёт</button></div>
 <div class="pilot-metrics-grid">
  <div><strong>${s.activeDays}</strong><span>активных дней</span></div>
  <div><strong>${s.coachAnswers}</strong><span>ответов Coach</span></div>
  <div><strong>${s.investorAnswers}</strong><span>ответов инвестору</span></div>
  <div><strong>${s.voiceEvaluations}</strong><span>AI-разборов речи</span></div>
 </div>
 <div class="pilot-metrics-foot"><span>Старт: <strong>${s.baseline??"—"}%</strong></span><span>Сейчас: <strong>${s.current??"—"}%</strong></span><span>Изменение: <strong>${delta==null?"—":`${delta>0?"+":""}${delta} п.п.`}</strong></span><span>Удержание: <strong>${s.retention==null?"—":s.retention+"%"}</strong></span><span>Coach accuracy: <strong>${s.coachAccuracy==null?"—":s.coachAccuracy+"%"}</strong></span><span>Время: <strong>${s.sessionMinutes} мин</strong></span></div>
 <p class="small muted">В отчёт не попадают тексты ваших ответов и аудиозаписи — только учебные события и баллы.</p></div>`;
}
function exportPilotMetrics(){
 const summary=pilotMetricSummary();
 const report={
  product:"Investor Coach",
  schemaVersion:28,
  exportedAt:new Date().toISOString(),
  firstSeenAt:state.pilotMetrics.firstSeenAt,
  summary,
  baseline:state.baseline||null,
  latestExam:state.exam?.complete?{score:examAverage(),grade:state.exam.grade||"",finishedAt:state.exam.finishedAt||null}:null,
  retention:state.validation?.retentionScore==null?null:{score:state.validation.retentionScore,at:state.validation.retentionAt||null},
  skillProfile:snapshotSkills(),
  events:(state.pilotMetrics.events||[]).map(e=>({at:e.at,day:e.day,type:e.type,data:e.data}))
 };
 const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
 const a=document.createElement("a"),url=URL.createObjectURL(blob);
 a.href=url;a.download=`investor-coach-pilot-${today()}.json`;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

const _coachRecordResultV26=coachRecordResult;
coachRecordResult=function(task,ok){
 const result=_coachRecordResultV26(task,ok);
 const stat=task?.termId?coachStat(task.termId):null;
 pilotEvent("coach_answer",{termId:task?.termId||"",taskType:task?.type||"",correct:!!ok,mastery:stat?.mastery??0});
 return result;
};

const _finishPlacementV26=finishPlacement;
finishPlacement=function(){
 const wasDone=!!state.placement?.done;
 const result=_finishPlacementV26();
 if(!wasDone&&state.placement?.done)pilotEvent("placement_completed",{score:state.placement.score??0,plan:state.placement.recommended||state.coachPlan||""});
 return result;
};

const _finishRetentionCheckV26=finishRetentionCheck;
finishRetentionCheck=function(){
 const wasActive=!!state.retentionCheck?.active;
 const result=_finishRetentionCheckV26();
 if(wasActive&&!state.retentionCheck?.active)pilotEvent("retention_completed",{score:state.retentionCheck.score??0});
 return result;
};

const _applyAiResultV26=applyAiResult;
applyAiResult=function(res,mode,userText){
 const score=_applyAiResultV26(res,mode,userText);
 pilotEvent("ai_evaluation",{mode:String(mode||""),score,learningGap:res?.learning_gap||"none",nextDrill:res?.next_drill||""});
 return score;
};

const _startInvestorScenarioV26=startInvestorScenario;
startInvestorScenario=function(id){
 const result=_startInvestorScenarioV26(id);
 pilotEvent("investor_session_started",{scenario:id||state.simScenario||""});
 return result;
};

const _startInvestorExamV26=startInvestorExam;
startInvestorExam=function(){
 const result=_startInvestorExamV26();
 pilotEvent("exam_started",{maxTurns:state.exam?.maxTurns||10});
 return result;
};

const _renderDashboardV26=renderDashboard;
renderDashboard=function(){
 _renderDashboardV26();
 if(state.placement?.active||state.retentionCheck?.active)return;
 const root=$("#view-dashboard");
 if(root&&!root.querySelector(".pilot-metrics-card"))root.insertAdjacentHTML("beforeend",pilotSummaryHtml());
};

pilotEvent("app_session_started",{version:"28.0.0"});
let pilotSessionClosed=false;
function closePilotSession(){
 if(pilotSessionClosed)return;
 pilotSessionClosed=true;
 pilotEvent("app_session_ended",{session:PILOT_RUNTIME_SESSION,durationMinutes:Math.round((Date.now()-Number((pilotEvents("app_session_started").find(e=>e.session===PILOT_RUNTIME_SESSION)?.at||Date.now())))/60000)});
}
window.addEventListener("pagehide",closePilotSession,{once:true});
try{renderDashboard()}catch{}

/* ===== Answer Evaluation Integrity v28 ===== */
function answerEvaluationSelfTest(){
 const cases=[
  {options:["CAC","Retention","ARR"],selected:1,answer:1,want:true},
  {options:["CAC","Retention","ARR"],selected:1,answer:"1",want:true},
  {options:["CAC","Retention","ARR"],selected:1,answer:2,want:false},
  {options:["CAC","Retention","ARR"],selected:1,answer:0,want:false},
  {options:["CAC","Retention","ARR"],selected:2,answer:1,want:false},
  {options:["Retention","Retention","ARR"],selected:1,answer:0,want:true},
  {options:[" retention ","CAC","ARR"],selected:0,answer:0,want:true}
 ];
 return cases.every(c=>answerMatches(c.options,c.selected,c.answer)===c.want);
}
