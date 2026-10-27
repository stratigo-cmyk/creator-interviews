var fs=require('fs'); eval(fs.readFileSync('behavior.js','utf8')+';global.BH=BH');
var pass=0, fail=0; function ok(n,c){ if(c){pass++;console.log("PASS "+n);} else {fail++;console.log("FAIL "+n);} }
BH.setDeep({trust:"d",manual:"d"});
var kobi={gender:"m",open0:3,pat0:4,initiative:["i"],clarify_style:"קצר",not_knows:["engagement","reach","אלגוריתם"]};
var dana={gender:"f",open0:2,pat0:4,initiative:["i"],clarify_style:"שתי אפשרויות",not_knows:[]};
var einat={gender:"f",kind:"manager",open0:3,pat0:3,initiative:["i"],clarify_style:"לקוח",not_knows:[]};
function run(p, qs, warm){
  var st=BH.init(p,function(){return 0.5}); var prev=[], lastA="", out=[];
  (warm||[]).forEach(function(q){ var f=BH.analyse(q,st,prev,lastA,p); BH.update(st,f); BH.note(p,st,f,prev); prev.push(q); lastA="ענינו"; });
  qs.forEach(function(q){ var f=BH.analyse(q,st,prev,lastA,p); BH.update(st,f); var n=BH.note(p,st,f,prev); out.push({f:f,n:n,st:JSON.parse(JSON.stringify(st))}); prev.push(q); lastA=out.length? "תשובה":""; });
  return out;
}
var W=["איך נראה יום עבודה שלך?"];
var r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?"],W);
ok("K1 content -> clarify", r[0].f.clar && r[0].f.clar.type==="content" && r[0].f.clar.mode==="clarify");
ok("K1 note asks one question", r[0].n.indexOf("עד 10 מילים")>=0 && r[0].n.indexOf("בלי להציע אפשרויות")>=0);
r=run(kobi,["כמה רילס אתה מעלה בשבוע?"],W);
ok("format named -> no clarification", !r[0].f.clar);
r=run(kobi,["מה הכי עובד לך?"],W);
ok("K2 metric -> clarify", r[0].f.clar && r[0].f.clar.type==="metric");
r=run(kobi,["מה הכי עובד לך מבחינת שמירות?"],W);
ok("metric named -> no clarification", !r[0].f.clar);
r=run(kobi,["איך אתה מודד engagement?"],W);
ok("K3 jargon for Kobi", r[0].f.clar && r[0].f.clar.type==="jargon" && r[0].n.indexOf("engagement")>=0);
r=run(dana,["איך את מודדת engagement?"],W);
ok("no jargon check for Dana", !(r[0].f.clar && r[0].f.clar.type==="jargon"));
r=run(dana,["כמה את מרוויחה מקמפיין?"],W);
ok("D1 money scope -> clarify", r[0].f.clar && r[0].f.clar.type==="scope" && r[0].f.clar.mode==="clarify");
r=run(dana,["למה הפסקת לעבוד עם מותגים גדולים?"],W);
ok("assumption -> challenge", r[0].f.clar && r[0].f.clar.mode==="challenge");
r=run(einat,["כמה פעמים ביום את מעלה תכנים?"],W);
ok("N1 manager -> clarification", !!r[0].f.clar);
r=run(einat,["כמה פעמים ביום את מעלה תכנים לכל לקוח בממוצע?"],W);
ok("manager with client named -> no account clarify", !(r[0].f.clar && r[0].f.clar.type==="account"));
r=run(kobi,["ספר לי איך התחלת ליצור תוכן"],W);
ok("broad opening -> no clarification", !r[0].f.clar);
// context resolves
r=run(kobi,["אמרת שרילס עובדים טוב. כמה פעמים ביום אתה מעלה תכנים?"],W);
ok("context in question resolves", !r[0].f.clar);
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?"],["איך נראה יום עבודה שלך?","ומה עם הסטוריז שלך?"]);
ok("context from earlier turn resolves", !r[0].f.clar);
// first real question: clarify downgraded to partial
r=run(dana,["כמה את מרוויחה מקמפיין?"]);
ok("turn 1 clarify -> partial", r[0].f.clar && r[0].f.clar.mode==="clarify");
// clarification answered -> trust up, original answered
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?","רק רילס"],W);
ok("clarification answered", r[1].f.clarAns && r[1].st.trust>r[0].st.trust && r[1].n.indexOf("השאלה המקורית")>=0);
// ignored -> patience down
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?","תספר לי בבקשה על כל שיתופי הפעולה שעשית עם מותגים גדולים בשנים האחרונות ואיך בחרת אותם"],W);
ok("clarification ignored", r[1].f.clarIgnored && r[1].st.pat<r[0].st.pat);
// no two in a row: second ambiguous question softened
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?","רק רילס","מה הכי עובד לך?"],W);
ok("new vague question two turns later gets its own short question", r[2].f.clar && r[2].f.clar.type==="metric");
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?","תספר לי בבקשה על כל שיתופי הפעולה שעשית עם מותגים גדולים בשנים האחרונות","מה הכי עובד לך?"],W);
ok("ignored clarification then vague: soft", !!r[2].f.clar || r[2].f.soft==="metric");
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?","הכל"],W);
ok("thin reply -> one more short clarification", r[1].f.clarAns && r[1].f.clar && r[1].f.clar.type==="thin");
r=run(kobi,["כמה פעמים ביום אתה מעלה תכנים?","הכל","כן"],W);
ok("chain stops after two", !r[2].f.clar);
// clarification turn has no initiative or closing appended
ok("clarify turn has no initiative", r[0].n.indexOf("אחרי שענית, הוסף")<0);
console.log(pass+" passed, "+fail+" failed");
