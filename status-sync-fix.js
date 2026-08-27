/* Sincronização direta: o status do ativo sempre acompanha a ÚLTIMA O.S. daquele ativo. */
(function(){
  'use strict';
  let running = false;
  let timer = null;

  function norm(v){
    return String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function orderStatus(v){
    const s = norm(v);
    if(s === 'concluida' || s === 'concluida.') return 'concluida';
    if(s === 'em andamento' || s === 'em manutencao') return 'em andamento';
    if(s === 'pendente' || s === 'em aberto') return 'pendente';
    return s;
  }

  function wantedStatus(order){
    const s = orderStatus(order?.status || order?.statusOS || order?.osStatus);
    const type = norm(order?.type || order?.interventionType || order?.tipo);

    // Regra principal solicitada: última O.S. concluída => ativo Operando.
    if(s === 'concluida') return 'Operando';
    if(s === 'em andamento') return 'Em manutenção';
    if(s === 'pendente'){
      if(type === 'corretiva' || type === 'preditiva') return 'Parado';
      if(type === 'preventiva') return 'Operando - manutenção preventiva agendada';
    }
    return null;
  }

  function orderTime(order){
    const values = [
      order?.createdAt,
      order?.openedAt,
      order?.timestamp,
      order?.created_at,
      order?.dataHora,
      order?.updatedAt,
      order?.completedAt
    ];
    for(const v of values){
      const n = Number(v);
      if(Number.isFinite(n) && n > 0) return n;
      const d = Date.parse(String(v || ''));
      if(Number.isFinite(d)) return d;
    }
    return 0;
  }

  function equipmentKey(order, equipments){
    const direct = order?.equipmentId || order?.assetId || order?.ativoId || order?.equipamentoId;
    if(direct && equipments[direct]) return direct;

    const target = norm(order?.equipment || order?.equipmentName || order?.asset || order?.equipamento || order?.ativo);
    if(!target) return null;

    for(const [id,e] of Object.entries(equipments)){
      const names = [e?.name,e?.codigo,e?.code,e?.assetCode,e?.id].map(norm).filter(Boolean);
      if(names.includes(target)) return id;
    }
    return null;
  }

  async function sync(){
    const root = window.cmmsRoot;
    if(!root || running) return;
    running = true;
    try{
      const [eqSnap, osSnap] = await Promise.all([
        root.child('equipments').once('value'),
        root.child('orders').once('value')
      ]);

      const equipments = eqSnap.val() || {};
      const orders = osSnap.val() || {};
      const latest = {};

      for(const [orderId, order] of Object.entries(orders)){
        if(!order || typeof order !== 'object') continue;
        const equipmentId = equipmentKey(order, equipments);
        if(!equipmentId) continue;
        const time = orderTime(order);
        const previous = latest[equipmentId];
        // Se duas O.S. tiverem a mesma data, a chave do Firebase desempata de forma estável.
        if(!previous || time > previous.time || (time === previous.time && String(orderId) > String(previous.orderId))){
          latest[equipmentId] = {orderId, order, time};
        }
      }

      const writes = [];
      for(const [equipmentId, item] of Object.entries(latest)){
        const wanted = wantedStatus(item.order);
        if(!wanted) continue;
        const current = String(equipments[equipmentId]?.status || '').trim();
        if(current !== wanted){
          writes.push(root.child('equipments').child(equipmentId).update({
            status: wanted,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            statusSource: 'ultima_os',
            statusSourceOrderId: item.orderId,
            updatedByDevice: window.deviceId || 'DEV-NAVEGADOR'
          }));
        }
      }

      if(writes.length) await Promise.all(writes);
      if(typeof window.cmmsRender === 'function') window.cmmsRender();
    }catch(err){
      console.error('status-sync-fix:', err);
    }finally{
      running = false;
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(sync, 100);
  }

  function install(){
    const root = window.cmmsRoot;
    if(!root) return setTimeout(install, 150);

    // O vínculo é realtime: qualquer mudança nas O.S. ou nos ativos dispara nova sincronização.
    root.child('orders').on('value', schedule);
    root.child('equipments').on('value', schedule);
    schedule();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
