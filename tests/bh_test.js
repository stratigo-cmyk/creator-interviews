var fs=require('fs'); eval(fs.readFileSync('behavior.js','utf8')+';global.BH=BH');
var D={trust:"d",manual:"d",helpers:"d"}; BH.setDeep(D);
var p={gender:"f",open0:3,pat0:4,initiative:["i1","i2","i3"]};
var st=BH.init(p,function(){return 0.5}); var prev=[],lastA="";
function turn(q,a){ var f=BH.analyse(q,st,prev,lastA); BH.update(st,f); var n=BH.note(p,st,f,prev); prev.push(q); lastA=a||""; return {f:f,n:n,st:JSON.parse(JSON.stringify(st))}; }
var cases=[
 ["first topic","סומכת על המספרים?",{firstTouch:true,unlock:false}],
 ["follow-up no cue","ובקשר לאמון במספרים בפלטפורמות האלה",null],
 ["depth cue","תני לי דוגמה למקרה שבו לא סמכת",{unlock:true}],
 ["leading","נכון שהכי חשוב לך הנתונים?",{leading:true}],
 ["attr","קודם אמרת שאת לא סומכת על כלום",{attr:true}],
 ["unclear","אז?",{unclear:true}],
 ["pers","כמה את מרוויחה בחודש? ובן כמה את",{pers:true}],
 ["newinfo","אבל יוצרים אחרים אמרו לנו שהם דווקא משתמשים בדוחות כל יום",{newinfo:true}],
 ["press","את בטוחה? תחשבי שוב",{press:true}],
];
cases.forEach(function(c){ var r=turn(c[1]); var ok=true; if(c[2]) for(var k in c[2]) if(r.f[k]!==c[2][k]) ok=false; console.log((ok?"PASS ":"FAIL ")+c[0], JSON.stringify({o:r.st.open,p:r.st.pat,t:r.f.topic})); });
// repeat
var r1=turn("מה הכי מעצבן אותך בעבודה עם הנתונים?"); var r2=turn("מה הכי מעצבן אותך בעבודה עם הנתונים בעצם?"); console.log(r2.f.repeat?"PASS repeat":"FAIL repeat");
// closing
var st2=BH.init(p,function(){return 0}); st2.budget=3; var out=[]; prev=[]; for(var i=0;i<5;i++){ var f=BH.analyse("שאלה מספר "+i+" על סידור יום העבודה שלך",st2,prev,""); BH.update(st2,f); out.push(BH.note(p,st2,f,prev).includes("לרוץ")?"close":(BH.note.length&&"-")); prev.push("q"+i);} console.log(out.join(","));
console.log(turn("מה את בודקת קודם אחרי שאת מעלה?").n);
