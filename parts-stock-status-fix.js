/* Status automático do estoque: 0 = sem estoque; abaixo do mínimo = repor estoque; mínimo ou acima = estoque ok. */
(function(){
'use strict';

function getDb(){
  try{return (typeof firebase!=='undefined' && firebase.database)?firebase.database():null}catch(e){return null}
}
function label(p,id){return String(p?.name||p?.nome||p?.partName||p?.descricao||p?.description||p?.code||p?.codigo||id||'Peça').trim().toLowerCase()}
function quantity(p){const n=Number(p?.quantity??p?.stock??p?.qty??p?.quantidade??0);return Number.isFinite(n)?n:0}
function minimum(p){const n=Number(p?.minStock??p?.min??p?.estoqueMinimo??0);return Number.isFinite(n)?n:0}
function status(p){const q=quantity(p),m=minimum(p);if(q===0)return {text:'Sem estoque',color:'#f87171',bg:'rgba(239,68,68,.12)'};if(q<m)return {text:'Repor estoque',color:'#fbbf24',bg:'rgba(245,158,11,.12)'};return {text:'Estoque OK',color:'#34d399',bg:'rgba(16,185,129,.12)'}}
function apply(parts){
 const list=document.getElementById('partsList');if(!list)return;
 const entries=Object.entries(parts||{});
 const cards=[...list.children].filter(x=>x&&x.nodeType===1);
 cards.forEach((card,i)=>{
   const text=(card.textContent||'').toLowerCase();
   const ent=entries.find(([id,p])=>{const n=label(p,id);const c=String(p?.code||p?.codigo||'').toLowerCase();return (n&&text.includes(n))||(c&&text.includes(c))})||entries[i];
   if(!ent)return;
   const st=status(ent[1]||{});
   let el=[...card.querySelectorAll('*')].find(x=>{
     if(x.children.length>0)return false;
     const t=(x.textContent||'').trim().toLowerCase();
     return t==='estoque ok'||t==='repor estoque'||t==='sem estoque';
   });
   if(!el){
     el=[...card.querySelectorAll('*')].find(x=>{if(x.children.length>0)return false;const t=(x.textContent||'').trim().toLowerCase();return t.includes('estoque ok')||t.includes('repor estoque')||t.includes('sem estoque')});
   }
   if(el){el.textContent='• '+st.text;el.style.color=st.color;el.style.backgroundColor='transparent';}
 });
}
async function read(){const d=getDb();if(!d)return;try{const snap=await d.ref('workshopCMMS/parts').once('value');apply(snap.val()||{})}catch(e){console.error('Status de estoque:',e)}}
function startRealtime(){const d=getDb();if(!d)return;const ref=d.ref('workshopCMMS/parts');ref.on('value',snap=>{window.__partsStockStatusData=snap.val()||{};apply(window.__partsStockStatusData)});read()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startRealtime);else startRealtime();
new MutationObserver(()=>{clearTimeout(window.__partsStockStatusTimer);window.__partsStockStatusTimer=setTimeout(()=>apply(window.__partsStockStatusData||{}),80)}).observe(document.body,{childList:true,subtree:true});
})();
