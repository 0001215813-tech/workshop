/* Baixa automática de peças: somente quando uma O.S. muda para Concluída. Uma O.S. concluída consome 1 unidade da peça selecionada. */
(function(){
'use strict';
function completed(s){return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')==='concluida';}
function root(){try{return window.cmmsRoot||null}catch(e){return null;}}
async function deduct(id,o){
 const r=root(); if(!r||!o||o.partsConsumedAt)return;
 const name=String(o.requiredPart||o.part||o.partName||o.peca||'').trim(); if(!name)return;
 try{
  const snap=await r.child('parts').once('value'); const parts=snap.val()||{}; const wanted=name.toLowerCase();
  const hit=Object.entries(parts).find(([k,p])=>String((p||{}).name||(p||{}).nome||(p||{}).item||(p||{}).partName||(p||{}).descricao||(p||{}).description||(p||{}).code||(p||{}).codigo||'').trim().toLowerCase()===wanted);
  if(!hit)return;
  const p=hit[1]||{}; const key=p.quantity!=null?'quantity':p.stock!=null?'stock':p.qty!=null?'qty':p.quantidade!=null?'quantidade':'quantity';
  const stockRef=r.child('parts/'+hit[0]+'/'+key);
  const tx=await stockRef.transaction(v=>Math.max(0,Number(v||0)-1));
  if(!tx.committed)return;
  /* Mantém os campos espelhados iguais quando o cadastro possui mais de um campo de estoque. */
  const newQty=Math.max(0,Number(tx.snapshot?.val()||0));
  const updates={};
  if(p.quantity!=null)updates.quantity=newQty;
  if(p.stock!=null)updates.stock=newQty;
  if(p.qty!=null)updates.qty=newQty;
  if(p.quantidade!=null)updates.quantidade=newQty;
  if(Object.keys(updates).length>1)await r.child('parts/'+hit[0]).update(updates);
  await r.child('orders/'+id+'/partsConsumedAt').set(Date.now());
 }catch(e){console.error('Falha ao dar baixa em uma peça da O.S.',e)}
}
function install(){
 if(window.__osPartsStockDeductionInstalled)return;
 const r=root(); if(!r||typeof firebase==='undefined'||!firebase.database)return;
 window.__osPartsStockDeductionInstalled=true; const ref=r.child('orders'); const previous={};
 ref.once('value').then(s=>{
  Object.entries(s.val()||{}).forEach(([id,o])=>previous[id]=String(o?.status||''));
  ref.on('child_changed',snap=>{const id=snap.key,o=snap.val()||{},old=previous[id]||'',now=String(o.status||'');previous[id]=now;if(!completed(old)&&completed(now))deduct(id,o);});
  ref.on('child_added',snap=>{if(previous[snap.key]===undefined)previous[snap.key]=String(snap.val()?.status||'');});
 }).catch(e=>console.error('Falha ao monitorar conclusão de O.S.',e));
}
(function wait(){if(root())install();else setTimeout(wait,300)})();
})();
