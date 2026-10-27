var fs=require('fs'); eval(fs.readFileSync('behavior.js','utf8')+';global.BH=BH');
var pass=0, fail=0; function ok(name,c){ if(c){pass++; console.log("PASS "+name);} else {fail++; console.log("FAIL "+name);} }
var D={trust:"d",manual:"d",helpers:"d"}; BH.setDeep(D);
var p={gender:"f",open0:3,pat0:4,initiative:["i1","i2","i3"]};
function run(qs, rnd){
  var st=BH.init(p, rnd||function(){return 0.5}); var prev=[], lastA="", out=[];
  qs.forEach(function(q){ var f=BH.analyse(q,st,prev,lastA); BH.update(st,f); out.push({f:f,n:BH.note(p,st,f,prev),st:JSON.parse(JSON.stringify(st))}); prev.push(q); lastA="ענינו על זה"; });
  return out;
}
// trust starts at 2, rises on a respected boundary
var r=run(["סומכת על המספרים?","אין צורך לענות על זה, נדלג"]);
ok("boundary raises trust", r[1].st.trust>r[0].st.trust);
ok("boundary lowers defensiveness", r[1].st.def===0);
// trust falls and defensiveness rises after leading question
r=run(["נכון שהכי חשוב לך הנתונים?"]);
ok("leading lowers trust", r[0].st.trust===1);
ok("leading raises defensiveness", r[0].st.def===1);
// defensiveness ladder climbs and is visible in the note
r=run(["נכון שהכי חשוב לך הנתונים?","את בטוחה? תחשבי שוב","קודם אמרת שאת לא סומכת על כלום"]);
ok("ladder reaches 3", r[2].st.def===3);
ok("level 3 note present", r[2].n.indexOf("סגורה לנושא")>=0);
// recovery: boundary after closing lowers level by one
r=run(["נכון שהכי חשוב לך הנתונים?","את בטוחה? תחשבי שוב","אין צורך לענות על זה, נדלג"]);
ok("recovery lowers level", r[2].st.def===1);
// sensitive question: withheld when trust is low, allowed when trust is high
r=run(["כמה כסף את מרוויחה מכל מותג?"]);
ok("sensitive withheld at low trust", r[0].n.indexOf("אל תחשוף את הפרט הרגיש")>=0);
r=run(["סומכת על המספרים?","תני לי דוגמה למקרה שבו לא סמכת","מה הכי קשה בעבודה עם הנתונים?","איך את רואה את זה לאורך זמן?","כמה כסף את מרוויחה מכל מותג?"]);
ok("sensitive allowed at high trust", r[4].st.trust>=4 && r[4].n.indexOf("האמון מספיק")>=0);
// evaluative question: polished first at low trust
r=run(["אתה טוב בזה, נכון?"]);
ok("evaluative polished first", r[0].n.indexOf("גרסה המצגתית")>=0);
// multi-part question
r=run(["מה את בודקת קודם? ומה הכי מעצבן אותך?"]);
ok("multi-part flagged", r[0].n.indexOf("כמה שאלות")>=0);
// misread only once, at the chosen turn
var st=BH.init(p, function(){return 0}); var prev=[], lastA="", hits=0;
for(var i=0;i<10;i++){ var q="איך הדשבורד שלך עובד על הצוות "+i; var f=BH.analyse(q,st,prev,lastA); BH.update(st,f); var n=BH.note(p,st,f,prev); if(n.indexOf("מתפרשת")>=0) hits++; prev.push(q); }
ok("misread fires exactly once", hits===1);
// closing question: afterthought only when trust high and not used yet
r=run(["סומכת על המספרים?","תני לי דוגמה למקרה שבו לא סמכת","מה הכי קשה בעבודה עם הנתונים?","איך את רואה את זה לאורך זמן?","יש עוד משהו שלא שאלתי?"]);
ok("afterthought at high trust", r[4].n.indexOf("נקודה אחת אמיתית")>=0);
r=run(["יש עוד משהו שלא שאלתי?"]);
ok("closing at low trust", r[0].n.indexOf("בלי נקודה חדשה")>=0);
// old saved sessions without new fields still work
var old={turns:1,open:3,pat:4,mood:0,budget:14,touched:{},unlocked:{},lastTopic:"",closed:false,initUsed:0,mindOffers:0,lastFlags:[]};
var f=BH.analyse("מה את בודקת?",old,[],""); BH.update(old,f); ok("old session survives", typeof old.trust==="number" && BH.note(p,old,f,[]).length>0);
console.log(pass+" passed, "+fail+" failed");
