/* Gerenciamento de dados - remoção de ativos e histórico */
(function(){
'use strict';
function root(){return window.cmmsRoot||null;}
function state(){return window.cmmsState||{};}
function getRoot(){
  try{if(window.firebase&&firebase.apps&&firebase.apps.length)return firebase.database().ref('workshopCMMS');}catch(e){}
  return root()||window.__firebaseRoot||null;
}
function confirmDelete(m){return window.confirm(m+'\n\nEsta ação não pode ser desfeita.');}
async function removeAsset(id,name){const r=getRoot();if(!r){alert('Firebase ainda não está disponível.');return;}if(!confirmDelete('Remover o ativo "'+name+'" do cadastro?'))return;try{await r.child('equipments/'+id).remove();alert('Ativo removido com sucesso.');}catch(e){console.error('removeAsset',e);alert('Não foi possível remover o ativo.');}}
async function clearHistory(){
  const r=getRoot();
  if(!r){alert('Firebase ainda não está disponível.');return false;}
  if(!confirmDelete('Limpar todo o histórico de O.S.?'))return false;
  try{
    await r.child('history').remove();
    if(window.cmmsState)window.cmmsState.history={};
    const list=document.getElementById('historyList');if(list)list.innerHTML='';
    const done=document.getElementById('kpiDone');if(done)done.textContent='0';
    alert('Histórico de O.S. apagado com sucesso.');
    return true;
  }catch(e){console.error('clearHistory',e);alert('Não foi possível apagar o histórico no Firebase. Verifique sua conexão e tente novamente.');return false;}
}
function text(el){return(el&&el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();}
function findExportButtons(){return[...document.querySelectorAll('button')].filter(b=>/exportar\s+(excel|planilha)/i.test(text(b)));}
function cleanHistoryUI(){
 const buttons=findExportButtons();
 if(buttons.length>1){const keep=buttons.find(b=>b.id==='exportExcelBtn')||buttons.find(b=>b.id==='exportXlsxBtn')||buttons[0];buttons.forEach(b=>{if(b!==keep)b.remove();});}
 const exportBtn=document.getElementById('exportExcelBtn')||document.getElementById('exportXlsxBtn')||findExportButtons()[0];
 let btn=document.getElementById('clearHistoryBtn');
 if(!exportBtn)return false;
 if(!btn){btn=document.createElement('button');btn.id='clearHistoryBtn';btn.type='button';btn.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Excluir Histórico';}
 btn.className='bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-black shadow-lg transition';
 btn.style.cssText='margin-left:8px;cursor:pointer;';
 btn.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(btn.dataset.busy==='1')return;btn.dataset.busy='1';clearHistory().finally(()=>{btn.dataset.busy='0';});};
 if(btn.parentElement!==exportBtn.parentElement)exportBtn.parentElement.appendChild(btn);
 return true;
}
function getAssetEntries(){const raw=state().equipments||{};return Object.entries(raw);}
/* O botão "Remover Ativo" já é criado pelo aplicativo principal. Este módulo não injeta outro. */
function addAssetButtons(){return true;}
function scan(){cleanHistoryUI();addAssetButtons();}
function init(){scan();const observer=new MutationObserver(()=>{if(window.__dataMgmtFrame)return;window.__dataMgmtFrame=requestAnimationFrame(()=>{window.__dataMgmtFrame=0;scan();});});observer.observe(document.body,{childList:true,subtree:true});[100,300,600,1000,1800,3000].forEach(ms=>setTimeout(scan,ms));}
window.removeAsset=removeAsset;window.clearHistory=clearHistory;window.addAssetButtons=addAssetButtons;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
