/* Ações adicionais de gerenciamento de dados. Não altera as funções existentes. */
(function(){
  'use strict';
  const getRoot = () => window.cmmsRoot || null;
  const getState = () => window.cmmsState || {};
  function confirmDelete(message){ return window.confirm(message + '\n\nEsta ação não pode ser desfeita.'); }

  async function removeAsset(id, name){
    const root=getRoot();
    if(!root){alert('Firebase ainda não está disponível.');return;}
    if(!confirmDelete(`Remover o ativo "${name}" do cadastro?`))return;
    try{await root.child('equipments/'+id).remove();alert('Ativo removido com sucesso.');}
    catch(err){console.error('Erro ao remover ativo:',err);alert('Não foi possível remover o ativo.');}
  }

  async function clearHistory(){
    const root=getRoot();
    if(!root){alert('Firebase ainda não está disponível.');return;}
    const history=getState().history||{};
    const count=Object.keys(history).length;
    if(!count){alert('O histórico já está vazio.');return;}
    if(!confirmDelete(`Excluir todo o histórico de manutenção (${count} registro(s))?`))return;
    try{await root.child('history').remove();alert('Histórico excluído com sucesso.');}
    catch(err){console.error('Erro ao excluir histórico:',err);alert('Não foi possível excluir o histórico.');}
  }

  function addHistoryButton(){
    const section=document.getElementById('historico');
    if(!section||document.getElementById('clearHistoryBtn'))return;
    const exportBtn=document.getElementById('exportExcelBtn');
    if(!exportBtn)return;
    const btn=document.createElement('button');
    btn.id='clearHistoryBtn';btn.type='button';
    btn.className='bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-xl font-black ml-2';
    btn.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Excluir Histórico';
    btn.addEventListener('click',clearHistory);
    exportBtn.parentElement.appendChild(btn);
  }

  function addAssetButtons(){
    const list=document.getElementById('equipmentList');
    if(!list)return;
    const entries=Object.entries(getState().equipments||{});
    const cards=[...list.children].filter(c=>c.nodeType===1);
    cards.forEach((card,index)=>{
      if(card.querySelector('[data-remove-asset]'))return;
      const entry=entries[index];
      if(!entry)return;
      const [id,asset]=entry;
      const actions=document.createElement('div');
      actions.className='mt-4 pt-3 border-t border-slate-800 flex gap-2';
      const remove=document.createElement('button');
      remove.type='button';remove.setAttribute('data-remove-asset','1');
      remove.className='w-full bg-red-600/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl px-3 py-2 text-xs font-black transition';
      remove.innerHTML='<i class="fa-solid fa-trash mr-2"></i>Remover Ativo';
      remove.addEventListener('click',()=>removeAsset(id,String(asset.name||id)));
      actions.appendChild(remove);card.appendChild(actions);
    });
  }

  function schedule(){addHistoryButton();addAssetButtons();}
  function init(){
    schedule();
    const list=document.getElementById('equipmentList');
    if(list&&!list.dataset.dataManagementObserver){
      list.dataset.dataManagementObserver='1';
      new MutationObserver(()=>requestAnimationFrame(addAssetButtons)).observe(list,{childList:true,subtree:true});
    }
    const section=document.getElementById('historico');
    if(section&&!section.dataset.historyManagementObserver){
      section.dataset.historyManagementObserver='1';
      new MutationObserver(()=>requestAnimationFrame(addHistoryButton)).observe(section,{childList:true,subtree:true});
    }
    [300,800,1500,2500].forEach(ms=>setTimeout(schedule,ms));
  }
  window.removeAsset=removeAsset;window.clearHistory=clearHistory;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();