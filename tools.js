/* ---------- avatars ---------- */
function avatar(p, size){
  var cls = "avatar" + (size ? " "+size : "");
  if(p.photo) return el("img",{class:cls+" photo", src:p.photo, alt:"", "aria-hidden":"true", width:"96", height:"96", decoding:"async"});
  return el("span",{class:cls,"aria-hidden":"true",text:p.initials});
}

/* ---------- question coach: qualitative interview best practices ---------- */
var DOMAIN = /(תוכן|פלטפורמ|סרטון|סרטונים|רילס|ריל|פוסט|סטורי|לייב|קהל|עוקב|נתונ|מספר|מדד|צפי|שמיר|שיתו|תגוב|הודע|לייק|עבוד|יום|שבוע|בוקר|מותג|שיתוף פעולה|קמפיין|דשבורד|מערכת|כלי|אפליקצ|אינסטגרם|טיקטוק|יוטיוב|פייסבוק|instagram|tiktok|youtube|facebook|reach|views|saves|engagement|retention|טרנד|צמיח|הכנס|כסף|מכיר|לינק|קוד|החלט|מתסכל|קשה|זמן|מצלמ|עריכ|מעל|פרסמ|תכנ|רעיון|הצליח|הצלחה|קהילה|צוות|התראה|מסך|בודק|בודקת|מסתכל|רוצה|צריך|צריכה|מרגיש|מרגישה)/i;
var CHECKS = [
  {id:"double", test:function(q){ return (q.match(/\?/g)||[]).length>=2 || /\?\s*\S+.*\s(ו|או)(למה|איך|מה|מתי|כמה|איפה)\s/.test(q) || /\s(ו|או)(למה|איך|מתי|כמה|איפה)\s/.test(q); },
   label:"שתי שאלות באחת",
   why:"כשיש שתי שאלות באותה הודעה, המרואיין עונה בדרך כלל רק על אחת, ולא ברור לאיזו.",
   fix:"פצלו לשתי שאלות ושאלו אחת בכל פעם."},
  {id:"leading", test:function(q){ return /(נכון ש|לא נכון ש|בטח ש|ברור ש|כמה זה מתסכל|זה לא מתסכל|לא היה עדיף|לא היה יותר|מסכימ|את(ה)? לא חושב|לא הייתם|אין ספק ש|כולם יודעים)/.test(q); },
   label:"שאלה מנחה",
   why:"הניסוח רומז מה התשובה הנכונה, והמרואיין נוטה להסכים. כך מקבלים אישור לדעה שלכם במקום מידע חדש.",
   fix:"נסחו בלי עמדה. למשל: 'איך את.ה מרגיש.ה כש...' במקום 'נכון שמתסכל ש...'."},
  {id:"feature", test:function(q){ return /(פיצ'ר|פיצר|פיצ׳ר|כפתור|ווידג'ט|וידג'ט|widget)/i.test(q) || /^(ה?אם )?(ה)?היית(ם)? (רוצה|משתמש|משתמשת|משלם|משלמת|קונה|מוכן|מוכנה)/.test(q) || /האם היית(ם)? /.test(q); },
   label:"בדיקת רעיון מוקדמת מדי",
   why:"אנשים מתקשים לחזות מה יעשו בעתיד ונוטים להגיד 'כן' לרעיונות. בשלב המחקר מחפשים מה קרה בפועל, לא אישור לפתרון.",
   fix:"שאלו על עבר: 'מה עשית בפעם האחרונה ש...' או 'ספר.י לי על מקרה שבו...'."},
  {id:"closed", test:function(q){ return /^(האם|האין|האת|האתה|יש לך|יש לכם|קורה ש|אתה מסכים|את מסכימה|זה נכון|נכון)/.test(q) || /(כן או לא)/.test(q); },
   label:"שאלה סגורה (כן/לא)",
   why:"תשובה של כן או לא לא מספרת איך ולמה. במחקר איכותני מחפשים סיפורים, דוגמאות והתנהגויות.",
   fix:"פתחו ב'איך', 'מה', 'למה' או 'ספר.י לי על...'."},
  {id:"look", test:function(q){ return /(איך (זה |הוא |היא )?(צריך|צריכה|אמור|אמורה) להיראות|איזה צבע|איזה צבעים|איזה עיצוב|איזה פונט|איפה (לשים|למקם)|באיזה גודל|איזה גרף|איזה תרשים|layout|לייאאוט|עיצוב של המסך)/i.test(q); },
   label:"שאלה על עיצוב ולא על צורך",
   why:"המרואיין הוא לא המעצב. שאלות על צבע או מיקום נותנות העדפות אקראיות. עדיף להבין מה צריך לקרות ולמה, ואת האיך תחליטו אתם.",
   fix:"'מה חשוב לך להבין בשנייה שאת.ה פותח.ת את הנתונים?'"},
  {id:"dash", test:function(q){ return /(דשבורד|דאשבורד|לוח בקרה|dashboard)/i.test(q); },
   label:"המילה 'דשבורד'",
   why:"זו המילה שלכם, לא של היוצר.ת. יוצרים לא חושבים על 'דשבורד' אלא על האפליקציות שהם כבר פותחים. שאלה על מוצר שעוד לא קיים מקבלת ניחוש.",
   fix:"'בפעם האחרונה שפתחת את הנתונים של החשבון, מה חיפשת ולא מצאת?' או 'אם מישהו היה עובר בשבילך על המספרים, מה היית רוצה שיגיד לך?'"},
  {id:"jargon", test:function(q){ return /\b(KPI|UX|UI|CTA|IA|MVP|widget|wireframe|user flow|dashboard hierarchy|progressive disclosure|data viz)\b/i.test(q) || /(פרסונה|היררכי|ארכיטקטורת מידע|וויירפריים|יוזר פלו|פרוגרסיב)/.test(q); },
   label:"מונח מקצועי",
   why:"יוצרי תוכן לא חושבים במונחים של מעצבים. מונח לא מוכר מבלבל או מכתיב תשובה בשפה שלכם.",
   fix:"תארו במילים של היוצר.ת: 'מה את.ה רואה ראשון' במקום 'היררכיה'."},
  {id:"general", test:function(q){ return /(בדרך כלל|באופן כללי|תמיד|אף פעם|בגדול איך)/.test(q); },
   label:"שאלה כללית",
   why:"על 'בדרך כלל' אנשים עונים לפי מה שהם חושבים שהם עושים. דוגמה אחת ספציפית חושפת את מה שהם עושים באמת.",
   fix:"'בפעם האחרונה ש... מה עשית?'"},
  {id:"short", test:function(q){ return q.split(/\s+/).filter(Boolean).length < 4; },
   label:"קצרה מדי",
   why:"שאלה בלי הקשר מקבלת תשובה כללית.",
   fix:"הוסיפו הקשר: מתי, באיזו פלטפורמה, באיזה מצב."},
  {id:"scope", test:function(q){ return q.split(/\s+/).filter(Boolean).length >= 4 && !DOMAIN.test(q); },
   label:"אולי לא קשורה למחקר",
   why:"לא ברור איך התשובה תעזור לתכנן את הדשבורד. שאלות אישיות כלליות מעניינות, אבל לא מלמדות על צרכים בעבודה.",
   fix:"חברו לעבודה עם תוכן: הרגלים, החלטות, כלים, קשיים."}
];
function critique(q){
  q = (q||"").trim();
  if(q.length < 6) return [];
  var out = [];
  for(var i=0;i<CHECKS.length && out.length<2;i++){
    var c = CHECKS[i];
    if(c.id==="short" && out.length) continue;
    if(c.id==="scope" && out.length) continue;
    try{ if(c.test(q)) out.push(c); }catch(e){}
  }
  return out;
}
var coachSeq = 0;
function coachView(issues){
  if(!issues.length) return null;
  var id = "coach-"+(++coachSeq);
  var more = el("div",{class:"coach-more",id:id,hidden:"hidden"}, issues.map(function(c){
    return el("p",null,[el("strong",{text:c.label+". "}), c.why+" ", el("span",{class:"coach-fix",text:"נסו: "+c.fix})]);
  }));
  var btn = el("button",{type:"button",class:"coach-q","aria-expanded":"false","aria-controls":id,onclick:function(){
    var open = more.hidden; more.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.textContent = open ? "סגירה" : "למה?";
  }},["למה?"]);
  return el("div",{class:"coach",role:"note"},[
    el("p",{class:"coach-line"},[el("span",{class:"coach-tag",text:"טיפ מחקרי"}), issues.map(function(c){return c.label;}).join(" · "), " ", btn]),
    more
  ]);
}

/* ---------- my questionnaire (shared across creators, this browser only) ---------- */
function getQuestionnaire(){ try{ return localStorage.getItem("si:questionnaire")||""; }catch(e){ return ""; } }
function setQuestionnaire(v){ try{ localStorage.setItem("si:questionnaire", v); }catch(e){} }
function questionList(){ return getQuestionnaire().split(/\n+/).map(function(x){ return x.replace(/^\s*(\d+[.)]|[-*•])\s*/,"").trim(); }).filter(Boolean); }

/* ---------- compare creators ---------- */
var CMP_KEY = "si:compare:v1";
function loadCompare(){ try{ var o=JSON.parse(localStorage.getItem(CMP_KEY)||sessionStorage.getItem(CMP_KEY)||"null"); if(o && o.rows) return o; }catch(e){} return {ids:[], rows:[]}; }
function saveCompare(o){ try{ localStorage.setItem(CMP_KEY, JSON.stringify(o)); }catch(e){} }
function compareTranscript(run, student){
  return {
    title: "השוואת תשובות בין יוצרים",
    meta: "מראיין.ת: "+student+"  |  "+heDate(),
    note: "תשובות סינתטיות מבוססות AI, שנבנו מפרופילים מחקריים. כל שאלה נשאלה כל יוצר.ת בנפרד, בלי קשר לשיחות אחרות. התשובות אינן ציטוטים אמיתיים.",
    sections: run.rows.map(function(r, i){
      return {h:"שאלה "+(i+1)+": "+r.q, items: run.ids.filter(function(id){ return r.a[id]; }).map(function(id){ return {who:byId[id].name, a:r.a[id]}; })};
    })
  };
}
var cmpBusy = false, cmpCtl = null;
function renderCompare(){
  current = null;
  document.documentElement.style.removeProperty("--acc-l");
  document.documentElement.style.removeProperty("--acc-d");
  document.title = "השוואה בין יוצרים";
  var run = loadCompare();
  var picked = run.ids.length ? run.ids.slice() : [];

  var header = el("header",{class:"ihead"},[el("div",{class:"wrap"},[
    el("button",{class:"btn-ghost back",type:"button",onclick:function(){ if(cmpCtl) cmpCtl.abort(); go("select"); }},["→ ",el("span",{text:"חזרה"})]),
    el("div",{class:"who"},[el("div",null,[el("h1",{text:"השוואה בין יוצרים"}),el("p",{text:"רשות · אותה שאלה, כמה יוצרים"})])])
  ])]);
  var main = el("main",{class:"interview wrap cmp"});
  main.appendChild(el("div",{class:"optional-note"},[
    el("p",null,[el("strong",{text:"לא חובה. "}),"שואלים את אותה שאלה כמה יוצרים, כל אחד בנפרד, ורואים את התשובות זו ליד זו. זה עוזר להבחין בין צורך משותף לכל היוצרים לבין צורך אישי של יוצר.ת אחד.ת, לפני שבוחרים כיוון לדשבורד."]),
    el("p",{class:"muted",text:"כל שאלה לכל יוצר.ת היא תשובה נפרדת מ-Claude בחשבון שלכם. 3 יוצרים ו-4 שאלות הם 12 תשובות, וזה לוקח כמה דקות."})
  ]));

  // creators
  var creatorsBox = el("fieldset",{class:"cmp-set"},[el("legend",{text:"1. בחרו לפחות 2"})]);
  var mgr = PERSONAS.filter(function(p){ return p.kind==="manager"; })[0];
  if(mgr && byId["lauren_liv_tsror"]){
    creatorsBox.appendChild(el("button",{type:"button",class:"ex-btn cmp-preset",onclick:function(){
      PERSONAS.forEach(function(p){ var c=document.getElementById("cmp-"+p.id); if(c) c.checked = (p.id==="lauren_liv_tsror" || p.id===mgr.id); });
      updateCount();
    }},["צמד מוכן: יוצרת שעובדת לבד מול מנהלת ערוצים (לורן ועינת)"]));
  }
  PERSONAS.forEach(function(p){
    var cb = el("input",{type:"checkbox",id:"cmp-"+p.id,value:p.id});
    cb.checked = picked.indexOf(p.id)>=0;
    cb.addEventListener("change", updateCount);
    var lab = el("label",{for:"cmp-"+p.id,class:"cmp-creator"},[cb, avatar(p,"xs"), p.name]);
    creatorsBox.appendChild(lab);
  });

  // questions
  var qs = questionList();
  var qBox = el("fieldset",{class:"cmp-set"},[el("legend",{text:"2. בחרו שאלות"})]);
  if(qs.length){
    qBox.appendChild(el("p",{class:"muted",text:"מהשאלון שלכם:"}));
    qs.forEach(function(q,i){
      var cb = el("input",{type:"checkbox",id:"cmpq-"+i,value:q});
      cb.addEventListener("change", updateCount);
      qBox.appendChild(el("label",{for:"cmpq-"+i,class:"cmp-q"},[cb, el("span",{text:q})]));
    });
  } else {
    qBox.appendChild(el("p",{class:"muted",text:"אין עדיין שאלון שמור. אפשר לכתוב אותו בתוך ריאיון, תחת 'השאלון שלי', או לכתוב שאלה כאן:"}));
  }
  var extra = el("textarea",{id:"cmp-extra",rows:"2",placeholder:"שאלה נוספת (אפשר כמה, שאלה בכל שורה)"});
  var extraCoach = el("div");
  extra.addEventListener("input", function(){ var first = extra.value.split(/\n/).filter(Boolean).pop()||""; extraCoach.replaceChildren(coachView(critique(first))||""); updateCount(); });
  qBox.append(el("label",{for:"cmp-extra",class:"sr",text:"שאלה נוספת"}), extra, extraCoach);

  var countLine = el("p",{class:"muted",role:"status"});
  var runBtn = el("button",{class:"send",type:"button",onclick:function(){ if(cmpBusy){ if(cmpCtl) cmpCtl.abort(); return; } start(); }},["להשוואה"]);
  var errBox = el("div",{"aria-live":"assertive"});
  main.append(creatorsBox, qBox, el("div",{class:"cmp-run"},[runBtn, countLine]), errBox);

  var results = el("section",{class:"cmp-results","aria-live":"polite"});
  main.appendChild(results);

  // export
  var exStatus = el("p",{class:"ex-status",role:"status","aria-live":"polite",id:"ex-status-cmp"});
  var nameIn = el("input",{id:"student-name",type:"text",autocomplete:"name",placeholder:"השם שלכם",maxlength:"60","aria-describedby":"ex-status-cmp"});
  nameIn.value = getStudentName();
  nameIn.addEventListener("input", function(){ setStudentName(nameIn.value); nameIn.removeAttribute("aria-invalid"); });
  function exBtn(label, kind){ return el("button",{class:"ex-btn",type:"button",onclick:function(){ var cur=loadCompare(); if(!cur.rows.length){ exStatus.textContent="עוד אין תשובות לשמור."; return; } runExport(kind, exStatus, this, nameIn, function(st){ return compareTranscript(cur, st); }, "השוואה"); }},[label]); }
  var exportRow = el("div",{class:"export"},[
    el("span",{class:"ex-label",text:"שמירת ההשוואה:"}),
    el("label",{class:"sr",for:"student-name",text:"שם הסטודנט.ית"}), nameIn,
    el("div",{class:"ex-btns"},[exBtn("Markdown","md"), exBtn("Word","docx"), exBtn("PDF","pdf")]),
    exStatus
  ]);
  main.appendChild(exportRow);
  app.replaceChildren(header, main);
  window.scrollTo(0,0);
  updateCount(); drawResults(run);

  function chosenIds(){ return PERSONAS.map(function(p){return p.id;}).filter(function(id){ var c=document.getElementById("cmp-"+id); return c && c.checked; }); }
  function chosenQs(){
    var out = [];
    qBox.querySelectorAll('input[type=checkbox]').forEach(function(c){ if(c.checked) out.push(c.value); });
    extra.value.split(/\n+/).map(function(x){return x.trim();}).filter(Boolean).forEach(function(x){ out.push(x); });
    return out;
  }
  function updateCount(){
    var n = chosenIds().length, m = chosenQs().length;
    countLine.textContent = (n<2 ? "בחרו לפחות 2 יוצרים. " : n>5 ? "" : "") + (m ? m+" שאלות × "+n+" יוצרים = "+(m*n)+" תשובות." : "בחרו לפחות שאלה אחת.");
    runBtn.disabled = !cmpBusy && (n<2 || !m);
  }
  function drawResults(r){
    results.replaceChildren();
    if(!r.rows.length) return;
    results.appendChild(el("h2",{class:"cmp-h",text:"התשובות"}));
    r.rows.forEach(function(row, i){
      var grid = el("div",{class:"cmp-grid",style:"--n:"+r.ids.length}, r.ids.map(function(id){
        var p = byId[id], a = row.a[id], err = row.err && row.err[id];
        var body = a ? el("p",{class:"text",text:a}) : err ? el("p",{class:"err",text:err}) : el("p",{class:"text thinking",text:p.short+" "+g(p,"חושב","חושבת")});
        var card = el("article",{class:"cmp-card acc"},[speaker(p), body]);
        card.style.setProperty("--acc-l",p.accentL); card.style.setProperty("--acc-d",p.accentD);
        return card;
      }));
      results.appendChild(el("div",{class:"cmp-row"},[el("p",{class:"qlabel",text:"שאלה "+(i+1)}), el("p",{class:"q text",text:row.q}), grid]));
    });
  }
  function start(){
    var ids = chosenIds(), qs2 = chosenQs();
    if(ids.length<2 || !qs2.length) return;
    errBox.replaceChildren();
    var r = {ids:ids, rows:qs2.map(function(q){ return {q:q, a:{}, err:{}}; })};
    saveCompare(r); drawResults(r);
    cmpBusy = true; runBtn.textContent = "עצירה"; runBtn.classList.add("stop"); runBtn.disabled=false;
    cmpCtl = new AbortController(); var myCtl = cmpCtl;
    var jobs = [];
    r.rows.forEach(function(row){ ids.forEach(function(id){ jobs.push({row:row, id:id}); }); });
    var stopped = false, fatal = null;
    getSample().then(function(sample){
      if(!sample) throw {code:"unavailable"};
      var idx = 0;
      function worker(){
        if(stopped || fatal || idx>=jobs.length) return Promise.resolve();
        var j = jobs[idx++], p = byId[j.id];
        return sample(buildInput(p, [{role:"user", content:j.row.q}]), {cache:false, signal:myCtl.signal}).then(function(res){
          j.row.a[j.id] = tidy(res.text);
        }).catch(function(e){
          var code = e && e.code;
          if(code==="cancelled"){ stopped = true; return; }
          if(code==="not_granted" || code==="unavailable" || code==="sampling_disabled" || code==="rate_limited" || code==="session_expired"){ fatal = code; return; }
          j.row.err[j.id] = "לא התקבלה תשובה.";
        }).then(function(){ saveCompare(r); drawResults(r); return worker(); });
      }
      return Promise.all([worker(), worker()]);
    }).catch(function(e){ fatal = (e && e.code) || "error"; }).then(function(){
      cmpBusy = false; cmpCtl = null; runBtn.textContent = "להשוואה"; runBtn.classList.remove("stop"); updateCount();
      if(fatal) errBox.replaceChildren(el("p",{class:"err",role:"alert",text: sampleErrorText(fatal)}));
      else if(stopped) errBox.replaceChildren(el("p",{class:"note",text:"ההשוואה נעצרה. התשובות שהתקבלו נשמרו."}));
    });
  }
}
function sampleErrorText(code){
  if(code==="unavailable" || code==="sampling_disabled") return "השאלות עובדות רק כשהאתר פתוח דרך Claude עם חשבון מחובר.";
  if(code==="not_granted") return "כדי לשאול צריך לאשר לאתר להשתמש ב-Claude. טענו את הדף מחדש ואשרו.";
  if(code==="rate_limited") return "הגעתם כרגע למגבלת השימוש בחשבון Claude שלכם. נסו שוב בעוד כמה דקות.";
  if(code==="session_expired") return "החיבור לחשבון פג. היכנסו שוב ל-Claude ונסו שוב.";
  return "משהו השתבש. נסו שוב.";
}

/* ---------- severe question flags: blocked before sending (qualitative interview rules, NN/g) ---------- */
var SEVERE = [
  {id:"meta", test:function(q){ return /(התעלמ.{0,6}(מההוראות|מההנחיות)|הנחיות המערכת|פרומפט|prompt|chatgpt|צ'אט ג'יפיטי|את(ה)? (בינה מלאכותית|AI|רובוט|בוט)|system prompt)/i.test(q); },
   label:"שאלה על המערכת, לא על היוצר.ת",
   why:"הדמות לא יודעת שהיא סימולציה ותמשיך בתפקיד. התשובה לא תלמד אתכם שום דבר על המשתמש.",
   fix:"חזרו לעבודה של היוצר.ת: מה הוא עושה, מתי, ומה קשה לו.",
   ex:"מה עשית בפעם האחרונה שרצית להבין איך סרטון עבד?"},
  {id:"survey", test:function(q){ return /(בסולם|סקאלה|מ-?\s?1 עד|1 עד 10|1-10|אחת עד עשר|תדרג|תדרגי|דרג.? את|דרגו|באחוזים|כמה אחוז|רב.?ברירה|(^|\s)[אבג][\.\)]\s|תבחר.? (בין|מבין|אחת|אחד)|בחר.? אחת מ)/.test(q); },
   label:"זו שאלת סקר, לא שאלת ריאיון",
   why:"דירוג, אחוזים ואפשרויות מוכנות שייכים לסקר כמותי, שסופר תשובות של הרבה אנשים. בריאיון עם אדם אחד הם נותנים מספר בלי הסבר, ומפספסים את ה'איך' וה'למה'.",
   fix:"שאלו שאלה פתוחה שמבקשת סיפור או הסבר, במילים של המרואיין.",
   ex:"ספרי לי על הפעם האחרונה שהרגשת שסרטון הצליח. מה גרם לך להרגיש ככה?"},
  {id:"design", test:function(q){ return /(איך היית(ם)? (מעצב|מעצבת|בונה|מסדר|מסדרת)|תעצב|תעצבי|תשרטט|תשרטטי|אילו פיצ|איזה פיצ|מה הפיצ|אילו כפתורים|איזה כפתור|איזה צבע|איזה גרף|איזה תרשים|איפה (לשים|למקם|היית שם)|מה צריך להיות (ב|על )(הדשבורד|המסך|הכלי|האפליקציה)|מה היית שם (ב|על )(הדשבורד|המסך|הכלי))/.test(q); },
   label:"ביקשתם מהמרואיין לעצב את הפתרון",
   why:"המרואיין הוא לא המעצב. כשמבקשים ממנו פתרון מקבלים ניחוש או רעיון שראה במקום אחר. העבודה שלכם היא להבין את הצורך, ואת הפתרון גוזרים ממנו אתם.",
   fix:"שאלו על מה שקורה היום: מה הוא מחפש, איפה הוא נתקע, מה הוא עושה כדי לעקוף את זה.",
   ex:"מה קרה בפעם האחרונה שניסית להבין מה עבד השבוע? איפה נתקעת?"},
  {id:"validate", test:function(q){ return /(היית(ם)? (משתמש|משתמשת|משלם|משלמת|קונה|מוריד|מורידה)|תשתמש(י)? ב|תשלם|תשלמי|כמה היית(ם)? משלמ|זה (יעזור|היה עוזר) לך|(דשבורד|כלי|אפליקציה) (כזה|כזאת|כזו) (יעזור|היה עוזר|הייתה עוזרת)|היית רוצה (דשבורד|כלי|אפליקציה))/.test(q); },
   label:"בקשת אישור לרעיון שלכם",
   why:"אנשים נוטים להגיד 'כן' לרעיון, ולא יודעים לחזות מה יעשו בעתיד. 'כן' כזה לא מוכיח כלום, ומטה את המחקר לכיוון שכבר החלטתם עליו.",
   fix:"שאלו על התנהגות בפועל ועל העבר, לא על מוצר שעוד לא קיים.",
   ex:"מה את עושה היום כדי לדעת אם שבוע עבד טוב? מה הכי מעצבן בזה?"},
  {id:"analytics", test:function(q){ return /(כמה (עוקבים|צפיות|לייקים|שמירות|מנויים|שיתופים) (יש|היו|קיבל|קיבלת|קיבלה)|מה (אחוז|שיעור) (ה)?(שימור|מעורבות|המרה|הקלקה)|כמה בדיוק (עוקבים|צפיות|לייקים|שמירות))/.test(q); },
   label:"שאלה שהנתונים כבר עונים עליה",
   why:"מספרים מדויקים נמצאים באפליקציה, והמרואיין בדרך כלל לא זוכר אותם. ריאיון נועד להבין איך הוא מתייחס למספרים, מה הם אומרים לו ומה הוא עושה איתם.",
   fix:"שאלו מה המספר אומר לו ומה הוא עושה כשהוא רואה אותו.",
   ex:"כשאת רואה את המספרים של סרטון, על מה את מסתכלת קודם, ולמה דווקא על זה?"},
  {id:"many", test:function(q){ return (q.match(/\?/g)||[]).length >= 3; },
   label:"יותר מדי שאלות בהודעה אחת",
   why:"מרואיין לא יכול לענות טוב על שלוש שאלות בבת אחת. הוא בוחר אחת, והשאר הולכות לאיבוד.",
   fix:"בחרו את השאלה החשובה ביותר ושאלו רק אותה. את השאר תשאלו אחר כך.",
   ex:"השאירו רק את השאלה הראשונה, וחכו לתשובה."}
];
function severe(q){
  q = (q||"").trim();
  if(q.length < 4) return null;
  for(var i=0;i<SEVERE.length;i++){ try{ if(SEVERE[i].test(q)) return SEVERE[i]; }catch(e){} }
  return null;
}
