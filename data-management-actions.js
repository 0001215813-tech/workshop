/* Gerenciamento de dados - remoção de ativos */
(function(){
'use strict';

function root(){return window.cmmsRoot||null;}
function state(){return window.cmmsState||{};}
function confirmDelete(m){return window.confirm(m+'\n\nEsta ação não pode ser desfeita.');}

async function removeAsset(id,name){
 const r=root();
 if(!r){alert('Firebase ainda não está disponível.');return;}
 if(!confirmDelete('Remover o ativo "'+name+'" do cadastro?'))return;
 try{
   await r.child('equipments/'+id).remove();
   alert('Ativo removido com sucesso.');
 }catch(e){
   console.error('removeAsset',e);
   alert('Não foi possível remover o ativo.');
 }
}

async function clearHistory(){
 const r=root();
 if(!r){alert('Firebase ainda não está disponível.');return;}
 const s=state(),h=s.history||{},orders=s.orders||{};
 const hc=Object.keys(h).length,oc=Object.keys(orders).length;
 if(!hc&&!oc){alert('O histórico e as O.S. já estão vazios.');return;}
 if(!confirmDelete('Limpar todo o histórico de O.S.?\n\nHistórico: '+hc+' registro(s)\nO.S.: '+oc+' registro(s)'))return;
 try{
   await Promise.all([r.child('history').remove(),r.child('orders').remove()]);
   if(window.cmmsState){window.cmmsState.history={};window.cmmsState.orders={};}
   const ids=['osList','historyList'];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});
   ['kpiDone','kpiOpen'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0';});
   const cost=document.getElementById('kpiCost');if(cost)cost.textContent='R$ 0,00';
   const badge=document.getElementById('badge');if(badge)badge.textContent='0';
   alert('Histórico, O.S. e custos acumulados foram limpos com sucesso.');
 }catch(e){
   console.error('clearHistory',e);
   alert('Não foi possível limpar os dados do Firebase.');
 }
}

function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();}
function findExportButton(){return [...document.querySelectorAll('button')].find(b=>text(b).includes('exportar excel')||text(b).includes('exportar planilha'));}
function historyButton(){
 if(document.getElementById('clearHistoryBtn'))return true;
 const exportBtn=findExportButton();
 if(!exportBtn)return false;
 const btn=document.createElement('button');
 btn.id='clearHistoryBtn';btn.type='button';
 btn.className=exportBtn.className||'bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-xl font-black';
 btn.style.marginLeft='8px';
 btn.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Excluir Histórico';
 btn.onclick=clearHistory;
 if(exportBtn.parentElement)exportBtn.parentElement.appendChild(btn);
 return true;
}

function normalize(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ');}
function getAssetEntries(){
 const raw=state().equipments||{};
 return Object.entries(raw);
}

/*
 * O botão de remoção é criado independentemente da conexão momentânea do
 * Firebase. Isso evita que uma renderização dos cards aconteça antes de
 * root estar disponível e faça o botão desaparecer.
 */
function addAssetButtons(){
 const list=document.getElementById('equipmentList');
 if(!list)return false;

 const entries=getAssetEntries();
 if(!entries.length)return false;

 const cards=[...list.children].filter(c=>c&&c.nodeType===1);
 let changed=false;

 cards.forEach((card,index)=>{
   if(card.querySelector('[data-remove-asset]'))return;

   let entry=entries[index];
   if(!entry)return;

   const id=entry[0];
   const asset=entry[1]||{};
   const name=String(asset.name||asset.codigo||asset.code||id);

   const wrap=document.createElement('div');
   wrap.setAttribute('data-remove-asset-wrap','1');
   wrap.style.cssText='margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;';

   const btn=document.createElement('button');
   btn.type='button';
   btn.setAttribute('data-remove-asset','1');
   btn.style.cssText='width:100%;padding:9px 12px;border-radius:10px;background:rgba(220,38,38,.14);border:1px solid rgba(239,68,68,.35);color:#fca5a5;font-size:12px;font-weight:800;cursor:pointer;';
   btn.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>Remover Ativo';
   btn.addEventListener('mouseenter',function(){btn.style.background='rgba(220,38,38,.8)';btn.style.color='#fff';});
   btn.addEventListener('mouseleave',function(){btn.style.background='rgba(220,38,38,.14)';btn.style.color='#fca5a5';});
   btn.addEventListener('click',function(ev){
     ev.preventDefault();
     ev.stopPropagation();
     removeAsset(id,name);
   });

   wrap.appendChild(btn);
   card.appendChild(wrap);
   changed=true;
 });

 return changed;
}

function scan(){
 historyButton();
 addAssetButtons();
}

function init(){
 scan();

 const observer=new MutationObserver(function(){
   if(window.__dataMgmtFrame)return;
   window.__dataMgmtFrame=requestAnimationFrame(function(){
     window.__dataMgmtFrame=0;
     scan();
   });
 });
 observer.observe(document.body,{childList:true,subtree:true});

 [100,300,600,1000,1800,3000,5000,8000,12000].forEach(ms=>setTimeout(scan,ms));
}

window.removeAsset=removeAsset;
window.clearHistory=clearHistory;
window.addAssetButtons=addAssetButtons;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
