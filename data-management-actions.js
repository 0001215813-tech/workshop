/* Gerenciamento de dados. Mantém as funções existentes e garante limpeza real do histórico/O.S. */
(function(){
'use strict';
const root=()=>window.cmmsRoot||null;
const state=()=>window.cmmsState||{};
const confirmDelete=m=>window.confirm(m+'\n\nEsta ação não pode ser desfeita.');

async function removeAsset(id,name){
 const r=root();
 if(!r){alert('Firebase ainda não está disponível.');return;}
 if(!confirmDelete(`Remover o ativo "${name}" do cadastro?`))return;
 try{
   await r.child('equipments/'+id).remove();
   alert('Ativo removido com sucesso.');
 }catch(e){console.error(e);alert('Não foi possível remover o ativo.');}
}

async function clearHistory(){
 const r=root();
 if(!r){alert('Firebase ainda não está disponível.');return;}
 const s=state();
 const h=s.history||{};
 const orders=s.orders||{};
 const historyCount=Object.keys(h).length;
 const ordersCount=Object.keys(orders).length;
 if(!historyCount&&!ordersCount){alert('O histórico e as O.S. já estão vazios.');return;}
 if(!confirmDelete(`Limpar todo o histórico de O.S.?\n\nHistórico: ${historyCount} registro(s)\nO.S.: ${ordersCount} registro(s)\n\nIsso deixará o histórico, a lista de O.S. e o custo acumulado zerados.`))return;
 try{
   await Promise.all([r.child('history').remove(),r.child('orders').remove()]);
   if(window.cmmsState){window.cmmsState.history={};window.cmmsState.orders={};}
   if(typeof window.__cmmsRender==='function')window.__cmmsRender();
   if(typeof window.cmmsRender==='function')window.cmmsRender();
   const osList=document.getElementById('osList');if(osList)osList.innerHTML='';
   const historyList=document.getElementById('historyList');if(historyList)historyList.innerHTML='';
   const kpiDone=document.getElementById('kpiDone');if(kpiDone)kpiDone.textContent='0';
   const kpiOpen=document.getElementById('kpiOpen');if(kpiOpen)kpiOpen.textContent='0';
   const kpiCost=document.getElementById('kpiCost');if(kpiCost)kpiCost.textContent='R$ 0,00';
   const badge=document.getElementById('badge');if(badge)badge.textContent='0';
   alert('Histórico, O.S. e custos acumulados foram limpos com sucesso.');
 }catch(e){console.error('clearHistory',e);alert('Não foi possível limpar os dados do Firebase.');}
}

function text(el){return (el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();}
function findHeading(words){
 return [...document.querySelectorAll('h1,h2,h3,h4,.text-2xl,.text-xl')].find(e=>words.some(w=>text(e).includes(w)));
}
function historyButton(){
 if(document.getElementById('clearHistoryBtn'))return true;
 const heading=findHeading(['histórico & relatórios','histórico de manutenções','histórico']);
 if(!heading)return false;
 const scope=heading.closest('section,main,div')||document.body;
 const exportBtn=[...scope.querySelectorAll('button')].find(b=>text(b).includes('exportar excel')||text(b).includes('exportar planilha'))||[...document.querySelectorAll('button')].find(b=>text(b).includes('exportar excel'));
 if(!exportBtn)return false;
 const btn=document.createElement('button');
 btn.id='clearHistoryBtn';btn.type='button';
 btn.className=exportBtn.className||'bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-xl font-black';
 btn.style.marginLeft='8px';
 btn.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Excluir Histórico';
 btn.onclick=clearHistory;
 exportBtn.parentElement.appendChild(btn);
 return true;
}

function equipmentList(){return document.getElementById('equipmentList');}
function addAssetButtons(){
 const list=equipmentList();
 if(!list)return false;
 const entries=Object.entries(state().equipments||{});
 if(!entries.length)return false;
 const cards=[...list.children].filter(e=>e.nodeType===1);
 let changed=false;
 cards.forEach((card,i)=>{
   if(card.querySelector('[data-remove-asset]'))return;
   const entry=entries[i];
   if(!entry)return;
   const [id,a]=entry;
   const wrap=document.createElement('div');
   wrap.setAttribute('data-remove-asset-wrap','1');
   wrap.className='mt-3 pt-3 border-t border-slate-800';
   const btn=document.createElement('button');
   btn.type='button';btn.setAttribute('data-remove-asset','1');
   btn.className='w-full bg-red-600/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl px-3 py-2 text-xs font-black transition';
   btn.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Remover Ativo';
   btn.onclick=()=>removeAsset(id,String(a.name||a.codigo||a.code||id));
   wrap.appendChild(btn);card.appendChild(wrap);changed=true;
 });
 return changed;
}
function scan(){historyButton();addAssetButtons();}
function init(){
 scan();
 const observer=new MutationObserver(()=>{
   if(!window.__dataMgmtFrame){
     window.__dataMgmtFrame=requestAnimationFrame(()=>{window.__dataMgmtFrame=0;scan();});
   }
 });
 observer.observe(document.body,{childList:true,subtree:true});
 [100,250,500,1000,1800,3000,5000].forEach(ms=>setTimeout(scan,ms));
}
window.removeAsset=removeAsset;window.clearHistory=clearHistory;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();