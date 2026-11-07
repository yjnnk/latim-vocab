"""Independent checks on published counts, source integrity, and glossary coverage."""
import json,hashlib
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'dist/verbs.json').read_text()); rows=data['verbs']; manifest=json.loads((ROOT/'data/sources.json').read_text())
assert len(rows)==len({v['lemma'] for v in rows})==1045
assert all(v['translation'] and v['infinitive'] for v in rows)
assert [v['count'] for v in rows]==sorted([v['count'] for v in rows],reverse=True)
counts=Counter(); total=0; bookcounts=[0]*8
for entry in manifest['files']:
 p=ROOT/entry['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256']
 for line in p.read_text().splitlines():
  a=line.split('\t')
  if len(a)>12 and a[0].isdigit() and a[3] in ('VERB','AUX'):
   counts[a[2]]+=1;total+=1;bookcounts[entry['book']-1]+=1
for v in rows:
 assert counts[v['lemma']]==v['count']==sum(v['books'])==sum(f['count'] for f in v['forms'])
 assert len(v['books'])==8
assert total==data['meta']['verbTokens']==12155
assert [sum(v['books'][i] for v in rows) for i in range(8)]==bookcounts
inf={v['lemma']:v['infinitive'] for v in rows}
assert all(inf[k]==v for k,v in {'sum':'esse','habeo':'habere','utor':'uti','proficiscor':'proficisci','patior':'pati','progredior':'progredi','uolo':'uelle','fero':'ferre','transeo':'transire','uereor':'uereri'}.items())
assert json.loads((ROOT/'dist/data.js').read_text()[20:-2])==data
print('OK: 1.045 traduções, 12.155 tokens, 8 livros, hashes, soma de formas e infinitivos selecionados.')
