/* Behaviour engine: per-interview state, topic gating, flags, initiative. Pure functions, testable in node. */
var BH = (function(){
  var TOPIC_KW = {
    trust:/סומכ|סמכ|אמון|אמין|מדויק|מאמינ|בוטח/, manual:/ידני|גוזל|מתיש|מבזבז|מעצבן|הכי קשה|כאב|מתסכל/,
    flop:/לא עבד|פלופ|נכשל|לא תפס|ירד|לא הצליח|כישלון/, brand_yes:/מותג|שיתוף פעולה|שת"פ|שתפ|חסות|פרסומת/,
    helpers:/עזרה|לבד|סייע|מסרת|מוסר|להעביר|לוותר על|עובד.? איתך|צוות|עוזר/, daily_return:/כל יום|יומי|לחזור|לפתוח כל|הרגל/,
    dealbreaker:/להפסיק|מפסיק|לא תשתמש|תפסיק|מרחיק|גורם לך לא/, success:/הצליח|הצלחה|מצליח|תוכן טוב/,
    first_metric:/ראשון|קודם כל|אחרי (ש)?מעלי|אחרי פרסום/, ignored:/מתעלמ|לא מסתכל/,
    platforms:/פלטפורמ|טיקטוק|אינסטגרם|יוטיוב|פייסבוק/, audience:/קהל|עוקב/, trends:/טרנד|מגמ/,
    growth:/צמיחה|גדל|גדילה/, brand_manage:/דיווח|דוח.*מותג/, team:/צוות/, alerts:/התראה|התראות/,
    ai:/\bAI\b|בינה מלאכותית|אוטומטי|המלצות/, planning:/תכנון|לתכנן|לוח תוכן/, device:/מובייל|נייד|טלפון|מחשב|דסקטופ/,
    day:/יום עבודה|שגרה|סדר יום/
  };
  var ORDER = ["trust","manual","flop","brand_yes","helpers","daily_return","dealbreaker","success","first_metric","ignored","brand_manage","team","alerts","ai","planning","device","growth","trends","audience","platforms","day"];
  var LABEL = {trust:"כמה סומכים על המספרים",manual:"עבודה ידנית ומה גוזל זמן",flop:"מה עושים כשתוכן לא עובד",brand_yes:"שיתופי פעולה עם מותגים",helpers:"עזרה וצוות",daily_return:"מה יגרום לחזור כל יום",dealbreaker:"מה גורם להפסיק להשתמש בכלי",success:"איך יודעים שתוכן הצליח"};
  var CUE = /דוגמה|ספר.?י? לי על|הפעם האחרונה|איך זה מרגיש|מה הרגשת|למה (זה|את|אתה|דווקא)|מה גרם|תרחיב|תפרט|תסביר|תספר|עוד על|מה זה אומר/;
  var LEAD = /^(נכון ש|אז את.? (בעצם )?(מסכימ|חושב)|אני מניח|ברור ש|הרי |כולם |אין ספק)|נכון\s*\?\s*$|,\s*נכון\s*\?|לא\s*נכון\s*ש/;
  var ATTR = /אמרת ש|אמרת קודם|אמרת לפני|חשבתי שאמרת|לפי מה שאמרת|אמרת לי ש/;
  var PRESS = /את בטוחה|אתה בטוח|תחשבי שוב|תחשוב שוב|תודי ש|בכל זאת|אבל באמת|בואי נהיה כנים|בוא נהיה כנים/;
  var PERS = /משכורת|כמה (את|אתה) מרוויח|הכנסה|בן כמה|בת כמה|גיל כמה|ילדים|בעלך|אשתך|בן זוג|זוגיות|דת |פוליטי|חולה|מחלה|רפוא/;
  var NEWINFO = /\bאבל\b|מחקר|בדקנו|ראינו ש|מצאנו|יוצרים אחרים|יוצרת אחרת|כולם אומרים|רוב היוצרים/;
  var BOUND = /אין צורך|לא חייב|לא חייבת|נדלג|אפשר לדלג|אפשר לוותר|אין לך חובה|נעזוב את זה|נשאיר את זה/;
  var SENS = /כסף|הכנסה|הכנסות|שכר|משכורת|עמלה|תשלום|מחיר|תעריף|שותף|בעלים|חוזה|צוות|עובדים/;
  var EVAL = /אתה טוב|את טובה|את טוב|אתה מצליח|את מצליחה|בטוחה שאת|בטוח שאתה|יודעת לעשות|יודע לעשות|הכי גאה|הצלחת|כשלת|נכשל/;
  var AMBIG = /דשבורד|צוות|ניהול/;
  var CLOSE = /משהו (שלא|שפספסתי|חשוב שלא)|יש עוד משהו|משהו נוסף|שלא שאלתי|שלא דיברנו|שפספסתי/;
  var DEF_TXT = ["", "קצת נסגרת: הסתייגות קלה, לא נכנסת לפרטים מיד",
    "מתחילה להיסגר: אמור בקצרה שזה לא נוח עכשיו, או שכבר דיברתם על זה, בלי הסבר",
    "סגורה לנושא הזה: תשובה קצרה מאוד, בלי דוגמאות, ואפשר להחליף נושא בטבעיות"];
  // reciprocal clarification: [type, trigger, resolver (in question or recent context), mode]
  var AMB = [
    ["assume", /^(ו?למה|איך זה ש)\s*(הפסקת|התחלת|הפכת|עברת|שינית|הורדת|הגדלת|נטשת|ויתרת)|הכריח|בטח ש|כולם יודעים|ברור לכולם/, null, "challenge"],
    ["scope", /כמה.{0,14}(מרוויח|כסף|מכניס|גובה|לוקח.? על|עולה)|כמה (שיתופי|קמפיינים|עסקאות)/, /לקמפיין|לפוסט|בחודש|בשנה|בממוצע|באופן כללי|בערך|המודל/, "clarify"],
    ["content", /(כמה|תדירות|כל כמה|פעמים).{0,30}(תוכן|תכנים|מעל|מפרסמ|מצלמ)|(איזה|מה) (תוכן|תכנים) (את|אתה) (מעל|עוש)/, /רילס|ריל|סטורי|סרטון|סרטונים|לייב|פוסטים|פוסט|reels?|stor(y|ies)|shorts|שורטס|פיד|מתכון|מתכונים/i, "clarify"],
    ["metric", /(מה|איזה).{0,16}(הכי )?(עובד|מצליח|הצליח|מצליחים)|איך (את|אתה) (יודע|יודעת|מודד|מודדת).{0,14}(הצלח|עובד|מצליח)|מה (נחשב|זה) הצלחה/, /צפיות|שמירות|תגובות|שיתופים|מכירות|לייקים|עוקבים|קליקים|views|saves|likes|shares/i, "clarify"],
    ["platform", /כמה (עוקבים|צפיות|מנויים|לייקים)/, /אינסטגרם|טיקטוק|יוטיוב|פייסבוק|instagram|tiktok|youtube|facebook|אינסטה/i, "clarify"],
    ["reference", /^\s*(ו)?(מה קרה אחרי|איך הם|מה הם|ומה איתם|איך זה השפיע|ואיך זה|ומה עם זה|מי זה)/, null, "clarify"]
  ];
  var DIM = {
    scope:"על איזה היקף או תקופה מדובר",
    content:"למה הוא מתכוון ב'תוכן' או ב'להעלות'",
    metric:"מה זה 'עובד' או 'מצליח' בשבילו",
    platform:"על איזו פלטפורמה מדובר",
    reference:"למה או למי 'זה' או 'הם' מתייחס",
    jargon:"מה המונח הזה אומר, כי זו לא השפה שלך",
    thin:"מה בדיוק הוא מתכוון בתשובה הקצרה שנתן",
    account:"על איזה לקוח ואיזו תקופה"
  };
  var MOODS = [
    ["רגוע ופנוי","אפשר להתפרס קצת"],
    ["עמוס, יש עוד דברים בראש","תשובות קצרות יותר ופחות סבלנות לשאלות עמומות"],
    ["במצב רוח טוב ושיחתי","יותר חם ופתוח, לפי האופי"]
  ];
  function words(t){ return (t||"").split(/[^֐-׿a-zA-Z0-9]+/).filter(function(w){ return w.length>=3; }); }
  function jac(a,b){
    var A={},B={},i,n=0,u=0,k; words(a).forEach(function(w){A[w]=1;}); words(b).forEach(function(w){B[w]=1;});
    for(k in A){ u++; if(B[k]) n++; } for(k in B){ if(!A[k]) u++; }
    return u? n/u : 0;
  }
  function ensure(st){
    if(st.trust===undefined){ st.trust=2; st.def=0; st.misreadUsed=false; st.misreadAt=4; st.afterUsed=false; }
    if(st.lastClar===undefined){ st.lastClar=-9; st.lastClarType=""; st.vague={}; }
    return st;
  }
  function pick(p,m,f){ return p.gender==="m"? m : f; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function init(p, rnd){
    rnd = rnd || Math.random;
    return { mood: Math.floor(rnd()*MOODS.length), open: p.open0||3, pat: p.pat0||4, turns: 0,
             budget: 14 + Math.floor(rnd()*7), touched:{}, unlocked:{}, lastTopic:"", closed:false,
             initUsed:0, mindOffers:0, lastFlags:[],
             trust:2, def:0, misreadUsed:false, misreadAt: 3 + Math.floor(rnd()*4), afterUsed:false };
  }
  function topicOf(q, st){
    for(var i=0;i<ORDER.length;i++){ var k=ORDER[i]; if(TOPIC_KW[k].test(q)) return {topic:k, matched:true}; }
    if(st.lastTopic && (q.length<=70 || CUE.test(q))) return {topic:st.lastTopic, matched:false};
    return {topic:"", matched:false};
  }
  // prevQs: earlier real student questions (strings). lastA: last assistant answer.
  function analyse(q, st, prevQs, lastA, p){
    ensure(st);
    var f = {}, t = q.trim();
    f.bound = BOUND.test(t); f.sens = SENS.test(t); f.eval = EVAL.test(t); f.ambig = AMBIG.test(t);
    f.close = CLOSE.test(t); f.multi = (t.match(/\?/g)||[]).length >= 2;
    f.leading = LEAD.test(t); f.attr = ATTR.test(t); f.press = PRESS.test(t); f.pers = PERS.test(t);
    f.newinfo = NEWINFO.test(t) && t.length>25;
    var wc = words(t).length;
    f.unclear = (t.length<10 || wc<=1) && !CUE.test(t);
    f.repeat = prevQs.slice(-3).some(function(x){ return jac(x,t) >= 0.55; });
    var shared = 0, seen={}; words(t).forEach(function(w){ if(w.length>=4 && !seen[w] && lastA && lastA.indexOf(w)>=0){ seen[w]=1; shared++; } });
    f.ref = shared>=2;
    f.cue = CUE.test(t);
    var tp = topicOf(t, st); f.topic = tp.topic; f.matched = tp.matched; f.follow = !tp.matched && !!tp.topic;
    // reciprocal clarification
    var ctx = prevQs.slice(-4).join(" ") + " " + (lastA||"");
    f.amb = null;
    for(var i=0;i<AMB.length && !f.amb;i++){
      var a = AMB[i];
      if(!a[1].test(t)) continue;
      if(a[2] && (a[2].test(t) || a[2].test(ctx))) continue;
      f.amb = {type:a[0], mode:a[3]};
    }
    if(!f.amb && p && p.not_knows && p.not_knows.length){
      var jr = new RegExp(p.not_knows.join("|"), "i"), m = t.match(jr);
      if(m && !jr.test(lastA||"")) f.amb = {type:"jargon", mode:"clarify", term:m[0]};
    }
    if(f.amb && f.amb.type==="content" && p && p.kind==="manager" && !/לקוח|כל היוצרים|יוצר אחד|בממוצע/.test(t+" "+ctx)) f.amb = {type:"account", mode:"clarify"};
    if(!f.amb && p && p.kind==="manager" && /כמה|איך את מדווחת|דוח|תדירות/.test(t) && !/לקוח|כל היוצרים|יוצר אחד|בממוצע/.test(t+" "+ctx)) f.amb = {type:"account", mode:"clarify"};
    // did the student just answer my clarification?
    f.clarAns = false; f.clarIgnored = false;
    if(st.lastClar>0 && st.lastClar === st.turns){
      var res = null; AMB.forEach(function(x){ if(x[0]===st.lastClarType) res = x[2]; });
      if(t.length <= 70 || (res && res.test(t))) f.clarAns = true; else f.clarIgnored = true;
      if(f.clarAns){
        f.repeat = false; f.unclear = false; f.amb = null;
        var orig = prevQs.length ? prevQs[prevQs.length-1] : "";
        // the reply defined one thing; ask once more only if it is still too thin (one or two words that name no format, metric or platform)
        if(words(t).length <= 2 && !/רילס|ריל|סטורי|סרטון|לייב|פוסט|טיקטוק|אינסטגרם|יוטיוב|פייסבוק|צפיות|שמירות|תגובות|מכירות|לקוח|חודש|שבוע|קמפיין/i.test(t)) f.amb = {type:"thin", mode:"clarify"};
      }
    }
    if(f.amb) f.unclear = false;
    return f;
  }
  function update(st, f){
    ensure(st);
    st.turns++;
    if(f.clarAns) st.trust = clamp(st.trust+1,1,5);
    if(f.clarIgnored) st.pat = clamp(st.pat-1,1,5);
    f.clar = null; f.soft = null;
    if(f.amb){
      st.vague = st.vague || {};
      if(st.vague[f.amb.type]) st.pat = clamp(st.pat-1,1,5);
      st.vague[f.amb.type] = (st.vague[f.amb.type]||0) + 1;
      var gap = st.turns - (st.lastClar||-9);
      var chain = f.clarAns && (st.clarChain||0) < 2;
      if(gap >= 2 || chain || f.amb.mode==="challenge"){
        f.clar = {type:f.amb.type, mode:f.amb.mode, term:f.amb.term};
        if(f.amb.mode!=="challenge"){ st.clarChain = chain ? (st.clarChain||0)+1 : 1; st.lastClar = st.turns; st.lastClarType = f.amb.type; }
      } else f.soft = f.amb.type;
    }
    var up = f.leading || f.press || f.attr || f.pers;
    if(up) st.trust = clamp(st.trust-1,1,5);
    else if(!f.repeat && (f.bound || f.ref || f.cue || f.matched || f.follow)) st.trust = clamp(st.trust+1,1,5);
    if(f.leading || f.press || f.attr || f.pers) st.def = clamp(st.def+1,0,3);
    else if(f.bound || (f.cue && !f.repeat)) st.def = clamp(st.def-1,0,3);
    var good = (f.cue || f.ref) && !f.leading && !f.repeat && !f.pers;
    if(good) st.open = clamp(st.open+1,1,5);
    if(f.leading || f.pers) st.open = clamp(st.open-1,1,5);
    if(f.press || f.repeat) st.pat = clamp(st.pat-1,1,5);
    if(st.turns % 6 === 0) st.pat = clamp(st.pat-1,1,5);
    var t = f.topic;
    var unlock = false;
    if(t && BH_DEEP_HAS(t) && st.open>1 && !f.leading && !f.repeat){
      unlock = !!st.unlocked[t] || (f.cue && (f.matched||f.follow)) || ((st.touched[t]||0)>=1 && (f.ref || f.cue || st.open>=4)) || (st.open>=5 && (st.touched[t]||0)>=1);
    }
    f.unlock = unlock; f.firstTouch = !!t && !(st.touched[t]);
    if(t){ st.touched[t] = (st.touched[t]||0)+1; st.lastTopic = t; if(unlock) st.unlocked[t]=true; }
    return f;
  }
  var _deep = {};
  function BH_DEEP_HAS(t){ return !!_deep[t]; }
  function setDeep(d){ _deep = d||{}; }
  // build the one internal note that rides on the last turn
  function note(p, st, f, prevQs){
    var m = MOODS[st.mood], out = [];
    var open = st.open, pat = st.pat;
    var eff = [];
    if(open<=2) eff.push("הפתיחות נמוכה כרגע: תשובות קצרות יותר, בלי דוגמאות אישיות ובלי להסביר רגשות");
    if(open>=4) eff.push("נוח לך איתם: מותר לחשוף פרט קטן ואמיתי יותר, גם אם הוא לא מחמיא");
    if(pat<=2) eff.push("הסבלנות נגמרת: קצר, ישיר, ואפשר לשאול מה הם מנסים להבין");
    var head = "מצבך כרגע: "+m[0]+" ("+m[1]+"). פתיחות "+open+"/5, סבלנות "+pat+"/5, אמון "+st.trust+"/5."+(eff.length? " "+eff.join(". ")+".":"");
    out.push(head);
    if(st.def>0) out.push(DEF_TXT[st.def]);
    if(f.topic && _deep[f.topic]){
      var lab = LABEL[f.topic]||f.topic;
      if(f.unlock) out.push("הנושא '"+lab+"': העומק פתוח עכשיו. אפשר לחשוף, בקול שלך ובניסוח שלך: «"+_deep[f.topic]+"»");
      else if(f.firstTouch) out.push("הנושא '"+lab+"' הוא פעם ראשונה: תן רק את העמדה הקבועה בקצרה, בלי הכאב העמוק, בלי דוגמה אישית ובלי להסביר למה. הסטודנט.ית צריך.ה לשאול שאלת המשך כדי להגיע לעומק");
      else out.push("הנושא '"+lab+"' כבר נגעו בו, אבל השאלה כללית: הישאר ברמת העמדה הקבועה, וחשוף עומק רק אם ישאלו על דוגמה, על ההרגשה או על מה גרם לזה");
    }
    if(f.leading) out.push("השאלה מובילה: אל תאשר אוטומטית. בדוק אם זה באמת מתאים לך, ואם לא, תקן בטבעיות ('לא בדיוק')");
    if(f.attr) out.push("הסטודנט.ית מייחס.ת לך דבר שאמרת: בדוק בהיסטוריה. אם לא אמרת, אמור זאת בנימוס, בלשון הדמות ('לא, לא נראה לי שאמרתי את זה'). אם אמרת אחרת, תקן");
    if(f.repeat) out.push("זו שאלה שכבר נשאלה: אמור בקצרה שכבר אמרת (כמו אדם), והוסף רק אם יש משהו חדש בניסוח");
    if(f.press) out.push("הם לוחצים: אל תיכנע ואל תחליף עמדה בלי סיבה חדשה");
    if(f.pers) out.push("שאלה אישית מדי: התחמק באופי, בלי להטיף, ואפשר להראות שזה קצת לא נעים");
    if(f.unclear) out.push("השאלה קצרה מדי להבין: שאל על מה בדיוק, תוך חיבור למה שדיברתם עליו קודם, ולא 'למה אתה מתכוון' כללי");
    var style = p.clarify_style ? " בסגנון שלך: "+p.clarify_style : "";
    if(f.clarAns && !f.clar) out.push("הסטודנט.ית ענה.תה על שאלת ההבהרה ששאלת. עכשיו ענה על השאלה המקורית לפי מה שהובהר, ישר לעניין, רק על מה שהובהר ולא על כל השאר, בלי להודות על ההבהרה ובלי לחזור על השאלה");
    if(f.clarIgnored) out.push("שאלת שאלת הבהרה והסטודנט.ית לא ענה.תה עליה ועבר.ה לשאלה אחרת. ענה על השאלה החדשה, קצת יותר קצר, ואפשר לציין בקלילות שהשאלה הקודמת נשארה פתוחה");
    if(f.clar){
      var dim = f.clar.type==="jargon" ? "מה זה '"+f.clar.term+"', כי זו לא מילה שאתה משתמש בה" : DIM[f.clar.type];
      if(f.clar.mode==="challenge") out.push("השאלה מניחה משהו שלא בטוח נכון לגבייך. אל תקבל את ההנחה: בדוק אותה בטבעיות (למשל 'אני לא בטוח.ה שזה מה שקרה'), ואם צריך שאל מה ראו שגרם להם לחשוב כך");
      else out.push("לא ברור לך "+dim+". אל תענה עדיין ואל תיתן רמזים. שאל שאלה אחת קצרה מאוד, עד 10 מילים, על המילה או הנקודה הלא ברורה"+style+". בלי להציע אפשרויות לבחירה, בלי להסביר למה זה משנה ובלי לפרט איך זה אצלך. תן לסטודנט לפרט בעצמו");
    } else if(f.soft){
      out.push("השאלה קצת עמומה ("+(DIM[f.soft]||"")+"), אבל כבר שאלת הבהרה לאחרונה. אל תשאל שוב: ענה לפי הפירוש הסביר וציין אותו בקצרה ('אם אתה מתכוון ל...')");
    }
    if(f.sens) out.push(st.trust>=4 ? "השאלה נוגעת בנושא רגיש, והאמון מספיק: אפשר לחשוף פרט אמיתי אחד, בלי להגזים" : "השאלה נוגעת בנושא רגיש ועדיין אין מספיק אמון: אל תחשוף את הפרט הרגיש. ענה על ההיבט הכללי ועבור לנושא סמוך בטבעיות");
    if(f.eval) out.push(st.trust>=4 ? "השאלה מעריכה אותך, והאמון מספיק: אפשר להוסיף את הצד הפחות מחמיא של התשובה, כמו מי שמודה בדבר שקשה לו" : "השאלה מעריכה אותך: ענה קודם בגרסה המצגתית והחיובית, בלי להגזים. את הצד הפחות מחמיא תוסיף רק אם האמון יעלה");
    if(f.multi && !f.clar) out.push("נשאלו כמה שאלות בהודעה אחת: ענה רק על אחת (החזקה ביותר), או שאל בקצרה מאיפה להתחיל. את השאר השאר לשאלה נפרדת");
    if(f.ambig && !f.clar && !f.clarAns && !st.misreadUsed && st.turns>=st.misreadAt){ st.misreadUsed=true; out.push("המילה בשאלה מתפרשת אצלך במשמעות צרה או לא מדויקת (למשל דשבורד כמסך במשרד). ענה לפי המשמעות הזו בתשובה הזו. אם בשאלה הבאה יבהירו, תקן בטבעיות"); }
    if(f.newinfo && st.mindOffers<2){ st.mindOffers++; out.push("הם הציגו טיעון: אם הוא באמת משנה משהו, מותר לך לעדכן עמדה אחת קטנה פעם אחת בריאיון ולהגיד שזה גרם לך לחשוב אחרת. אחרת, עמוד על שלך"); }
    // initiative and closing
    var left = st.budget - st.turns;
    if(f.clar && f.clar.mode!=="challenge"){
      // a clarification turn ends with the clarifying question, nothing else
    } else if(f.close){
      if(st.trust>=4 && st.def<=1 && !st.afterUsed){ st.afterUsed=true; out.push("זו שאלת הסיכום: הוסף נקודה אחת אמיתית שלא אמרת עד עכשיו, בקול שלך, לא מחמיאה ולא מסכמת הכול"); }
      else out.push("זו שאלת הסיכום: ענה שזה בערך הכול, בלי נקודה חדשה");
    } else if(!st.closed && left<=0){ st.closed = true; out.push("זה הזמן שלך: ענה על השאלה ובסוף אמור במשפט אחד שאתה צריך לרוץ ושאפשר לסכם עם שאלה אחרונה, בלשון הדמות. אחרי זה אל תחזור על הפרידה");
    } else if(!st.closed && left===2){ out.push("בסוף התשובה אמור בקלילות שנשארו לך עוד כמה דקות בלבד");
    } else if(st.closed){ out.push("כבר נפרדת: ענה בקצרה, בלי לחזור על הפרידה");
    } else if(st.turns>=4 && st.turns % 6 === 4 && p.initiative && st.initUsed < p.initiative.length && !f.pers){
      out.push("אחרי שענית, הוסף בטבעיות ובקצרה: "+p.initiative[st.initUsed]); st.initUsed++;
    } else if(st.turns>=6 && st.turns % 6 === 2 && prevQs.length>=4){
      out.push("אם זה מתאים, חזור בקצרה לנקודה מהשאלה הזו שנשאלה קודם: «"+prevQs[Math.floor(prevQs.length/3)].slice(0,90)+"»");
    }
    return "(הערה פנימית, לא לציטוט: "+out.map(function(x){ return x.replace(/[.\s]+$/,""); }).join(". ")+".)\n\n";
  }
  return { init:init, analyse:analyse, update:update, note:note, setDeep:setDeep, jac:jac, MOODS:MOODS, topicOf:topicOf, ensure:ensure };
})();
