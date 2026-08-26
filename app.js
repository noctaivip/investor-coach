const state = JSON.parse(localStorage.getItem("investorCoachState") || "null") || {
  day:1, streak:0, learned:{}, correct:0, total:0, weak:[], pitchScores:[], simStep:0, messages:[]
};
const $ = s => document.querySelector(s);
const save = () => localStorage.setItem("investorCoachState", JSON.stringify(state));
const toast = m => { const t=$("#toast"); t.textContent=m; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800); };
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
const term = id => TERMS.find(x=>x.id===id);
const CATEGORY_ORDER=["Метрики","Рынок","Финансы","Фандрайзинг","Рост","Коммуникация"];

function renderDashboard(){
  const learned=Object.keys(state.learned).length, avg=pct(state.correct,state.total);
  $("#view-dashboard").innerHTML = `
    <div class="grid grid-2">
      <div class="card hero">
        <div class="eyebrow hero-eyebrow">МИССИЯ НА СЕГОДНЯ</div>
        <h2>Думайте как инвестор.</h2>
        <p>Изучайте терминологию, применяйте её к своему стартапу, проговаривайте ответы вслух и тренируйтесь в симуляциях встречи с инвестором. Слабые темы влияют на следующие упражнения.</p>
        <div class="row">
          <button class="btn" onclick="go('train')">Начать тренировку</button>
          <button class="btn secondary" onclick="go('investor')">Симуляция инвестора</button>
        </div>
      </div>
      <div class="card">
        <div class="eyebrow">30-ДНЕВНАЯ ПРОГРАММА</div>
        <div class="metric">День ${state.day} из 30</div>
        <div class="progress"><div style="width:${state.day/30*100}%"></div></div>
        <p class="muted">Курс адаптируется к ошибкам и слабым терминам.</p>
        <button class="btn secondary" onclick="go('roadmap')">Открыть программу</button>
      </div>
    </div>
    <div class="grid grid-4 stats-grid">
      <div class="card"><div class="muted small">Изучено терминов</div><div class="metric">${learned}</div><div class="small muted">из ${TERMS.length}</div></div>
      <div class="card"><div class="muted small">Точность тестов</div><div class="metric">${avg}%</div><div class="small muted">ответов: ${state.total}</div></div>
      <div class="card"><div class="muted small">Слабые термины</div><div class="metric">${state.weak.length}</div><div class="small muted">повторить в первую очередь</div></div>
      <div class="card"><div class="muted small">Оценка pitch</div><div class="metric">${state.pitchScores.length ? Math.round(state.pitchScores.reduce((a,b)=>a+b,0)/state.pitchScores.length) : "—"}</div><div class="small muted">средняя оценка</div></div>
    </div>
    <h2 class="section-title">Карта знаний</h2>
    <div class="grid grid-3">${CATEGORY_ORDER.map(c=>{
      const ts=TERMS.filter(t=>t.cat===c); const l=ts.filter(t=>state.learned[t.id]).length;
      return `<div class="card"><div class="between row"><strong>${c}</strong><span class="small muted">${l}/${ts.length}</span></div><div class="progress card-progress"><div style="width:${pct(l,ts.length)}%"></div></div></div>`;
    }).join("")}</div>
    <h2 class="section-title">Что изучать дальше</h2>
    <div class="card"><strong>${state.weak.length && term(state.weak[0]) ? term(state.weak[0]).word : "Retention"}</strong><p class="muted">${state.weak.length ? "Это одна из ваших слабых тем. Закрепите её перед изучением новых терминов." : "Начните с одной из ключевых инвесторских метрик: сколько пользователей остаются с продуктом."}</p><button class="btn" onclick="go('learn')">Перейти к изучению</button></div>
  `;
}

let learnCat="Все";
function renderLearn(){
  const cats=["Все",...new Set(TERMS.map(t=>t.cat))];
  const list=TERMS.filter(t=>learnCat==="Все"||t.cat===learnCat);
  $("#view-learn").innerHTML=`
    <div class="filterbar" aria-label="Фильтр по категориям">${cats.map(c=>`<button class="${c===learnCat?'active':''}" onclick="setLearnCat('${c}')">${c}</button>`).join("")}</div>
    <div class="grid grid-3">${list.map(t=>`
      <div class="card term-card">
        <div><span class="tag">${t.cat}</span><span class="tag">${t.level}</span>
        <div class="term-word">${t.word}</div><div class="muted small">${t.full}</div>
        <p class="definition">${t.simple}</p>
        ${t.formula?`<div class="formula small"><strong>Формула:</strong> ${t.formula}</div>`:""}
        <details class="term-details"><summary>Контекст инвестора</summary><p class="small">${t.example}</p><p class="small"><strong>Вопрос инвестора:</strong> ${t.investor}</p><p class="small"><strong>Почему это важно:</strong> ${t.why}</p></details>
        </div>
        <button class="btn secondary" onclick="markLearned('${t.id}')">${state.learned[t.id]?'✓ Изучено':'Отметить изученным'}</button>
      </div>`).join("")}</div>`;
}
function setLearnCat(c){learnCat=c;renderLearn();}
function markLearned(id){state.learned[id]=true; save(); renderLearn(); renderDashboard(); toast("Термин добавлен в карту знаний.");}

let quizIndex=0, quizAnswered=false, lastAnswer=-1;
function renderTrain(){
  const q=QUIZ[quizIndex%QUIZ.length];
  $("#view-train").innerHTML=`
    <div class="quiz">
      <div class="row between"><span class="tag">ТРЕНИРОВКА • ${quizIndex+1}/${QUIZ.length}</span><span class="muted small">Слабые темы повторяются автоматически</span></div>
      <div class="card quiz-card">
        <h2>${q.q}</h2>
        <div>${q.options.map((o,i)=>`<button class="option ${quizAnswered?(i===q.a?'correct':i===lastAnswer?'wrong':''):''}" ${quizAnswered?'disabled':''} onclick="answerQuiz(${i})">${o}</button>`).join("")}</div>
        ${quizAnswered?`<div class="feedback"><strong>${q.a===lastAnswer?'Верно ✓':'Неверно.'}</strong><br>${q.why}</div><button class="btn feedback-next" onclick="nextQuiz()">Следующий вопрос</button>`:""}
      </div>
      <div class="card memory-card"><strong>Правило запоминания</strong><p class="muted">Не заучивайте только аббревиатуру. Свяжите термин с его назначением, примером и вопросом инвестора, на который он отвечает.</p></div>
    </div>`;
}
function answerQuiz(i){
  if(quizAnswered)return;
  lastAnswer=i; quizAnswered=true; state.total++;
  const q=QUIZ[quizIndex%QUIZ.length];
  if(i===q.a){state.correct++;}
  else {
    const found=term(q.termId);
    if(found&&!state.weak.includes(found.id)) state.weak.unshift(found.id);
  }
  save(); renderTrain(); renderDashboard();
}
function nextQuiz(){quizIndex++;quizAnswered=false;lastAnswer=-1;renderTrain();}

let recognition=null, speakTerm=TERMS.find(t=>t.id==="retention");
function renderSpeak(){
 $("#view-speak").innerHTML=`
 <div class="grid grid-2">
  <div class="card">
   <span class="tag">${speakTerm.cat}</span><h2>${speakTerm.word}</h2><p class="muted">${speakTerm.full}</p>
   <h3>Объясните термин своими словами.</h3>
   <textarea id="speakText" placeholder="Напишите или продиктуйте объяснение..."></textarea>
   <div class="row action-row"><button class="btn" onclick="evaluateSpeak()">Оценить ответ</button><button class="btn secondary" onclick="startSpeech()">🎙 Диктовать</button><button class="btn secondary" onclick="newSpeakTerm()">Следующий термин</button></div>
   <div id="speakResult"></div>
  </div>
  <div class="card"><h3>Контекст инвестора</h3><p>${speakTerm.investor}</p><h3>Пример</h3><p class="muted">${speakTerm.example}</p><h3>Почему это важно</h3><p class="muted">${speakTerm.why}</p></div>
 </div>`;
}
function evaluateSpeak(){
 const text=($("#speakText").value||"").trim().toLowerCase();
 const base=(speakTerm.word+" "+speakTerm.full+" "+speakTerm.simple).toLowerCase().replace(/[(),—]/g," ");
 const keywords=[...new Set(base.split(/\s+/).filter(x=>x.length>4))];
 const hits=keywords.filter(k=>text.includes(k)).length;
 const score=Math.min(100,30+hits*15+(text.length>60?25:0));
 if(score<70&&!state.weak.includes(speakTerm.id))state.weak.unshift(speakTerm.id);
 state.learned[speakTerm.id]=true;save();
 $("#speakResult").innerHTML=`<div class="feedback"><strong>Оценка объяснения: ${score}/100</strong><p>${score>=80?"Хорошо. Вы связали термин с его смыслом.":"Нужно ещё потренироваться. Объясните смысл, приведите пример и скажите, почему термин важен инвестору."}</p><p class="small"><strong>Сильный ответ должен включать:</strong> ${speakTerm.simple} + пример + значение для инвестора.</p></div>`;
}
function newSpeakTerm(){speakTerm=TERMS[Math.floor(Math.random()*TERMS.length)];renderSpeak();}
function startSpeech(){
 if(!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)){toast("Распознавание речи недоступно в этом браузере.");return;}
 const R=window.SpeechRecognition||window.webkitSpeechRecognition;
 recognition=new R(); recognition.lang="ru-RU"; recognition.interimResults=false;
 recognition.onresult=e=>{$("#speakText").value=e.results[0][0].transcript;toast("Речь распознана.");};
 recognition.onerror=()=>toast("Не удалось распознать речь.");
 recognition.start(); toast("Слушаю…");
}

let pitchTopic="BarakaWay";
const PITCH_LABELS={problem:"Проблема",solution:"Решение",market:"Рынок",traction:"Traction",model:"Модель",ask:"Запрос"};
function renderPitch(){
 const p=PITCH_TOPICS[pitchTopic];
 $("#view-pitch").innerHTML=`
 <div class="grid grid-2">
  <div class="card">
   <div class="row between"><div><span class="tag">5-МИНУТНЫЙ PITCH</span><h2>${pitchTopic}</h2></div><select class="input pitch-select" onchange="pitchTopic=this.value;renderPitch()">${Object.keys(PITCH_TOPICS).map(x=>`<option ${x===pitchTopic?'selected':''}>${x}</option>`).join("")}</select></div>
   <p class="muted">Используйте эту структуру как опору, затем попробуйте рассказать pitch без чтения. Цель — ясность, а не заучивание.</p>
   <div class="grid">${Object.entries(p).map(([k,v])=>`<div class="card pitch-part"><strong>${PITCH_LABELS[k]||k}</strong><p class="muted">${v}</p></div>`).join("")}</div>
  </div>
  <div class="card">
   <h3>Соберите собственный pitch</h3>
   <textarea id="pitchText" placeholder="Напишите или продиктуйте свой pitch..."></textarea>
   <button class="btn score-pitch" onclick="scorePitch()">Оценить pitch</button>
   <div id="pitchScore"></div>
   <div class="small muted pitch-checklist">Проверка: проблема → решение → рынок → traction → модель → конкуренция → команда → инвестиционный запрос.</div>
  </div>
 </div>`;
}
function scorePitch(){
 const t=($("#pitchText").value||"").toLowerCase();
 const signals=[
  ["проблем", "problem"],["решен", "solution"],["рын", "market"],["traction", "метрик", "рост"],["выруч", "revenue"],["модел", "business"],["клиент", "customer"],["конкур", "competition"],["команд", "team"],["инвест", "финанс", "fund"],["раунд", "просим", "ask"],["рост", "growth"]
 ];
 const present=signals.map(group=>group.some(k=>t.includes(k)));
 const hits=present.filter(Boolean).length, score=Math.min(100,Math.round(hits/signals.length*100));
 state.pitchScores.push(score);save();renderPitch();renderDashboard();
 const missing=["проблема","решение","рынок","traction/метрики","выручка","бизнес-модель","клиент","конкуренция","команда","использование капитала","инвестиционный запрос","рост"].filter((_,i)=>!present[i]);
 setTimeout(()=>{const el=$("#pitchScore"); if(el) el.innerHTML=`<div class="feedback"><div class="row"><div class="score-ring" style="--score:${score}"><span>${score}</span></div><div class="score-copy"><strong>Оценка pitch</strong><p class="muted">${score<60?"Сделайте структуру понятнее.":score<80?"Хорошая основа. Добавьте доказательства и более точные цифры.":"Структура сильная. Теперь тренируйте сложные вопросы инвестора."}</p></div></div><p class="small"><strong>Не хватает сигналов:</strong> ${missing.join(", ")||"основные элементы найдены"}.</p></div>`;},30);
}

const SIM = [
 {q:"Здравствуйте. Расскажите о компании за одну минуту.",good:["проблем","решен","клиент","customer"],tip:"Начните с проблемы клиента и вашего решения, а не со списка функций."},
 {q:"Кто ваш первый узкий целевой клиентский сегмент?",good:["клиент","сегмент","целев","customer","segment"],tip:"Назовите конкретный первый сегмент. Не отвечайте «все»."},
 {q:"Какой traction у вас уже есть?",good:["пользоват","выруч","retention","рост","клиент","скачив","user","revenue"],tip:"Используйте измеримые доказательства. Скачивания слабее, чем активные пользователи, retention и выручка."},
 {q:"Какой у вас CAC и как вы ожидаете, что он будет меняться?",good:["cac","привлеч","стоим","acquisition","cost"],tip:"Покажите стоимость привлечения и объясните, способен ли канал масштабироваться."},
 {q:"Сколько вы привлекаете и какие milestones профинансирует раунд?",good:["раунд","привлека","миллион","финанс","milestone","маркет","команд","продукт"],tip:"Свяжите капитал с конкретными milestones и runway."},
 {q:"Какой главный риск в вашем бизнесе?",good:["риск","конкур","retention","рын","исполн"],tip:"Назовите реальный риск и объясните, как вы его снижаете."},
 {q:"Почему я должен поверить, что именно вы сможете выиграть рынок?",good:["преимущ","команд","traction","отлич","уник","дистриб"],tip:"Дайте доказательства: инсайт, команда, traction, дистрибуция или устойчивое преимущество."}
];
function renderInvestor(){
 const msgs=state.messages.length?state.messages:[{who:"ai",text:SIM[0].q}];
 $("#view-investor").innerHTML=`
 <div class="grid grid-2">
  <div class="card"><div class="row between"><div><span class="tag">ПРАКТИКА</span><h2>Встреча с инвестором</h2></div><span class="muted small">${Math.min(state.simStep+1,SIM.length)}/${SIM.length}</span></div>
   <div class="sim-chat" id="simChat">${msgs.map(m=>`<div class="bubble ${m.who}">${escapeHtml(m.text)}</div>`).join("")}</div>
   <textarea id="simInput" class="sim-input" placeholder="Ответьте инвестору своими словами..."></textarea>
   <div class="row action-row"><button class="btn" onclick="sendSim()">Отправить ответ</button><button class="btn secondary" onclick="resetSim()">Начать заново</button></div>
  </div>
  <div class="card"><h3>Логика инвестора</h3><p class="muted">Тренер проверяет, отвечает ли ваш текст на вопрос, содержит ли конкретные доказательства и избегает ли типичных red flags.</p>
   <div id="simFeedback">${state.simStep?`<div class="feedback"><strong>Подсказка:</strong> ${SIM[Math.min(state.simStep-1,SIM.length-1)].tip}</div>`:`<div class="feedback">Начните с короткого и конкретного ответа. Следующий вопрос зависит от вашего прогресса.</div>`}</div>
   <h3>Типичные red flags</h3>
   <div>${["У нас нет конкурентов.","Наш клиент — каждый человек.","Нам нужен только маркетинг.","Скачивания доказывают product-market fit.","Мы не знаем наши ключевые цифры.","Наша valuation основана только на том, сколько сил мы вложили."].map(x=>`<span class="tag red-flag">🚩 ${x}</span>`).join("")}</div>
  </div>
 </div>`;
 const chat=$("#simChat"); if(chat) chat.scrollTop=chat.scrollHeight;
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));}
function sendSim(){
 const input=($("#simInput").value||"").trim(); if(!input)return;
 const step=Math.min(state.simStep,SIM.length-1), s=SIM[step], low=input.toLowerCase();
 const hits=s.good.filter(k=>low.includes(k)).length;
 const score=Math.min(100,Math.round(45+hits/s.good.length*55));
 state.messages.push({who:"you",text:input},{who:"ai",text:step+1<SIM.length?SIM[step+1].q:"Отлично. Вы завершили базовую симуляцию встречи. Повторите её ещё раз и постарайтесь отвечать точнее и жёстче по цифрам."});
 state.simStep=Math.min(state.simStep+1,SIM.length);save();renderInvestor();
 setTimeout(()=>{const f=$("#simFeedback");if(f)f.innerHTML=`<div class="feedback"><strong>Оценка ответа: ${score}/100</strong><p>${score>=80?"Сильный ответ.":"Сделайте ответ короче и подкрепите его фактами или цифрами."}</p><p class="small">${s.tip}</p></div>`;},20);
}
function resetSim(){state.simStep=0;state.messages=[];save();renderInvestor();}

function renderRoadmap(){
 $("#view-roadmap").innerHTML=`<div class="card"><div class="row between roadmap-head"><div><span class="tag">30 ДНЕЙ</span><h2>Путь к готовности к инвестору</h2><p class="muted">Последовательная программа: язык → метрики → pitch → переговоры → полная симуляция.</p></div><div class="score-ring" style="--score:${state.day/30*100}"><span>${state.day}</span></div></div></div>
 <div class="timeline roadmap-timeline">${COURSE.map((c,i)=>{const d=i<4?i*2+1:i<8?i+9:i<12?i*2+13:25;const done=state.day>d;return `<div class="card day ${done?'done':''}"><div class="day-num">${done?'✓':'Д'+d}</div><div><h3>${c[0]}</h3><p>${c[1]}</p><div class="roadmap-tag"><span class="tag">${i<4?'Основа':i<8?'Ключевые навыки':i<12?'Продвинутый уровень':'Симуляция'}</span></div></div></div>`;}).join("")}</div>
 <div class="card roadmap-rule"><h3>Правило адаптации</h3><p class="muted">Каждый неверный ответ становится кандидатом на повторение. Термины, в которых вы ошибаетесь чаще, поднимаются в приоритете следующих тренировок.</p><button class="btn" onclick="advanceDay()">Завершить сегодняшний день</button></div>`;
}
function advanceDay(){if(state.day<30){state.day++;state.streak++;save();renderAll();toast("День завершён. Новая тренировка открыта.");}else toast("30-дневный курс завершён!");}

const views={dashboard:"Главная",learn:"Изучение",train:"Тренировка",speak:"Говори",pitch:"Pitch",investor:"Симуляция инвестора",roadmap:"Курс на 30 дней"};
function go(v){
 document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
 $("#view-"+v).classList.add("active");
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
 $("#pageTitle").textContent=views[v];renderView(v);window.scrollTo({top:0,behavior:"smooth"});
 if(innerWidth<721)$("#nav").parentElement.classList.remove("open");
}
function renderView(v){({dashboard:renderDashboard,learn:renderLearn,train:renderTrain,speak:renderSpeak,pitch:renderPitch,investor:renderInvestor,roadmap:renderRoadmap})[v]();}
function renderAll(){renderDashboard();renderLearn();renderTrain();renderSpeak();renderPitch();renderInvestor();renderRoadmap();$("#streak").textContent=state.streak;$("#dayLabel").textContent=`День ${state.day} из 30`;$("#sideProgress").style.width=(state.day/30*100)+"%";}

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
$("#mobileMenu").addEventListener("click",()=>$("#nav").parentElement.classList.toggle("open"));
document.addEventListener("click",e=>{if(innerWidth<721&&!e.target.closest(".sidebar")&&!e.target.closest("#mobileMenu"))$(".sidebar").classList.remove("open");});
renderAll();

// PWA: установка, состояние standalone и обновление Service Worker.
let deferredInstallPrompt=null;
const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function setInstallState(){
 const button=$("#installApp"); const text=$("#installState");
 if(!button||!text)return;
 if(isStandalone()){
  button.hidden=true; text.hidden=false; text.textContent="Приложение установлено"; return;
 }
 text.hidden=true; button.hidden=false;
 button.textContent="Установить приложение";
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;setInstallState();});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;setInstallState();toast("Приложение установлено.");});
async function installApp(){
 if(isStandalone()){setInstallState();return;}
 if(deferredInstallPrompt){
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;setInstallState();return;
 }
 openInstallHelp();
}
function openInstallHelp(){
 const modal=$("#installModal");
 const body=$("#installHelpText");
 if(isIOS()) body.innerHTML='<strong>iPhone / iPad:</strong><br>1. Откройте сайт в Safari.<br>2. Нажмите <strong>«Поделиться»</strong>.<br>3. Выберите <strong>«На экран „Домой“»</strong>.<br>4. Подтвердите добавление.';
 else body.innerHTML='<strong>Android:</strong><br>Откройте меню браузера и выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>. В Chrome автоматическое окно установки появляется после выполнения критериев PWA.';
 modal.hidden=false;document.body.classList.add("modal-open");
}
function closeInstallHelp(){$("#installModal").hidden=true;document.body.classList.remove("modal-open");}
$("#installApp").addEventListener("click",installApp);
$("#installClose").addEventListener("click",closeInstallHelp);
$("#installModal").addEventListener("click",e=>{if(e.target.id==="installModal")closeInstallHelp();});
setInstallState();

if("serviceWorker" in navigator){
 window.addEventListener("load",async()=>{
  try{
   const registration=await navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"});
   await registration.update();
   let refreshing=false;
   navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(refreshing)return; refreshing=true; window.location.reload();
   });
   registration.addEventListener("updatefound",()=>{
    const worker=registration.installing;
    if(!worker)return;
    worker.addEventListener("statechange",()=>{
     if(worker.state==="installed"&&navigator.serviceWorker.controller){
      worker.postMessage({type:"SKIP_WAITING"});
     }
    });
   });
  }catch(err){console.error("Service Worker не зарегистрирован:",err);}
 });
}
