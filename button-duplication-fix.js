/* Correção isolada: garante exatamente um botão de remoção por card, sem alterar as demais funções. */
(function(){
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const label=(kind)=>kind==='asset'?/remover\s+ativo/i:/remover\s+peça/i;
const getDb=()=>{try{return window.firebase&&firebase.apps&&firebase.apps.length?firebase.database():null}catch(e){return null}};
const getData=(kind)=>{
  try{
    const s=window.cmmsState||{};
    const local=kind==='asset'?s.equipments:s.parts;
    if(local&&Object.keys(local).length)return local;
  }catch(e){}
  return null;
};
const remove=(kind,id,name)=>{
  const db=getDb();
  if(!db){alert('Firebase ainda não está disponível.');return}
  const text=kind==='asset'?'Remover o ativo "'+name+'" do cadastro?\n\nEsta ação não pode ser desfeita.':'Remover a peça "'+name+'" do almoxarifado?\n\nEsta ação não pode ser desfeita.';
  if(!confirm(text))return;
  const path=kind==='asset'?'equipments/':'parts/';
  db.ref('workshopCMMS/'+path+id).remove().then(()=>alert(kind==='asset'?'Ativo removido com sucesso.':'Peça removida com sucesso.')).catch(e=>{console.error(e);alert('Não foi possível remover o registro do Firebase.')});
};
const addButton=(card,kind,id,name,after)=>{
  const b=document.createElement('button');
  b.type='button';b.dataset.cmmsRemoveButton=kind;
  b.style.cssText='width:100%;padding:9px 12px;margin-top:12px;border-radius:10px;background:rgba(220,38,38,.14);border:1px solid rgba(239,68,68,.35);color:#fca5a5;font-size:12px;font-weight:800;cursor:pointer';
  b.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>'+(kind==='asset'?'Remover Ativo':'Remover Peça');
  b.onclick=e=>{e.preventDefault();e.stopPropagation();remove(kind,id,name)};
  if(after&&after.parentElement===card)after.insertAdjacentElement('afterend',b);else card.appendChild(b);
};
function fix(kind,listId,data){
 const list=document.getElementById(listId);if(!list)return;
 const entries=Object.entries(data||{});if(!entries.length)return;
 const cards=[...list.children].filter(x=>x&&x.nodeType===1);
 cards.forEach((card,index)=>{
   const matches=[...card.querySelectorAll('button')].filter(b=>label(kind).test(clean(b.textContent)));
   if(matches.length>1)matches.slice(1).forEach(b=>b.remove());
   if(matches.length)return;
   const entry=entries[index];if(!entry)return;
   const id=entry[0],obj=entry[1]||{};
   const name=String(obj.name||obj.nome||obj.partName||obj.descricao||obj.description||obj.codigo||obj.code||id);
   if(kind==='asset'){
     const hor=[...card.querySelectorAll('button')].find(b=>/aumentar\s+hor[ií]metro/i.test(clean(b.textContent)));
     addButton(card,kind,id,name,hor||null);
   }else{
     const buy=[...card.querySelectorAll('button')].find(b=>/comprar\s+peça/i.test(clean(b.textContent)));
     addButton(card,kind,id,name,buy||null);
   }
 });
}
function scan(){
 fix('asset','equipmentList',getData('asset')||{});
 fix('part','partsList',getData('part')||{});
}
function start(){
 scan();
 const observer=new MutationObserver(()=>{if(window.__cmmsButtonFixTimer)return;window.__cmmsButtonFixTimer=setTimeout(()=>{window.__cmmsButtonFixTimer=0;scan()},50)});
 observer.observe(document.body,{childList:true,subtree:true});
 [100,300,600,1000,1500,2500,4000,7000,10000,15000].forEach(ms=>setTimeout(scan,ms));
 const db=getDb();
 if(db){db.ref('workshopCMMS/equipments').on('value',scan);db.ref('workshopCMMS/parts').on('value',scan)}
 else setTimeout(start,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
