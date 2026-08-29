/* Corrige somente a lista de peças da abertura de O.S. — otimizado para evitar travamento. */
(function(){
'use strict';
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

let partsRequest=null;

async function loadPartsIntoOS(){
  const select=document.getElementById('fPart');
  if(!select || typeof firebase==='undefined' || !firebase.database)return;

  /* Evita várias leituras simultâneas do mesmo caminho. */
  if(partsRequest){
    await partsRequest;
    return;
  }

  partsRequest=(async()=>{
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

      /* O formulário pode ter sido fechado enquanto o Firebase respondia. */
      const currentSelect=document.getElementById('fPart');
      if(!currentSelect)return;

      currentSelect.innerHTML='<option value="">Nenhuma Peça (R$ 0,00)</option>'+options;
      if(current && [...currentSelect.options].some(o=>o.value===current))currentSelect.value=current;
    }catch(err){
      console.error('Falha ao carregar peças do almoxarifado na O.S.',err);
    }finally{
      partsRequest=null;
    }
  })();

  await partsRequest;
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

/* Instala uma única vez. Não observa o DOM inteiro, pois alterar o select
   dispara MutationObserver e criava um ciclo infinito de leituras Firebase. */
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
