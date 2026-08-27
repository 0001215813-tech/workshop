/* Regras complementares de status dos ativos.
   Mantém a função original de finalização da O.S. e apenas sincroniza o ativo. */
(function(){
  'use strict';

  function install(){
    if(typeof window.finishOS!=='function' || window.__assetStatusFinishWrapped) return;
    const originalFinishOS=window.finishOS;
    window.finishOS=async function(id){
      const state=window.cmmsState||{};
      const orders=state.orders||{};
      const equipments=state.equipments||{};
      const order=orders[id];
      const root=window.cmmsRoot||null;

      if(!order || !root){
        return originalFinishOS(id);
      }

      await originalFinishOS(id);

      // Ao finalizar qualquer O.S., o equipamento correspondente volta a Operando.
      let equipmentId=order.equipmentId||'';

      // Compatibilidade com O.S. antigas que ainda não tinham equipmentId.
      if(!equipmentId){
        const target=String(order.equipment||'').trim().toLowerCase();
        const match=Object.entries(equipments).find(([eid,e])=>{
          const name=String(e?.name||e?.nome||'').trim().toLowerCase();
          const code=String(e?.code||e?.codigo||'').trim().toLowerCase();
          return target===name || target===code || (name && target.includes(name));
        });
        if(match) equipmentId=match[0];
      }

      if(equipmentId){
        try{
          await root.child('equipments/'+equipmentId).update({status:'Operando'});
        }catch(error){
          console.error('Não foi possível atualizar o status do ativo após finalizar a O.S.:',error);
        }
      }
    };
    window.__assetStatusFinishWrapped=true;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(install,100));
  }else{
    setTimeout(install,100);
  }
  [500,1000,2000].forEach(ms=>setTimeout(install,ms));
})();