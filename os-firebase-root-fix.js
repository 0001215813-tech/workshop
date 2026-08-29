/* Mantém a correção da referência Firebase usada pelos módulos externos da O.S. e garante o registro de O.S. concluídas no histórico. */
(function(){
  'use strict';
  function getRoot(){
    try{
      const current=typeof window.__cmmsRootRef==='function'?window.__cmmsRootRef():null;
      if(current) return current;
      if(typeof firebase!=='undefined' && firebase.database) return firebase.database().ref('workshopCMMS');
    }catch(e){console.warn('Firebase root fallback',e)}
    return null;
  }
  function install(){
    try{
      Object.defineProperty(window,'cmmsRoot',{
        configurable:true,
        get:getRoot
      });
    }catch(e){console.warn('Falha ao instalar correção do Firebase',e)}
  }
  function norm(v){
    return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function installHistorySync(){
    try{
      const r=getRoot();
      if(!r || r.__historySyncInstalled) return;
      r.__historySyncInstalled=true;
      r.child('orders').on('child_changed',snap=>{
        const order=snap.val()||{};
        const status=norm(order.status);
        if(!['concluida','concluido','completed','finalizada','finalizado'].includes(status)) return;
        if(order.historyLogged===true) return;
        const historyRef=r.child('history').push();
        const completedAt=order.completedAt||firebase.database.ServerValue.TIMESTAMP;
        historyRef.set({
          date: completedAt,
          createdAt: completedAt,
          completedAt: completedAt,
          equipment: order.equipment||order.equipmentName||order.equipmentId||'Equipamento',
          equipmentId: order.equipmentId||'',
          event:'OS concluída',
          os: order.number||order.os||snap.key,
          orderId:snap.key,
          cost:Number(order.cost||0),
          device:order.completedByDevice||order.createdByDevice||'DEV-NAVEGADOR'
        }).then(()=>snap.ref.update({historyLogged:true,historyRecordedAt:firebase.database.ServerValue.TIMESTAMP}))
          .catch(e=>console.warn('Falha ao registrar O.S. no histórico',e));
      });
      r.child('orders').once('value').then(s=>{
        s.forEach(c=>{
          const o=c.val()||{}, status=norm(o.status);
          if(['concluida','concluido','completed','finalizada','finalizado'].includes(status) && o.historyLogged!==true){
            const historyRef=r.child('history').push();
            const completedAt=o.completedAt||o.updatedAt||o.createdAt||firebase.database.ServerValue.TIMESTAMP;
            historyRef.set({
              date:completedAt,
              createdAt:completedAt,
              completedAt:completedAt,
              equipment:o.equipment||o.equipmentName||o.equipmentId||'Equipamento',
              equipmentId:o.equipmentId||'',
              event:'OS concluída',
              os:o.number||o.os||c.key,
              orderId:c.key,
              cost:Number(o.cost||0),
              device:o.completedByDevice||o.createdByDevice||'DEV-NAVEGADOR'
            }).then(()=>c.ref.update({historyLogged:true,historyRecordedAt:firebase.database.ServerValue.TIMESTAMP}))
             .catch(e=>console.warn('Falha ao recuperar O.S. no histórico',e));
          }
        });
      });
    }catch(e){console.warn('Falha ao instalar sincronização do histórico',e)}
  }
  install();
  setTimeout(install,100);
  setTimeout(install,500);
  setTimeout(install,1500);
  setTimeout(installHistorySync,700);
  setTimeout(installHistorySync,2000);
})();
