/* Corrige somente a lista de peças da abertura de O.S. */
(function(){
'use strict';
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function loadPartsIntoOS(){
  const select=document.getElementById('fPart');
  if(!select || typeof firebase==='undefined' || !firebase.database)return;
  try{
    const snap=await firebase.database().ref('workshopCMMS/parts').once('value');
    const parts=snap.val()||{};
    const current=select.value;
    const options=Object.entries(parts).map(([id,p])=>{
      p=p||{};
      const name=p.name||p.nome||p.item||p.partName||p.descricao||p.description||p.code||p.codigo||id;
      const price=Number(p.cost??p.price??p.unitCost??0);
      return `<option value="${esc(name)}" data-cost="${price}">${esc(name)} (R$ ${price.toLocaleString('pt-BR',{minimumFractionDigits:2})})</option>`;
    }).join('');
    select.innerHTML='<option value="">Nenhuma Peça (R$ 0,00)</option>'+options;
    if(current && [...select.options].some(o=>o.value===current))select.value=current;
  }catch(err){console.error('Falha ao carregar peças do almoxarifado na O.S.',err);}
}
function install(){
  if(typeof window.newOS!=='function' || window.__osPartsSelectorWrapped)return;
  const original=window.newOS;
  const wrapped=async function(){
    const result=await original.apply(this,arguments);
    await loadPartsIntoOS();
    return result;
  };
  window.__osPartsSelectorWrapped=true;
  window.newOS=wrapped;
  document.querySelectorAll('[onclick="newOS()"], [onclick="newOS() "]').forEach(b=>b.onclick=wrapped);
}
function scan(){install();if(document.getElementById('fPart'))loadPartsIntoOS();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
[100,300,700,1500,3000,5000].forEach(ms=>setTimeout(scan,ms));
const observer=new MutationObserver(()=>{if(document.getElementById('fPart'))loadPartsIntoOS();});
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
