import json,re,sys,base64,os
sys.path.insert(0,'.')
from personas import PERSONAS
from canon import CANON, TOPICS
from behavior_data import B
def clean(md):
    md=re.split(r'\n# 37\.', md)[0]
    md=re.sub(r'\s*\[(S\d+(?:[-–,]\s*S?\d+)*(?:,\s*S\d+(?:-S\d+)?)*)\]','',md)
    md=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'\1',md)
    md=re.sub(r'[ \t]{2,}',' ',md)
    md=re.sub(r'\n{3,}','\n\n',md)
    md=md.replace('—',', ').replace('–','-')
    return md.strip()
out=[]
for p in PERSONAS:
    d=dict(p); d['profile']=clean(open(p['file']).read()) if os.path.exists(p['file']) else ''; d.pop('file')
    v2=open('profiles_v2/'+p['file'].replace('_creator_profile_he.md','_research_profile_v2.md')).read()
    v2=re.split(r'\n## נספח ב', v2)[0]                       # drop sources list
    v2=re.sub(r'\n## 1[4-7]\..*?(?=\n## |\Z)', '', v2, flags=re.S)  # drop hypotheses, directions, questions, UX opportunities
    v2=v2.split('\n---\n',1)[-1] if '\n---\n' in v2 else v2  # drop the reading-guide header
    d['profile2']=v2.replace('—',', ').replace('–','-').strip()
    c=CANON[p['id']]; assert set(c)==set(k for k,_ in TOPICS), p['id']
    ph='img/'+p['id']+'.jpg'
    d['photo']='data:image/jpeg;base64,'+base64.b64encode(open(ph,'rb').read()).decode() if os.path.exists(ph) else ''
    bh=B[p['id']]; assert set(bh['deep'])<=set(k for k,_ in TOPICS), p['id']
    for k_ in ('open0','pat0','agenda','voice','knowgaps','initiative','deep','ice1v','clarify_style','not_knows'): d[k_]=bh[k_]
    d['canon']="\n".join("- %s: %s"%(label,c[k]) for k,label in TOPICS)
    out.append(d)
data=json.dumps(out,ensure_ascii=False).replace('</','<\\/')
fonts=json.dumps({"r":base64.b64encode(open('nsh-400.ttf','rb').read()).decode(),"b":base64.b64encode(open('nsh-700.ttf','rb').read()).decode()})
exp=open('export.js').read().replace('/*__FONTS__*/',fonts)
cover='data:image/jpeg;base64,'+base64.b64encode(open('img/cover.jpg','rb').read()).decode()
html=open('template.html').read().replace('/*__COVER__*/',json.dumps(cover)).replace('/*__EXPORT__*/',exp).replace('/*__TOOLS__*/',open('tools.js').read()).replace('/*__BH__*/',open('behavior.js').read()).replace('/*__DATA__*/',data)
assert '—' not in exp and '/*__' not in html
open('index.html','w').write(html)
print('html bytes',len(html.encode()))
