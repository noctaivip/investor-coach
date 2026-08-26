
const fs=require("fs"),vm=require("vm");
vm.runInThisContext(fs.readFileSync("data.js","utf8"));
const badTerms=TERMS.filter(t=>!t.id||!t.word||!t.simple);
const ids=TERMS.map(t=>t.id);
const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
const badQuiz=QUIZ.filter(q=>!q.q||!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.a)||q.a<0||q.a>=q.options.length||!TERMS.some(t=>t.id===q.termId));
if(badTerms.length||dup.length||badQuiz.length)process.exit(1);
console.log(`OK: ${TERMS.length} terms, ${QUIZ.length} quiz questions`);
