/* Correção definitiva da sincronização do status do ativo com as O.S. */
(function(){
  'use strict';
  let syncing = false;

  function normalizeStatus(v){
    return String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function desiredStatus(order){
    const status = normalizeStatus(order?.status);
    const type = normalizeStatus(order?.type || order?.interventionType);

    if(status === 'concluida' || status === 'concluida.') return 'Operando';
    if(status === 'em andamento' || status === 'em manutencao') return 'Em manutenção';
    if(status === 'pendente'){
      if(type === 'corretiva' || type === 'preditiva') return 'Parado';
      if(type === 'preventiva') return 'Operando - manutenção preventiva agendada';
    }
    return null;
  }

  async function syncCompletedAndActiveStatuses(){
    const root = window.cmmsRoot;
    if(!root || syncing) return;

    syncing = true;
    try{
      const [eqSnap, orderSnap] = await Promise.all([
        root.child('equipments').once('value'),
        root.child('orders').once('value')
      ]);

      const equipments = eqSnap.val() || {};
      const orders = orderSnap.val() || {};
      const latest = {};

      Object.entries(orders).forEach(([orderId, order]) => {
        const equipmentId = order?.equipmentId;
        if(!equipmentId || !equipments[equipmentId]) return;
        const time = Number(order?.createdAt || order?.completedAt || 0);
        const previous = latest[equipmentId];
        if(!previous || time >= previous.time){
          latest[equipmentId] = {orderId, order, time};
        }
      });

      const updates = [];
      Object.entries(latest).forEach(([equipmentId, item]) => {
        const wanted = desiredStatus(item.order);
        if(!wanted) return;
        const current = String(equipments[equipmentId]?.status || '').trim();
        if(current !== wanted){
          updates.push(root.child('equipments/'+equipmentId).update({
            status: wanted,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            updatedByDevice: window.deviceId || 'DEV-NAVEGADOR'
          }));
        }
      });

      if(updates.length) await Promise.all(updates);
    }catch(err){
      console.error('status-sync-fix:', err);
    }finally{
      syncing = false;
    }
  }

  function install(){
    const root = window.cmmsRoot;
    if(!root) return setTimeout(install, 150);

    root.child('orders').on('value', function(){
      syncCompletedAndActiveStatuses();
    });

    // Executa também na abertura/refresh, corrigindo ativos que ficaram presos
    // em "Em manutenção" por uma versão anterior do aplicativo.
    setTimeout(syncCompletedAndActiveStatuses, 300);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
