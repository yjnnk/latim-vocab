"""Rebuild verb counts from the eight versioned LASLA/LiLa source files."""
import json,re,csv,hashlib
from pathlib import Path
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[1]
lex={}
for line in (ROOT/'data/translations.tsv').read_text().splitlines():
 if line and not line.startswith('#'):
  k,v=line.split('\t',1); lex[k]=v
verbs={}; totals=[]; sources=[]
for book in range(1,9):
 p=ROOT/f'data/source/book-{book}.conllup'; total=0
 sources.append({'book':book,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 for line in p.read_text().splitlines():
  if line.startswith('# text = '): sentence=line[9:]
  a=line.split('\t')
  if len(a)<13 or not a[0].isdigit(): continue
  total+=1
  if a[3] not in ('VERB','AUX'): continue
  lemma=a[2]; cat=a[10]; v=verbs.setdefault(lemma,{'lemma':lemma,'class':cat,'books':[0]*8,'forms':Counter(),'examples':{}})
  v['books'][book-1]+=1; v['forms'][a[1]]+=1
  if str(book) not in v['examples']:
   ref=re.search(r'Capitulum_(\d+),Paragraphus_(\d+)',a[9])
   v['examples'][str(book)]={'text':sentence,'form':a[1],'ref':f'{book}.{ref[1]}.{ref[2]}' if ref else str(book)}
 totals.append(total)
irregular={'sum':'esse','possum':'posse','uolo':'uelle','nolo':'nolle','malo':'malle','fero':'ferre','fio':'fieri','eo':'ire','coepio':'coepisse','odi':'odisse','memini':'meminisse','inquio':'inquam','licet':'licere','oportet':'oportere','pudeo':'pudere','edo':'edere','do':'dare','circumdo':'circumdare','sto':'stare','assum':'adesse','absum':'abesse','desum':'deesse','intersum':'interesse','praesum':'praeesse','subsum':'subesse','supersum':'superesse','prosum':'prodesse','reuertor':'reuerti','orior':'oriri','adorior':'adoriri','coorior':'cooriri','morior':'mori','patior':'pati','perpetior':'perpeti','potior':'potiri','partior':'partiri','metior':'metiri','dimetior':'dimetiri','largior':'largiri','experior':'experiri','nanciscor':'nancisci','ulciscor':'ulcisci','nascor':'nasci','enascor':'enasci','innascor':'innasci','proficiscor':'proficisci','queror':'queri','sequor':'sequi','insequor':'insequi','consequor':'consequi','subsequor':'subsequi','persequor':'persequi','prosequor':'prosequi','exsequor':'exsequi','loquor':'loqui','colloquor':'colloqui','utor':'uti','fruor':'frui','fungor':'fungi','nitor':'niti','innitor':'inniti','labor':'labi','elabor':'elabi','reminiscor':'reminisci','obliuiscor':'obliuisci','adipiscor':'adipisci','circumplector':'circumplecti','complector':'complecti','tueor':'tueri','intueor':'intueri','confiteor':'confiteri','profiteor':'profiteri','fateor':'fateri','mereor':'mereri','audeo':'audere','gaudeo':'gaudere','soleo':'solere','confido':'confidere','diffido':'diffidere','fido':'fidere','defetiscor':'defetisci'}
def infinitive(k,c):
 if k in irregular:return irregular[k]
 if k.endswith('fero'):return k[:-4]+'ferre'
 if c=='v6' and k.endswith('eo'):return k[:-2]+'ire'
 if c=='v6' and k.endswith('fio'):return k[:-3]+'fieri'
 if k.endswith('gredior'):return k[:-2]
 if c=='v2' and k.endswith('eo'):return k[:-2]+'ere'
 if k.endswith('or'):
  return k[:-2]+('ari' if c=='v1' else 'ri' if c=='v2' else 'i')
 return k[:-1]+{'v1':'are','v2':'ere','v3':'ere','v4':'ire','v5':'ere'}.get(c,'ere') if not k.endswith('io') or c not in ('v4','v5') else k[:-2]+('ire' if c=='v4' else 'ere')
rows=[]
for k,v in verbs.items():
 v['count']=sum(v['books']);v['translation']=lex.get(k,'');v['infinitive']=infinitive(k,v['class']);v['forms']=[{'form':f,'count':n} for f,n in v['forms'].most_common()];rows.append(v)
rows.sort(key=lambda x:(-x['count'],x['lemma']))
missing=[x['lemma'] for x in rows if not x['translation']]
if missing: print('MISSING',len(missing), ' | '.join(missing))
result={'meta':{'title':'De Bello Gallico','books':8,'authors':['César (I–VII)','Hírcio (VIII)'],'tokensByBook':totals,'verbTokens':sum(v['count'] for v in rows),'lemmaCount':len(rows),'source':'https://github.com/CIRCSE/LASLA','license':'CC BY-NC-SA 4.0','sources':sources,'method':'Tokens com UPOS VERB ou AUX, incluindo particípios, infinitivos, gerúndios, gerundivos e supinos anotados como verbos. Agrupamento por lema LASLA; homógrafos com o mesmo lema são reunidos. Grafia u/v preservada na base.'},'verbs':rows}
(ROOT/'dist/verbs.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
(ROOT/'dist/data.js').write_text('window.GALLICO_DATA='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
with (ROOT/'dist/verbos.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['posição','lema','infinitivo','português','ocorrências']+[f'livro {b}' for b in range(1,9)])
 for i,v in enumerate(rows,1):w.writerow([i,v['lemma'],v['infinitive'],v['translation'],v['count'],*v['books']])
print(f"{len(rows)} lemas, {result['meta']['verbTokens']} ocorrências verbais, {sum(totals)} tokens totais")
