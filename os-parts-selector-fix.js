/* Corrige somente a lista de peças da abertura de O.S. */
(function(){
'use strict';
let loading=null;
function loadParts(){
 const select=document.getElementById('fPart');
 if(!select || typeof firebase==='undefined' || !firebase.database)return Promise.resolve();
 if(loading)return loading;
 loading=firebase.database().ref('workshopCMMS/parts').once('value').then(snap=>{
  const data=snap.val()||{}, current=select.value;
  const opts=Object.entries(data).map(([id,p])=>{
   p=p||{};
   const name=p.name||p.nome||p.item||p.partName||p.descricao||p.description||p.code||p.codigo||id;
   const price=Number(p.cost??p.price??p.unitCost??0);
   return {id,name,price};
  });
  if(!document.getElementById('fPart'))return;
  select.innerHTML='<option value="">Nenhuma Peça (R$ 0,00)</option>';
  opts.forEach(p=>{
   const o=document.createElement('option'); o.value=p.name; o.dataset.partId=p.id; o.dataset.cost=String(p.price);
   o.textContent=`${p.name} (R$ ${p.price.toLocaleString('pt-BR',{minimumFractionDigits:2})})`;
   select.appendChild(o);
  });
  if(current && [...select.options].some(o=>o.value===current))select.value=current;
 }).catch(e=>console.error('Falha ao carregar peças da O.S.',e)).finally(()=>loading=null);
 return loading;
}
function schedule(){
 let n=0;
 const t=setInterval(()=>{
  n++;
  if(document.getElementById('fPart')){clearInterval(t);loadParts();}
  if(n>=40)clearInterval(t);
 },100);
}
function install(){
 if(window.__osPartsFixInstalled)return;
 window.__osPartsFixInstalled=true;
 /* Acompanha apenas o modal, sem observar o DOM inteiro e sem criar loops. */
 const modal=document.getElementById('modal');
 if(modal)new MutationObserver(()=>{if(modal.classList.contains('open'))schedule()}).observe(modal,{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&(b.getAttribute('onclick')||'').includes('newOS'))schedule();},{passive:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
