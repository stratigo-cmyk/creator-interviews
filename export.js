/* ---------- export: Markdown, Word, PDF ---------- */
var FONTS = /*__FONTS__*/;
var LIBS = {
  docx: {src:"https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.iife.js", global:"docx"},
  jspdf:{src:"https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", global:"jspdf"}
};
var libP = {};
function loadLib(k){
  var L = LIBS[k];
  if(window[L.global]) return Promise.resolve(window[L.global]);
  if(!libP[k]) libP[k] = new Promise(function(res, rej){
    var sc = document.createElement("script"); sc.src = L.src; sc.async = true;
    sc.onload = function(){ window[L.global] ? res(window[L.global]) : rej(new Error("lib")); };
    sc.onerror = function(){ libP[k] = null; rej(new Error("lib")); };
    document.head.appendChild(sc);
  });
  return libP[k];
}
var downloadsPromise = null;
function getDownloads(){
  if(!downloadsPromise){
    downloadsPromise = (window.claude && typeof window.claude.use==="function")
      ? Promise.resolve(window.claude.use("downloads")).catch(function(){ return null; })
      : Promise.resolve(null);
  }
  return downloadsPromise;
}
function today(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function heDate(){ var d=new Date(); return d.getDate()+"."+(d.getMonth()+1)+"."+d.getFullYear(); }

function getStudentName(){ try{ return localStorage.getItem("si:student-name")||""; }catch(e){ return ""; } }
function setStudentName(v){ try{ localStorage.setItem("si:student-name", v.trim()); }catch(e){} }
function fileSafe(v){ return v.trim().replace(/[\\\/:*?"<>|#%{}~&.]+/g,"").replace(/\s+/g,"_").slice(0,40); }
function transcript(p, s, student){
  var own = [], m = s.messages, n = p.qas.length;
  for(var i=0;i<m.length;i++){
    if(m[i].role!=="user") continue;
    var a = (m[i+1] && m[i+1].role==="assistant") ? m[i+1].content : "(לא התקבלה תשובה)";
    n++; own.push({label:"שאלה "+n, q:m[i].content, who:p.name, a:a});
  }
  return {
    title: "ריאיון סינתטי עם "+p.name,
    meta: "מראיין.ת: "+student+"  |  "+heDate(),
    note: "זהו ריאיון סינתטי מבוסס AI, שנבנה מפרופיל מחקרי של "+g(p,"היוצר","היוצרת")+". התשובות אינן ציטוטים אמיתיים.",
    sections: [
      {h:"3 שאלות לפתיחת השיחה", items: p.qas.map(function(x,i){ return {label:"שאלה "+(i+1), q:x.q, who:p.name, a:x.a}; })},
      {h:"הריאיון שלי", items: own, empty:"עוד לא נשאלו שאלות בריאיון הזה."}
    ]
  };
}
function toMarkdown(t){
  var out = ["# "+t.title, "", t.meta, "", "> "+t.note, ""];
  t.sections.forEach(function(sec){
    out.push("## "+sec.h, "");
    if(!sec.items.length){ out.push(sec.empty||"", ""); return; }
    sec.items.forEach(function(it){
      if(it.label) out.push("### "+it.label, "");
      if(it.q) out.push("**"+it.q.replace(/\n+/g," ")+"**", "");
      out.push("**"+it.who+":**", "", it.a, "");
    });
  });
  return out.join("\n");
}
function toDocx(D, t){
  function P(text, o){
    o = o || {};
    return new D.Paragraph({
      bidirectional:true, alignment:D.AlignmentType.START,
      spacing:{before:o.before||0, after:(o.after==null?120:o.after), line:o.line||320},
      border: o.border ? {bottom:{style:D.BorderStyle.SINGLE, size:4, color:"C8CDD3", space:6}} : undefined,
      children:[new D.TextRun({text:text, rightToLeft:true, bold:!!o.bold, size:o.size||22, color:o.color||"16181B", font:"Arial"})]
    });
  }
  var kids = [
    P(t.title, {size:36, bold:true, after:80}),
    P(t.meta, {size:20, color:"565C64", after:120}),
    P(t.note, {size:20, color:"565C64", after:240, border:true})
  ];
  t.sections.forEach(function(sec){
    kids.push(P(sec.h, {size:28, bold:true, before:240, after:160}));
    if(!sec.items.length){ kids.push(P(sec.empty||"", {color:"565C64"})); return; }
    sec.items.forEach(function(it){
      if(it.label) kids.push(P(it.label, {size:18, color:"565C64", before:160, after:40}));
      if(it.q) kids.push(P(it.q.replace(/\n+/g," "), {bold:true, size:23, after:100}));
      kids.push(P(it.who+":", {bold:true, size:20, color:"565C64", before: it.label?0:120, after:40}));
      it.a.split(/\n+/).filter(function(x){return x.trim();}).forEach(function(par){ kids.push(P(par, {after:100})); });
    });
  });
  var doc = new D.Document({
    creator:"ראיונות יוצרים", title:t.title,
    styles:{default:{document:{run:{font:"Arial", rightToLeft:true}}}},
    sections:[{properties:{page:{margin:{top:1134,bottom:1134,left:1134,right:1134}}}, children:kids}]
  });
  return D.Packer.toBlob(doc);
}
/* jsPDF draws glyphs left to right, so each line is reordered to visual RTL first:
   Latin and digit runs keep their order, Hebrew runs are reversed, brackets mirrored. */
function visualRTL(s){
  var re=/[A-Za-z0-9](?:[A-Za-z0-9 .,:'&_\/+%#@-]*[A-Za-z0-9])?/g, segs=[], last=0, m;
  while((m=re.exec(s))){ if(m.index>last) segs.push({t:s.slice(last,m.index),l:false}); segs.push({t:m[0],l:true}); last=m.index+m[0].length; }
  if(last<s.length) segs.push({t:s.slice(last),l:false});
  var MIR={"(":")",")":"(","[":"]","]":"[","{":"}","}":"{","<":">",">":"<","«":"»","»":"«"};
  return segs.reverse().map(function(x){ return x.l ? x.t : Array.from(x.t).reverse().map(function(c){ return MIR[c]||c; }).join(""); }).join("");
}
function toPdf(J, t){
  var d = new J.jsPDF({unit:"mm", format:"a4"});
  d.addFileToVFS("h400.ttf", FONTS.r); d.addFont("h400.ttf","H","normal");
  d.addFileToVFS("h700.ttf", FONTS.b); d.addFont("h700.ttf","H","bold");
  var PW=210, PH=297, M=20, R=PW-M, maxW=PW-2*M, y=M-4;
  var INK=[22,24,27], MUTED=[86,92,100];
  function para(text, size, bold, color, after){
    d.setFont("H", bold?"bold":"normal"); d.setFontSize(size); d.setTextColor(color[0],color[1],color[2]);
    var lh = size*0.3528*1.55;
    text.split(/\n+/).forEach(function(par, pi){
      if(!par.trim()) return;
      if(pi) y += lh*0.35;
      d.splitTextToSize(par, maxW).forEach(function(line){
        if(y+lh > PH-M){ d.addPage(); y=M-4; }
        y += lh;
        d.text(visualRTL(line), R, y, {align:"right", isInputVisual:true, isOutputVisual:true});
      });
    });
    y += after||0;
  }
  function rule(){ d.setDrawColor(200,205,211); d.setLineWidth(0.2); d.line(M, y, R, y); y += 3; }
  para(t.title, 18, true, INK, 1);
  para(t.meta, 9.5, false, MUTED, 1);
  para(t.note, 9.5, false, MUTED, 4); rule();
  t.sections.forEach(function(sec){
    y += 3; para(sec.h, 13.5, true, INK, 2);
    if(!sec.items.length){ para(sec.empty||"", 10.5, false, MUTED, 2); return; }
    sec.items.forEach(function(it){
      if(y > PH-M-30){ d.addPage(); y=M-4; }
      if(it.label) para(it.label, 8.5, false, MUTED, 0.5);
      if(it.q) para(it.q.replace(/\n+/g," "), 11.5, true, INK, 1.5);
      para(it.who+":", 9.5, true, MUTED, 0.5);
      para(it.a, 10.5, false, INK, 5);
    });
  });
  return d.output("arraybuffer");
}
var exporting = false;
function doExport(p, s, kind, status, btn, nameIn){
  return runExport(kind, status, btn, nameIn, function(student){ return transcript(p, s, student); }, "ריאיון-"+p.short);
}
function runExport(kind, status, btn, nameIn, build, base){
  if(exporting) return;
  var student = nameIn.value.trim();
  if(!student){
    status.classList.add("bad"); status.textContent = "כתבו את השם שלכם לפני השמירה, כדי שהקובץ יהיה מזוהה.";
    nameIn.setAttribute("aria-invalid","true"); nameIn.focus(); return;
  }
  var t = build(student), fname = base+"-"+fileSafe(student)+"-"+today()+"."+kind;
  status.classList.remove("bad"); status.textContent = "מכין את הקובץ...";
  exporting = true; btn.setAttribute("aria-busy","true");
  var make = kind==="md" ? Promise.resolve(toMarkdown(t))
    : kind==="docx" ? loadLib("docx").then(function(D){ return toDocx(D, t); })
    : loadLib("jspdf").then(function(J){ return toPdf(J, t); });
  Promise.all([make, getDownloads()]).then(function(r){
    var data = r[0], dl = r[1];
    if(!dl) throw {code:"unavailable"};
    status.textContent = "אשרו את השמירה בחלון שנפתח.";
    return dl.save({filename:fname, data:data});
  }).then(function(){
    status.textContent = "הקובץ נשמר.";
  }).catch(function(e){
    var code = e && e.code;
    status.classList.add("bad");
    if(code==="declined"){ status.classList.remove("bad"); status.textContent = "השמירה בוטלה."; }
    else if(code==="rate_limited"){ status.textContent = "חלון שמירה כבר פתוח. סגרו אותו ונסו שוב."; }
    else if(code==="rejected_extension" || code==="extension_not_enabled"){ status.textContent = "הפורמט הזה לא זמין כאן. נסו Markdown."; }
    else if(code==="unavailable" || code==="not_granted" || code==="capability_disabled" || code==="capability_removed"){
      status.replaceChildren("שמירת קבצים לא זמינה בתצוגה הזו. ", el("button",{type:"button",onclick:function(){ copyText(toMarkdown(t), status); }},["העתקת הריאיון"]));
    }
    else if(e && e.message==="lib"){ status.textContent = "לא הצלחנו לטעון את רכיב השמירה. בדקו את החיבור ונסו שוב."; }
    else { status.textContent = "משהו השתבש בשמירה. נסו שוב."; }
  }).then(function(){ exporting = false; btn.removeAttribute("aria-busy"); });
}
function copyText(text, status){
  function done(){ status.classList.remove("bad"); status.textContent = "הריאיון הועתק. אפשר להדביק במסמך."; }
  try{
    navigator.clipboard.writeText(text).then(done, fallback);
  }catch(e){ fallback(); }
  function fallback(){
    var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); done(); }catch(e){ status.textContent = "לא הצלחנו להעתיק."; }
    ta.remove();
  }
}
