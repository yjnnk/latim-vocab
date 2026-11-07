'use strict';
const {verbs,meta}=window.GALLICO_DATA;
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('pt-BR');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/v/g,'u');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roman=['I','II','III','IV','V','VI','VII','VIII'];
const classes={v1:'1ª conjugação',v2:'2ª conjugação',v3:'3ª conjugação',v4:'4ª conjugação',v5:'3ª conj. em -io',v6:'irregular'};
const defective=new Set(['coepio','odi','memini','inquio','licet','oportet']);
let saved;
try{saved=new Set(JSON.parse(localStorage.getItem('gallico-favorites')||'[]'));}catch{saved=new Set();}
let page=1,onlyFavorites=false,results=[],ranked=[],pageSize=35;
const searchIndex=new Map(verbs.map(v=>[v.lemma,normalize([v.lemma,v.infinitive,v.translation,...v.forms.map(f=>f.form)].join(' '))]));
$('total-lemmas').textContent=fmt(meta.lemmaCount);$('total-count').textContent=fmt(meta.verbTokens);
function bookCount(v){const b=$('book').value;return b==='all'?v.count:b==='caesar'?v.books.slice(0,7).reduce((a,b)=>a+b,0):v.books[+b-1];}
function grammar(v){return defective.has(v.lemma)?'defectivo / impessoal':classes[v.class]||'verbo';}
function update(reset=true){
 if(reset)page=1;
 const query=normalize($('search').value.trim()),sort=$('sort').value;
 ranked=verbs.map(v=>({...v,selectedCount:bookCount(v)})).filter(v=>v.selectedCount>0).sort((a,b)=>b.selectedCount-a.selectedCount||a.lemma.localeCompare(b.lemma,'la')).map((v,i)=>({...v,rank:i+1}));
 results=ranked.filter(v=>(!query||searchIndex.get(v.lemma).includes(query))&&(!onlyFavorites||saved.has(v.lemma)));
 if(sort==='alpha')results.sort((a,b)=>a.lemma.localeCompare(b.lemma,'la'));if(sort==='rare')results.sort((a,b)=>a.selectedCount-b.selectedCount||a.lemma.localeCompare(b.lemma,'la'));
 const pages=Math.max(1,Math.ceil(results.length/pageSize));page=Math.min(page,pages);
 $('results-count').textContent=`${fmt(results.length)} ${results.length===1?'verbo encontrado':'verbos encontrados'} · ${fmt(results.reduce((s,v)=>s+v.selectedCount,0))} ocorrências`;
 $('reset').hidden=!query&&!onlyFavorites&&$('book').value==='all'&&sort==='frequency';
 $('favorite-count').textContent=saved.size;$('favorites').setAttribute('aria-pressed',String(onlyFavorites));
 const max=ranked[0]?.selectedCount||1;
 $('entries').innerHTML=results.slice((page-1)*pageSize,page*pageSize).map(v=>`<article class="entry"><span class="rank">${String(v.rank).padStart(2,'0')}</span><button class="entry-main" data-open="${escapeHTML(v.lemma)}" aria-label="Ver verbete de ${escapeHTML(v.lemma)}"><span class="entry-title"><span class="lemma" lang="la">${escapeHTML(v.lemma)}</span><span class="infinitive" lang="la">${escapeHTML(v.infinitive)}</span><span class="class-tag">${escapeHTML(grammar(v))}</span></span><span class="translation">${escapeHTML(v.translation)}</span></button><div class="frequency" aria-label="${v.selectedCount} ${v.selectedCount===1?'ocorrência':'ocorrências'}">${fmt(v.selectedCount)}<span class="freq-bar" aria-hidden="true"><i style="width:${Math.max(3,v.selectedCount/max*100)}%"></i></span></div><button class="star ${saved.has(v.lemma)?'saved':''}" data-save="${escapeHTML(v.lemma)}" aria-pressed="${saved.has(v.lemma)}" aria-label="${saved.has(v.lemma)?'Remover':'Adicionar'} ${escapeHTML(v.lemma)} ${saved.has(v.lemma)?'dos':'aos'} favoritos">${saved.has(v.lemma)?'★':'☆'}</button></article>`).join('');
 $('empty').hidden=results.length>0;$('previous').disabled=page<=1;$('next').disabled=page>=pages;$('page-info').textContent=`Página ${page} de ${pages}`;
 const total=ranked.reduce((s,v)=>s+v.selectedCount,0),coverage=total?ranked.slice(0,20).reduce((s,v)=>s+v.selectedCount,0)/total*100:0;
 $('coverage').textContent=coverage.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';$('coverage-bar').style.width=coverage+'%';$('coverage-scope').textContent=$('book').selectedOptions[0].textContent;
}
function reset(){ $('search').value='';$('book').value='all';$('sort').value='frequency';onlyFavorites=false;update();}
$('search').addEventListener('input',()=>update());$('book').addEventListener('change',()=>update());$('sort').addEventListener('change',()=>update());$('favorites').addEventListener('click',()=>{onlyFavorites=!onlyFavorites;update();});$('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
for(const [id,offset] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{page+=offset;update(false);$('vocabulary').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('entries').addEventListener('click',e=>{
 const favorite=e.target.closest('[data-save]');if(favorite){const key=favorite.dataset.save;saved.has(key)?saved.delete(key):saved.add(key);try{localStorage.setItem('gallico-favorites',JSON.stringify([...saved]));}catch{}update(false);return;}
 const entry=e.target.closest('[data-open]');if(entry)openEntry(entry.dataset.open);
});
function openEntry(lemma){
 const v=ranked.find(x=>x.lemma===lemma),b=$('book').value;
 const available=b==='all'?Object.keys(v.examples):b==='caesar'?Object.keys(v.examples).filter(n=>+n<=7):[b];const example=v.examples[available[0]];
 const max=Math.max(...v.books,1);
 const highlighted=example.text.split(' ').map(w=>normalize(w)===normalize(example.form)?`<mark>${escapeHTML(w)}</mark>`:escapeHTML(w)).join(' ');
 $('entry-content').innerHTML=`<div class="eyebrow">VERBETE · POSIÇÃO ${v.rank}</div><h2 id="entry-title" lang="la">${escapeHTML(v.lemma)} <span class="infinitive">${escapeHTML(v.infinitive)}</span></h2><div class="entry-meta">${escapeHTML(grammar(v))} · ${fmt(v.selectedCount)} ocorrências no corpus selecionado</div><p class="dialog-gloss">${escapeHTML(v.translation)}</p><h3>Distribuição nos oito livros</h3><div class="book-bars">${v.books.map((n,i)=>`<div class="book-bar" aria-label="Livro ${roman[i]}: ${n} ocorrências"><span>${n}</span><i style="height:${n/max*75}px"></i><b>${roman[i]}</b></div>`).join('')}</div><h3>Formas atestadas na obra completa · ${v.forms.length}</h3><div class="forms" lang="la">${v.forms.map(f=>`<span class="form-chip">${escapeHTML(f.form)}<small>${f.count}</small></span>`).join('')}</div><h3>Exemplo · ${escapeHTML(example.ref)}</h3><p class="example" lang="la">${highlighted}</p><p>Exemplo do livro ${roman[+available[0]-1]}, na transcrição LASLA/LiLa. Os números das formas acima se referem aos oito livros.</p><p><a href="https://logeion.uchicago.edu/${encodeURIComponent(lemma)}" target="_blank" rel="noreferrer">Consultar outros dicionários no Logeion ↗</a></p>`;
 $('entry-dialog').showModal();
}
for(const id of ['about-open','method-open'])$(id).addEventListener('click',()=>$('about-dialog').showModal());
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('search').focus();}});
$('export').addEventListener('click',()=>{
 const cell=s=>'"'+String(s).replace(/"/g,'""')+'"';
 const rows=[['posição no corpus','lema','infinitivo','português','ocorrências no filtro',...roman.map(x=>'livro '+x)],...results.map(v=>[v.rank,v.lemma,v.infinitive,v.translation,v.selectedCount,...v.books])];
 const blob=new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gallico-verbos-${$('book').value}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
update();
