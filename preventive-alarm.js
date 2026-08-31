/* Alarme visual de manutenção preventiva por horímetro.
   Atua somente na tela de Cadastro de Ativos e não altera as funções existentes. */
(function(){
  'use strict';
  if(window.__preventiveAlarmInstalled)return;
  window.__preventiveAlarmInstalled=true;

  const norm=v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
  const root=()=>window.cmmsRoot||null;

  function resolveEquipmentId(order,equipments){
    if(!order||!equipments)return '';
    if(order.equipmentId && equipments[order.equipmentId])return order.equipmentId;
    const target=norm(order.equipment);
    if(!target)return '';
    const found=Object.entries(equipments).find(([,e])=>{
      const vals=[e?.name,e?.nome,e?.codigo,e?.code,e?.tag,e?.id].map(norm).filter(Boolean);
      return vals.some(v=>v===target||v.includes(target)||target.includes(v));
    });
    return found?found[0]:'';
  }

  function orderTime(o){
    return [o?.updatedAt,o?.completedAt,o?.createdAt,o?.date].map(Number).find(n=>Number.isFinite(n)&&n>0)||0;
  }

  function latestPreventiveOrder(equipmentId,equipments,orders){
    const related=Object.values(orders||{}).filter(o=>{
      if(!o)return false;
      if(norm(o.type||o.interventionType||o.tipo)!=='preventiva')return false;
      return resolveEquipmentId(o,equipments)===equipmentId;
    });
    related.sort((a,b)=>orderTime(b)-orderTime(a));
    return related[0]||null;
  }

  function maintenanceSatisfied(order){
    if(!order)return false;
    const s=norm(order.status);
    return s==='pendente'||s==='aberta'||s==='aberto'||s==='em andamento'||s==='em manutencao'||s==='concluida';
  }

  function installStyles(){
    if(document.getElementById('preventive-alarm-style'))return;
    const s=document.createElement('style');
    s.id='preventive-alarm-style';
    s.textContent=`
      .preventive-alarm-banner{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding:14px 16px;border:1px solid #ef4444;border-radius:14px;background:linear-gradient(90deg,rgba(127,29,29,.32),rgba(69,10,10,.22));box-shadow:0 0 28px rgba(239,68,68,.12);color:#fecaca}
      .preventive-alarm-dot{width:13px;height:13px;flex:0 0 13px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 0 rgba(239,68,68,.65);animation:preventivePulse 1.5s infinite}
      .preventive-alarm-title{font-weight:900;font-size:14px;letter-spacing:.02em}.preventive-alarm-text{font-size:12px;font-weight:700;margin-top:3px;color:#fca5a5}
      .preventive-alarm-card{border-color:#ef4444!important;box-shadow:0 0 0 1px rgba(239,68,68,.15),0 12px 34px rgba(239,68,68,.12)!important}
      .preventive-alarm-chip{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 10px;border-radius:999px;background:#7f1d1d;color:#fecaca;font-size:11px;font-weight:900}
      @keyframes preventivePulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
    `;
    document.head.appendChild(s);
  }

  function cardEquipmentId(card,equipments){
    const title=norm(card.querySelector('h3')?.textContent||'');
    const entries=Object.entries(equipments||{});
    const exact=entries.find(([id,e])=>norm(e?.name||e?.nome||e?.codigo||e?.code||id)===title);
    if(exact)return exact[0];
    const partial=entries.find(([id,e])=>{const n=norm(e?.name||e?.nome||e?.codigo||e?.code||id);return n&&title&&(n.includes(title)||title.includes(n))});
    return partial?partial[0]:'';
  }

  function apply(equipments,orders){
    const list=document.getElementById('equipmentList');
    if(!list)return;
    let alarmCount=0;
    [...list.children].forEach(card=>{
      card.classList.remove('preventive-alarm-card');
      card.querySelectorAll('.preventive-alarm-chip').forEach(x=>x.remove());
      const id=cardEquipmentId(card,equipments);
      const e=equipments?.[id];
      if(!e)return;
      const current=num(e.horimetro);
      const limit=num(e.preventiveLimit);
      if(current===null||limit===null||limit<=0||current<limit)return;
      const latest=latestPreventiveOrder(id,equipments,orders);
      if(maintenanceSatisfied(latest))return;
      alarmCount++;
      card.classList.add('preventive-alarm-card');
      const anchor=card.querySelector('.horimetro-action-wrap')||card.querySelector('button')?.parentElement||card.lastElementChild;
      const chip=document.createElement('div');
      chip.className='preventive-alarm-chip';
      chip.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> Preventiva vencida — agendar manutenção';
      if(anchor&&anchor.parentElement===card)anchor.insertAdjacentElement('beforebegin',chip);else card.appendChild(chip);
    });

    const section=document.getElementById('equipamentos');
    if(!section)return;
    let banner=section.querySelector('.preventive-alarm-banner');
    if(alarmCount>0){
      if(!banner){banner=document.createElement('div');banner.className='preventive-alarm-banner';const heading=section.querySelector('h2');const wrap=heading?.closest('.flex');(wrap||section.firstElementChild)?.insertAdjacentElement('afterend',banner);}
      banner.innerHTML='<span class="preventive-alarm-dot"></span><div><div class="preventive-alarm-title"><i class="fa-solid fa-triangle-exclamation" style="margin-right:7px"></i>MANUTENÇÃO PREVENTIVA NECESSÁRIA</div><div class="preventive-alarm-text">'+alarmCount+' máquina(s) atingiram ou ultrapassaram o limite do horímetro. Agende uma manutenção preventiva.</div></div>';
    }else if(banner){banner.remove()}
  }

  function start(){
    installStyles();
    const r=root();
    if(!r){setTimeout(start,500);return}
    const refresh=async()=>{
      try{
        const snap=await r.once('value');
        const data=snap.val()||{};
        apply(data.equipments||{},data.orders||{});
      }catch(e){console.warn('Alarme preventivo:',e)}
    };
    r.child('equipments').on('value',refresh);
    r.child('orders').on('value',refresh);
    const list=document.getElementById('equipmentList');
    if(list&&!list.dataset.preventiveAlarmObserver){
      list.dataset.preventiveAlarmObserver='1';
      new MutationObserver(()=>setTimeout(refresh,50)).observe(list,{childList:true,subtree:true});
    }
    [300,800,1500,3000].forEach(ms=>setTimeout(refresh,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();