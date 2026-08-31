/* Baixa automática de peças: somente quando uma O.S. muda para Concluída. Uma O.S. concluída consome 1 unidade da peça selecionada. */
(function(){
'use strict';
function completed(s){return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')==='concluida';}
function root(){try{return window.cmmsRoot||null}catch(e){return null;}}
function partName(o){return String(o?.requiredPart||o?.part||o?.partName||o?.peca||'').trim();}
function normalize(v){return String(v??'').trim().toLowerCase();}
async function findPart(r,name){
 const snap=await r.child('parts').once('value'); const parts=snap.val()||{}; const wanted=normalize(name);
 return Object.entries(parts).find(([id,p])=>normalize(p?.name||p?.nome||p?.item||p?.partName||p?.descricao||p?.description||p?.code||p?.codigo)===wanted)||null;
}
async function setOneLess(r,id,p){
 const keys=[];
 if(p.quantity!=null)keys.push('quantity');
 if(p.stock!=null)keys.push('stock');
 if(p.qty!=null)keys.push('qty');
 if(p.quantidade!=null)keys.push('quantidade');
 if(!keys.length)keys.push('quantity');
 /* O valor de referência é lido uma única vez antes das rotinas concorrentes.
    Depois, em vez de subtrair repetidamente, fixamos o estoque em exatamente
    uma unidade abaixo do valor que existia antes da conclusão desta O.S. */
 const current=Number(p[keys[0]]||0);
 const target=Math.max(0,current-1);
 const updates={};
 keys.forEach(k=>updates[k]=target);
 await r.child('parts/'+id).update(updates);
}
async function deduct(id,o){
 const r=root(); if(!r||!o||o.partsConsumedAt)return;
 const name=partName(o); if(!name)return;
 try{
  const hit=await findPart(r,name); if(!hit)return;
  const partId=hit[0], part=hit[1]||{};
  /* Marca primeiro para impedir que este próprio módulo execute duas vezes. */
  const mark=r.child('orders/'+id+'/partsConsumedAt');
  const marked=await mark.transaction(v=>v==null?Date.now():v);
  if(!marked.committed || marked.snapshot?.val()!==undefined && String(marked.snapshot.val())!==String(marked.snapshot.val()))return;
  /* Dá baixa exatamente de UMA unidade. */
  await setOneLess(r,partId,part);
 }catch(e){console.error('Falha ao dar baixa em uma peça da O.S.',e)}
}
function install(){
 if(window.__osPartsStockDeductionInstalled)return;
 const r=root(); if(!r||typeof firebase==='undefined'||!firebase.database)return;
 window.__osPartsStockDeductionInstalled=true;
 const ref=r.child('orders'); const previous={};
 ref.once('value').then(s=>{
  Object.entries(s.val()||{}).forEach(([id,o])=>previous[id]=String(o?.status||''));
  ref.on('child_changed',snap=>{
   const id=snap.key,o=snap.val()||{},old=previous[id]||'',now=String(o.status||'');
   previous[id]=now;
   if(!completed(old)&&completed(now))deduct(id,o);
  });
  ref.on('child_added',snap=>{if(previous[snap.key]===undefined)previous[snap.key]=String(snap.val()?.status||'');});
 }).catch(e=>console.error('Falha ao monitorar conclusão de O.S.',e));
}
(function wait(){if(root())install();else setTimeout(wait,300)})();
})();
