/* Gerenciamento de dados - versão robusta */
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
 }catch(e){console.error('removeAsset',e);alert('Não foi possível remover o ativo.');}
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
 }catch(e){console.error('clearHistory',e);alert('Não foi possível limpar os dados do Firebase.');}
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

function addAssetButtons(){
 const list=document.getElementById('equipmentList');
 if(!list)return false;
 const entries=Object.entries(state().equipments||{});
 if(!entries.length)return false;
 const cards=[...list.children].filter(c=>c.nodeType===1);
 let changed=false;
 cards.forEach((card,index)=>{
   if(card.querySelector('[data-remove-asset]'))return;
   const entry=entries[index];
   if(!entry)return;
   const id=entry[0],a=entry[1]||{};
   const wrap=document.createElement('div');
   wrap.setAttribute('data-remove-asset-wrap','1');
   wrap.className='mt-3 pt-3 border-t border-slate-800';
   const btn=document.createElement('button');
   btn.type='button';btn.setAttribute('data-remove-asset','1');
   btn.className='w-full bg-red-600/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl px-3 py-2 text-xs font-black transition';
   btn.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Remover Ativo';
   btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();removeAsset(id,String(a.name||a.codigo||a.code||id));});
   wrap.appendChild(btn);card.appendChild(wrap);changed=true;
 });
 return changed;
}

function scan(){historyButton();addAssetButtons();}
function init(){
 scan();
 const observer=new MutationObserver(function(){
   if(window.__dataMgmtFrame)return;
   window.__dataMgmtFrame=requestAnimationFrame(function(){window.__dataMgmtFrame=0;scan();});
 });
 observer.observe(document.body,{childList:true,subtree:true});
 [100,300,600,1000,1800,3000,5000,8000].forEach(ms=>setTimeout(scan,ms));
}
window.removeAsset=removeAsset;
window.clearHistory=clearHistory;
window.addAssetButtons=addAssetButtons;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();