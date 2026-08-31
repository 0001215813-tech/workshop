/* Correção isolada: garante exatamente um botão de remoção por card. Não altera outras funções. */
(function(){
'use strict';
function state(){return window.cmmsState||{}}
function cleanText(v){return String(v||'').replace(/\s+/g,' ').trim()}
function findEntry(list,index){const es=Object.entries(list||{});return es[index]||null}
function makeButton(kind,id,name){
 const b=document.createElement('button');
 b.type='button';
 b.dataset.cmmsRemoveButton=kind;
 b.style.cssText='width:100%;padding:9px 12px;margin-top:12px;border-radius:10px;background:rgba(220,38,38,.14);border:1px solid rgba(239,68,68,.35);color:#fca5a5;font-size:12px;font-weight:800;cursor:pointer';
 const label=kind==='asset'?'Remover Ativo':'Remover Peça';
 b.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>'+label;
 b.onclick=function(e){
  e.preventDefault();e.stopPropagation();
  if(kind==='asset'&&typeof window.removeAsset==='function') return window.removeAsset(id,name);
  if(kind==='part'&&typeof window.removeInventoryPart==='function') return window.removeInventoryPart(id,name);
  if(kind==='part'&&typeof window.removePart==='function') return window.removePart(id,name);
 };
 return b;
}
function fixList(listId,kind,data){
 const list=document.getElementById(listId); if(!list)return;
 const cards=[...list.children].filter(x=>x&&x.nodeType===1);
 cards.forEach((card,index)=>{
  const all=[...card.querySelectorAll('button')];
  const label=kind==='asset'?/remover\s+ativo/i:/remover\s+peça/i;
  const matches=all.filter(b=>label.test(cleanText(b.textContent)));
  if(matches.length>1){matches.slice(1).forEach(b=>b.remove())}
  if(matches.length>=1)return;
  const entry=findEntry(data,index); if(!entry)return;
  const id=entry[0],obj=entry[1]||{};
  const name=String(obj.name||obj.nome||obj.codigo||obj.code||obj.partName||obj.descricao||id);
  const b=makeButton(kind,id,name);
  if(kind==='asset'){
   const hor=[...card.querySelectorAll('button')].find(x=>/aumentar\s+hor[ií]metro/i.test(cleanText(x.textContent)));
   if(hor) card.insertBefore(b,hor); else card.appendChild(b);
  }else{
   const buy=[...card.querySelectorAll('button')].find(x=>/comprar\s+peça/i.test(cleanText(x.textContent)));
   if(buy&&buy.parentElement===card) card.insertBefore(b,buy.nextSibling); else card.appendChild(b);
  }
 });
}
function scan(){
 const s=state();
 fixList('equipmentList','asset',s.equipments||{});
 fixList('partsList','part',s.parts||{});
}
function init(){
 scan();
 const obs=new MutationObserver(()=>{
  if(window.__cmmsButtonFixFrame)return;
  window.__cmmsButtonFixFrame=requestAnimationFrame(()=>{window.__cmmsButtonFixFrame=0;scan()});
 });
 obs.observe(document.body,{childList:true,subtree:true});
 [100,300,600,1000,1500,2500,4000,7000].forEach(ms=>setTimeout(scan,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
