/* Sincronização robusta do status do ativo com as O.S.
   - Ao concluir uma O.S., o ativo correspondente volta para "Operando" quando não há outra O.S. aberta para ele.
   - Corrige ativos que ficaram presos em "Em manutenção" após versões anteriores.
   - Mantém compatibilidade com O.S. antigas sem equipmentId. */
(function(){
  'use strict';

  const normalize=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
  const getRoot=()=>window.cmmsRoot||null;

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

  function orderEquipmentId(order,equipments){
    return resolveEquipmentId(order,equipments);
  }

  function hasOpenOrderForEquipment(orders,equipments,equipmentId,ignoreOrderId){
    return Object.entries(orders||{}).some(([id,o])=>{
      if(id===ignoreOrderId || !o || o.status==='Concluída') return false;
      return orderEquipmentId(o,equipments)===equipmentId;
    });
  }

  async function reconcileCompletedAssets(){
    const root=getRoot();
    if(!root)return;
    try{
      const snap=await root.once('value');
      const data=snap.val()||{};
      const equipments=data.equipments||{};
      const orders=data.orders||{};
      const updates={};

      Object.entries(equipments).forEach(([equipmentId,equipment])=>{
        const related=Object.entries(orders).filter(([,o])=>orderEquipmentId(o,equipments)===equipmentId);
        if(!related.length)return;
        const hasOpen=related.some(([,o])=>o && o.status!=='Concluída');
        const hasCompleted=related.some(([,o])=>o && o.status==='Concluída');
        if(hasCompleted && !hasOpen && equipment.status!=='Operando'){
          updates['equipments/'+equipmentId+'/status']='Operando';
          updates['equipments/'+equipmentId+'/updatedAt']=firebase.database.ServerValue.TIMESTAMP;
          updates['equipments/'+equipmentId+'/updatedByDevice']=typeof deviceId!=='undefined'?deviceId:'DEV-NAVEGADOR';
        }
      });

      if(Object.keys(updates).length) await root.update(updates);
    }catch(error){
      console.error('Sincronização de status dos ativos:',error);
    }
  }

  function install(){
    if(window.__assetStatusFinishFixed)return;
    const root=getRoot();
    if(!root)return;

    window.finishOS=async function(id){
      const r=getRoot();
      if(!r){alert('Firebase ainda não está disponível.');return;}
      try{
        const [orderSnap,equipSnap,ordersSnap]=await Promise.all([
          r.child('orders/'+id).once('value'),
          r.child('equipments').once('value'),
          r.child('orders').once('value')
        ]);
        const order=orderSnap.val();
        const equipments=equipSnap.val()||{};
        const orders=ordersSnap.val()||{};
        if(!order)return;
        if(order.status==='Concluída'){
          await reconcileCompletedAssets();
          return;
        }

        const equipmentId=resolveEquipmentId(order,equipments);
        if(!equipmentId){
          alert('Não foi possível identificar o ativo desta O.S. para finalizar.');
          return;
        }

        // Atualiza a cópia local para calcular o estado correto depois da conclusão.
        orders[id]={...order,status:'Concluída'};
        const stillHasOpen=hasOpenOrderForEquipment(orders,equipments,equipmentId,id);
        const updates={
          ['orders/'+id+'/status']:'Concluída',
          ['orders/'+id+'/completedAt']:firebase.database.ServerValue.TIMESTAMP,
          ['orders/'+id+'/completedByDevice']:typeof deviceId!=='undefined'?deviceId:'DEV-NAVEGADOR',
          ['orders/'+id+'/equipmentId']:equipmentId
        };

        // Só volta para Operando se não existir outra O.S. aberta para o mesmo ativo.
        if(!stillHasOpen){
          updates['equipments/'+equipmentId+'/status']='Operando';
          updates['equipments/'+equipmentId+'/updatedAt']=firebase.database.ServerValue.TIMESTAMP;
          updates['equipments/'+equipmentId+'/updatedByDevice']=typeof deviceId!=='undefined'?deviceId:'DEV-NAVEGADOR';
        }

        const historyKey=r.child('history').push().key;
        updates['history/'+historyKey]={
          date:firebase.database.ServerValue.TIMESTAMP,
          equipment:order.equipment,
          event:'OS finalizada: '+(order.description||''),
          orderId:id,
          cost:Number(order.cost||0),
          device:typeof deviceId!=='undefined'?deviceId:'DEV-NAVEGADOR'
        };

        await r.update(updates);
        await reconcileCompletedAssets();
        alert(stillHasOpen?'O.S. finalizada. O ativo permanece em manutenção porque ainda existe outra O.S. aberta.':'O.S. finalizada e o ativo voltou para Operando.');
      }catch(error){
        console.error('finishOS:',error);
        alert('A O.S. não pôde ser finalizada corretamente. Verifique a conexão/permissão do Firebase.');
      }
    };

    window.__assetStatusFinishFixed=true;
    reconcileCompletedAssets();
  }

  function boot(){
    install();
    [250,600,1200,2000,4000].forEach(ms=>setTimeout(install,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
