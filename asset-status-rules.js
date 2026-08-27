/* Vínculo direto entre o status da ÚLTIMA O.S. e o status do ativo.
   Regras:
   - Última O.S. = Concluída -> Operando
   - Última O.S. = Em Andamento -> Em manutenção
   - Última O.S. = Pendente + Preventiva -> Operando - manutenção preventiva agendada
   - Última O.S. = Pendente + Corretiva/Preditiva -> Parado
   - Compatível com O.S. antigas sem equipmentId, resolvendo pelo nome/código do ativo.
*/
(function(){
  'use strict';

  const normalize=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
  const getRoot=()=>window.cmmsRoot||null;
  const getDevice=()=>typeof window.deviceId!=='undefined'?window.deviceId:'DEV-NAVEGADOR';

  function resolveEquipmentId(order,equipments){
    if(!order||!equipments)return '';
    if(order.equipmentId && equipments[order.equipmentId]) return order.equipmentId;
    const target=normalize(order.equipment);
    if(!target)return '';
    const match=Object.entries(equipments).find(([id,e])=>{
      const vals=[e?.name,e?.nome,e?.codigo,e?.code,e?.id,e?.tag].map(normalize).filter(Boolean);
      return vals.some(v=>v===target || v.includes(target) || target.includes(v));
    });
    return match?match[0]:'';
  }

  function timestampOf(order){
    const values=[order?.createdAt,order?.updatedAt,order?.completedAt,order?.date];
    for(const v of values){
      const n=Number(v);
      if(Number.isFinite(n)&&n>0)return n;
    }
    return 0;
  }

  function latestOrderForEquipment(orders,equipments,equipmentId){
    const related=Object.entries(orders||{})
      .filter(([,o])=>o && resolveEquipmentId(o,equipments)===equipmentId)
      .map(([id,o])=>({id,order:o}));
    if(!related.length)return null;
    related.sort((a,b)=>{
      const ta=timestampOf(a.order),tb=timestampOf(b.order);
      if(tb!==ta)return tb-ta;
      return String(b.id).localeCompare(String(a.id));
    });
    return related[0];
  }

  function statusFromLatestOrder(order){
    if(!order)return null;
    const status=normalize(order.status);
    const type=normalize(order.type||order.interventionType||order.tipo);

    if(status==='concluída' || status==='concluida')return 'Operando';
    if(status==='em andamento' || status==='em manutenção' || status==='em manutencao')return 'Em manutenção';

    if(status==='pendente' || status==='aberta' || status==='aberto'){
      if(type==='preventiva')return 'Operando - manutenção preventiva agendada';
      if(type==='corretiva' || type==='preditiva')return 'Parado';
    }

    return null;
  }

  async function reconcileLatestOrderStatuses(){
    const root=getRoot();
    if(!root)return;
    try{
      const snap=await root.once('value');
      const data=snap.val()||{};
      const equipments=data.equipments||{};
      const orders=data.orders||{};
      const updates={};

      Object.entries(equipments).forEach(([equipmentId,equipment])=>{
        const latest=latestOrderForEquipment(orders,equipments,equipmentId);
        const desired=statusFromLatestOrder(latest?.order);
        if(desired && String(equipment?.status||'')!==desired){
          updates['equipments/'+equipmentId+'/status']=desired;
          updates['equipments/'+equipmentId+'/updatedAt']=firebase.database.ServerValue.TIMESTAMP;
          updates['equipments/'+equipmentId+'/updatedByDevice']=getDevice();
        }
      });

      if(Object.keys(updates).length)await root.update(updates);
    }catch(error){
      console.error('Sincronização status ativo/O.S.:',error);
    }
  }

  async function finishOrder(id){
    const r=getRoot();
    if(!r){alert('Firebase ainda não está disponível.');return;}
    try{
      const snap=await r.child('orders/'+id).once('value');
      const order=snap.val();
      if(!order)return;

      const equipmentSnap=await r.child('equipments').once('value');
      const equipments=equipmentSnap.val()||{};
      const equipmentId=resolveEquipmentId(order,equipments);
      if(!equipmentId){
        alert('Não foi possível identificar o ativo desta O.S. para finalizar.');
        return;
      }

      const updates={
        ['orders/'+id+'/status']:'Concluída',
        ['orders/'+id+'/completedAt']:firebase.database.ServerValue.TIMESTAMP,
        ['orders/'+id+'/completedByDevice']:getDevice(),
        ['orders/'+id+'/equipmentId']:equipmentId
      };

      await r.update(updates);
      await reconcileLatestOrderStatuses();
      alert('O.S. finalizada e o status do ativo foi sincronizado com a última O.S.');
    }catch(error){
      console.error('finishOS:',error);
      alert('A O.S. não pôde ser finalizada corretamente. Verifique a conexão/permissão do Firebase.');
    }
  }

  function install(){
    if(window.__assetStatusLatestRuleInstalled)return;
    const root=getRoot();
    if(!root)return;

    window.finishOS=finishOrder;

    // Mantém o vínculo em tempo real sempre que uma O.S. mudar.
    try{
      root.child('orders').on('value',reconcileLatestOrderStatuses);
    }catch(e){console.warn('Listener de status dos ativos:',e)}

    window.__assetStatusLatestRuleInstalled=true;
    reconcileLatestOrderStatuses();
  }

  function boot(){
    install();
    [250,600,1200,2000,4000].forEach(ms=>setTimeout(install,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
