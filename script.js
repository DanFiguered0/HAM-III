'use strict';
(()=>{
const Q=window.QUESTIONS||[],byId=new Map(Q.map(q=>[q.id,q])),key='ham3-progress-v2',letters=['A','B','C','D','E'];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=id=>Number.isInteger(Number(id))&&byId.has(Number(id));
const freshSession=(mode='study',ids=null)=>({mode,answers:{},answerRevisions:{},flags:[],done:false,elapsed:0,...(ids?{ids}:{} )});
const fresh=()=>({version:3,bankSize:Q.length,original:freshSession(),reviews:[],active:'original',current:Q[0]?.id||1,paused:false,invalidated:[]});
function cleanSession(raw,scope,allowLegacy){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Tentativa inválida');
 if(!['study','exam'].includes(raw.mode)||typeof raw.done!=='boolean'||!Number.isSafeInteger(raw.elapsed)||raw.elapsed<0||raw.elapsed>315360000)throw Error('Metadados de tentativa inválidos');
 const ids=scope==='original'?Q.map(q=>q.id):raw.ids;
 if(!Array.isArray(ids)||!ids.length||ids.length>Q.length||new Set(ids).size!==ids.length||ids.some(id=>!validId(id)))throw Error('IDs de questões inválidos');
 if(!raw.answers||typeof raw.answers!=='object'||Array.isArray(raw.answers)||!Array.isArray(raw.flags))throw Error('Respostas ou marcações inválidas');
 const validSet=new Set(ids),answers={},answerRevisions={},invalidated=[];
 const revs=raw.answerRevisions&&typeof raw.answerRevisions==='object'?raw.answerRevisions:{};
 for(const [id,value] of Object.entries(raw.answers)){
  if(!validId(id)||!validSet.has(Number(id))||!letters.includes(value))throw Error('Resposta incompatível: '+id);
  const revision=revs[id];
  if(revision!==undefined&&typeof revision!=='string')throw Error('Versão de questão inválida');
  if(!revision&&!allowLegacy)throw Error('Identificador de revisão ausente: '+id);
  // Existing v2 progress has no fingerprints. The six substantially changed questions must be reanswered.
  if(revision&&revision!==byId.get(Number(id)).revisao || !revision&&allowLegacy&&[36,44,47,72,88,89].includes(Number(id))){invalidated.push(Number(id));continue}
  answers[id]=value;answerRevisions[id]=byId.get(Number(id)).revisao;
 }
 if(raw.flags.some(id=>!validSet.has(id))||new Set(raw.flags).size!==raw.flags.length)throw Error('Marcações inválidas');
 return {session:{mode:raw.mode,answers,answerRevisions,flags:[...raw.flags],done:raw.done,elapsed:raw.elapsed,...(scope==='review'?{ids:[...ids]}:{})},invalidated};
}
function validate(raw,allowLegacy=false){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||![2,3].includes(raw.version))throw Error('Versão de backup incompatível');
 if(raw.bankSize!==Q.length)throw Error('Quantidade de questões incompatível');
 if(!Array.isArray(raw.reviews)||raw.reviews.length>50)throw Error('Histórico de revisões inválido');
 if(typeof raw.active!=='string'||!validId(raw.current)||typeof raw.paused!=='boolean')throw Error('Navegação inválida');
 const orig=cleanSession(raw.original,'original',raw.version===2),reviews=[],invalidated=[...orig.invalidated];
 for(const r of raw.reviews){const out=cleanSession(r,'review',raw.version===2);reviews.push(out.session);invalidated.push(...out.invalidated)}
 if(raw.active!=='original'&&!/^review\d+$/.test(raw.active))throw Error('Tentativa ativa inválida');
 if(raw.active!=='original'&&Number(raw.active.slice(6))>=reviews.length)throw Error('Índice de revisão inválido');
 const activeIds=raw.active==='original'?Q.map(q=>q.id):reviews[Number(raw.active.slice(6))].ids;
 return {version:3,bankSize:Q.length,original:orig.session,reviews,active:raw.active,current:activeIds.includes(raw.current)?raw.current:activeIds[0],paused:raw.paused,invalidated:[...new Set([...(Array.isArray(raw.invalidated)?raw.invalidated.filter(validId):[]),...invalidated])]};
}
let state;let startupNotice='';
try{const raw=localStorage.getItem(key);state=raw?validate(JSON.parse(raw),true):fresh();if(state.invalidated.length)startupNotice=`${state.invalidated.length} resposta(s) invalidada(s) após revisão do conteúdo das questões: ${state.invalidated.join(', ')}.`}
catch(e){state=fresh();startupNotice='Progresso anterior inválido; preservado no armazenamento para recuperação manual. '+e.message}
const session=()=>state.active==='original'?state.original:state.reviews[Number(state.active.slice(6))];
const ids=()=>state.active==='original'?Q.map(q=>q.id):session().ids;
const find=id=>byId.get(Number(id));
const revealed=()=>session().mode==='study'||session().done;
const examHidden=()=>session().mode==='exam'&&!session().done;
const stats=()=>{const s=session(),entries=Object.entries(s.answers);const hit=entries.filter(([id,a])=>find(id)?.correta===a).length;return {done:entries.length,hit,wrong:entries.length-hit}};
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch(e){$('notice').textContent='Falha ao salvar: '+e.message}}
function safeFilter(){if(examHidden()&&['correct','wrong'].includes($('filter').value))$('filter').value='all';for(const o of $('filter').options){if(['correct','wrong'].includes(o.value))o.disabled=examHidden()}}
function visible(){safeFilter();const s=session(),f=$('filter').value,topic=$('topic').value,diff=$('difficulty').value;return ids().filter(id=>{const q=find(id),a=s.answers[id],flag=s.flags.includes(id);return (!topic||q.tema===topic)&&(!diff||q.dificuldade===diff)&&(f==='all'||f==='pending'&&!a||f==='answered'&&!!a||f==='correct'&&!examHidden()&&a===q.correta||f==='wrong'&&!examHidden()&&a&&a!==q.correta||f==='flagged'&&flag)})}
function render(){const s=session(),c=stats(),v=visible(),hidden=examHidden();$('total').textContent=ids().length;$('answered').textContent=c.done;$('hits').textContent=hidden?'—':c.hit;$('misses').textContent=hidden?'—':c.wrong;$('rate').textContent=hidden?'—':c.done?Math.round(c.hit/c.done*100)+'%':'0%';$('bar').style.width=(100*c.done/ids().length||0)+'%';$('mode').value=s.mode;$('mode').disabled=c.done>0||s.done;$('finish').disabled=s.done;$('retry').disabled=state.active!=='original'||!state.original.done||!Object.entries(state.original.answers).some(([id,a])=>find(id).correta!==a);$('original').disabled=state.active==='original';$('notice').textContent=(state.active==='original'?'Tentativa original':`Revisão ${Number(state.active.slice(6))+1} — histórico original preservado`)+(startupNotice?' • '+startupNotice:'');
$('nav').innerHTML=v.map(id=>{const a=s.answers[id],q=find(id),cl=(id===state.current?'active ':'')+(s.flags.includes(id)?'flag ':'')+(a&&!hidden?(a===q.correta?'correct':'wrong'):'');return `<button data-id="${id}" class="${cl}" aria-label="Questão ${id}">${id}</button>`}).join('');
$('nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.current=Number(b.dataset.id);save();render()});
const rows={};ids().forEach(id=>{const q=find(id),r=rows[q.tema]||(rows[q.tema]={n:0,h:0,a:0});r.n++;if(s.answers[id]){r.a++;if(s.answers[id]===q.correta)r.h++}});$('topics').innerHTML=Object.entries(rows).map(([t,r])=>`<p>${esc(t)}<br><strong>${r.a}/${r.n}</strong> respondidas${hidden?'':` • ${r.h} acertos`}</p>`).join('');
if(!v.length){$('question').innerHTML='<h2>Nenhuma questão corresponde aos filtros.</h2>';return}if(!v.includes(state.current))state.current=v[0];const q=find(state.current),a=s.answers[q.id],show=!!a&&!hidden;
const options=letters.map(l=>{const cls=show?(l===q.correta?'correct':l===a?'wrong':''):'';return `<button class="option ${cls}" data-letter="${l}" ${a||s.done?'disabled':''}><strong>${l})</strong> ${esc(q.alternativas[l])}</button>`}).join('');
let feedback='';
if(show){
 const correct=a===q.correta;
 const heading=correct?'Resposta correta!':'Resposta incorreta! Entenda por que você errou.';
 const chosenTitle=correct?'Por que sua resposta está correta':'Por que a alternativa escolhida está incorreta';
 const chosenBlock=`<section class="feedback-primary ${correct?'feedback-success':'feedback-error'}" aria-label="Justificativa da sua resposta"><h4>${chosenTitle} — ${a}</h4><p>${esc(q.justificativas[a])}</p></section>`;
 const rightBlock=correct?'':`<section class="feedback-primary feedback-success"><h4>Resposta correta: ${q.correta}</h4><p><strong>${esc(q.alternativas[q.correta])}</strong></p><p>${esc(q.justificativas[q.correta])}</p></section>`;
 const others=letters.filter(l=>l!==a&&l!==q.correta).map(l=>`<div class="feedback-alternative"><h5>${l}) ${esc(q.alternativas[l])}</h5><p>${esc(q.justificativas[l])}</p></div>`).join('');
 feedback=`<div class="feedback" role="status" aria-live="polite"><h3 class="${correct?'feedback-status-good':'feedback-status-bad'}">${heading}</h3>${chosenBlock}${rightBlock}<section><h4>Raciocínio clínico e achados decisivos</h4><p>${esc(q.raciocinio)}</p></section><details class="feedback-other"><summary>Consultar justificativas das demais alternativas</summary>${others}</details><section class="feedback-essential"><h4>Conceito essencial para revisão</h4><p>${esc(q.conceito_essencial)}</p></section><p class="muted"><strong>Referência:</strong> ${esc(q.referencia)}</p></div>`;
}else if(a){
 feedback='<p class="result">Resposta registrada. Correção somente após finalizar a prova.</p>';
}else if(s.done){
 feedback=`<div class="feedback"><h3>Questão não respondida</h3><section class="feedback-primary feedback-success"><h4>Gabarito: ${q.correta}</h4><p>${esc(q.justificativas[q.correta])}</p></section><details><summary>Consultar justificativas de todas as alternativas</summary>${letters.filter(l=>l!==q.correta).map(l=>`<p><strong>${l}) ${esc(q.alternativas[l])}</strong> ${esc(q.justificativas[l])}</p>`).join('')}</details><h4>Raciocínio clínico</h4><p>${esc(q.raciocinio)}</p><h4>Conceito essencial</h4><p>${esc(q.conceito_essencial)}</p><p class="muted"><strong>Referência:</strong> ${esc(q.referencia)}</p></div>`;
}
const idx=v.indexOf(q.id);$('question').innerHTML=`<div class="meta">Questão ${q.id} • ${esc(q.area)} • ${esc(q.tema)} • ${esc(q.dificuldade)}</div><h2>Questão ${q.id}</h2><div class="case">${esc(q.caso)}</div><p><strong>${esc(q.pergunta)}</strong></p><div>${options}</div>${feedback}<div class="footnav"><button id="prev" ${idx===0?'disabled':''}>← Anterior</button><button id="next" ${idx===v.length-1?'disabled':''}>Próxima →</button><button id="flag">${s.flags.includes(q.id)?'★ Remover marcação':'☆ Marcar para revisão'}</button></div>`;
$('question').querySelectorAll('.option').forEach(b=>b.onclick=()=>{if(s.answers[q.id]||s.done)return;s.answers[q.id]=b.dataset.letter;s.answerRevisions[q.id]=q.revisao;save();render()});$('prev').onclick=()=>{state.current=v[idx-1];save();render()};$('next').onclick=()=>{state.current=v[idx+1];save();render()};$('flag').onclick=()=>{s.flags=s.flags.includes(q.id)?s.flags.filter(x=>x!==q.id):[...s.flags,q.id];save();render()};save()}
function setFilters(){const t=[...new Set(Q.map(q=>q.tema))].sort();$('topic').innerHTML='<option value="">Todos</option>'+t.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}
$('filter').onchange=render;$('topic').onchange=render;$('difficulty').onchange=render;
$('mode').onchange=()=>{if(stats().done||session().done){render();return}session().mode=$('mode').value;save();render()};
$('finish').onclick=()=>{if(session().done)return;if(!confirm('Finalizar definitivamente esta tentativa? Questões em branco ficarão bloqueadas.'))return;session().done=true;save();render()};
$('retry').onclick=()=>{if(!state.original.done)return;const wrong=Object.entries(state.original.answers).filter(([id,a])=>find(id).correta!==a).map(([id])=>Number(id));if(!wrong.length)return;state.reviews.push(freshSession('study',wrong));state.active='review'+(state.reviews.length-1);state.current=wrong[0];$('filter').value='all';$('topic').value='';$('difficulty').value='';save();render()};
$('original').onclick=()=>{state.active='original';state.current=Q[0].id;save();render()};
$('reset').onclick=()=>{if(confirm('Apagar TODAS as tentativas e o histórico deste navegador?')){state=fresh();startupNotice='';save();render()}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({type:'ham3-progress',data:state},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='ham3-progresso.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
$('import').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(f.size>3_000_000)throw Error('Arquivo muito grande');const d=JSON.parse(await f.text());if(d.type!=='ham3-progress')throw Error('Tipo de backup inválido');const next=validate(d.data,true);if(!confirm('Substituir o progresso local pelo backup importado?'))return;state=next;startupNotice=next.invalidated.length?`${next.invalidated.length} resposta(s) invalidada(s) por alteração do conteúdo.`:'';save();render();alert('Progresso importado com sucesso.')}catch(e){alert('Importação rejeitada: '+e.message)}};
$('pause').onclick=()=>{state.paused=!state.paused;$('pause').textContent=state.paused?'Retomar tempo':'Pausar tempo';save()};
setInterval(()=>{if(!state.paused&&!session().done){session().elapsed++;if(session().elapsed%10===0)save()}const x=session().elapsed;$('clock').textContent=String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0')},1000);
$('pause').textContent=state.paused?'Retomar tempo':'Pausar tempo';setFilters();render();
})();
