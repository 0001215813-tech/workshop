/* Correção isolada: exibe no cartão a quantidade realmente salva em workshopCMMS/parts. */
(function(){
'use strict';
function getParts(){
  try{
    if(typeof firebase==='undefined'||!firebase.database)return Promise.resolve({});
    return firebase.database().ref('workshopCMMS/parts').once('value').then(s=>s.val()||{});
  }catch(e){return Promise.resolve({});}
}
function label(p,id){return String(p?.name||p?.nome||p?.partName||p?.descricao||p?.description||p?.code||p?.codigo||id||'Peça').trim().toLowerCase();}
function quantity(p){
  const v=p?.quantity??p?.stock??p?.qty??p?.quantidade??0;
  const n=Number(v);
  return Number.isFinite(n)?n:0;
}
function fixCards(parts){
  const list=document.getElementById('partsList');
  if(!list)return;
  const entries=Object.entries(parts);
  const cards=[...list.children].filter(x=>x&&x.nodeType===1);
  cards.forEach((card,i)=>{
    const text=(card.textContent||'').toLowerCase();
    let ent=entries.find(([id,p])=>{const n=label(p,id);return n&&text.includes(n)})||entries[i];
    if(!ent)return;
    const q=quantity(ent[1]||{});
    let candidates=[...card.querySelectorAll('*')].filter(el=>{
      if(el.closest('button'))return false;
      const t=(el.textContent||'').trim();
      return /^-?\d+(?:[.,]\d+)?$/.test(t);
    });
    candidates.sort((a,b)=>{
      const aa=(a.className||'').toString(),bb=(b.className||'').toString();
      return (bb.includes('text-3xl')?1:0)-(aa.includes('text-3xl')?1:0);
    });
    if(candidates[0] && candidates[0].textContent.trim()!==String(q))candidates[0].textContent=String(q);
  });
}
async function scan(){fixCards(await getParts());}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
new MutationObserver(()=>{clearTimeout(window.__pqTimer);window.__pqTimer=setTimeout(scan,100)}).observe(document.body,{childList:true,subtree:true});
setInterval(scan,1200);
})();
