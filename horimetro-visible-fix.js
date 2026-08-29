/* Exibe a opção de aumentar o horímetro diretamente nos cards de Cadastro de Ativos. */
(function(){
  'use strict';
  if(window.__horimetroVisibleFixInstalled)return;
  window.__horimetroVisibleFixInstalled=true;

  const state=()=>window.cmmsState||{};
  const root=()=>window.cmmsRoot||null;
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function addStyles(){
    if(document.getElementById('horimetro-visible-style'))return;
    const s=document.createElement('style');s.id='horimetro-visible-style';
    s.textContent='.horimetro-visible-fix{margin-top:12px!important;width:100%!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border:1px solid #2563eb!important;background:#172554!important;color:#bfdbfe!important;border-radius:10px!important;padding:10px 12px!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}.horimetro-visible-fix:hover{background:#2563eb!important;color:#fff!important}#hmv-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.8);padding:16px}#hmv-overlay.open{display:flex}#hmv-card{width:100%;max-width:440px;background:#0f172a;border:1px solid #334155;border-radius:18px;padding:22px;box-shadow:0 25px 70px #0008}#hmv-card input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;background:#020617;color:#e2e8f0;border:1px solid #334155;margin-top:6px;outline:none}#hmv-card button{cursor:pointer}';
    document.head.appendChild(s);
  }

  function modal(){
    let o=document.getElementById('hmv-overlay');if(o)return o;
    o=document.createElement('div');o.id='hmv-overlay';
    o.innerHTML='<div id="hmv-card"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:10px;color:#60a5fa;font-weight:900;letter-spacing:.1em">HORÍMETRO</div><div id="hmv-title" style="font-size:20px;font-weight:900;margin-top:4px"></div></div><button id="hmv-x" style="width:36px;height:36px;border:0;border-radius:9px;background:#1e293b;color:#fff;font-size:18px">✕</button></div><div id="hmv-current" style="margin:14px 0;padding:12px;border-radius:10px;background:#020617;color:#cbd5e1;font-size:12px"></div><label style="display:block;color:#94a3b8;font-size:11px;font-weight:800">HORAS A ACRESCENTAR<input id="hmv-add" type="number" min="0.1" step="0.1" value="1"></label><label style="display:block;margin-top:12px;color:#94a3b8;font-size:11px;font-weight:800">OBSERVAÇÃO (opcional)<input id="hmv-reason" type="text" placeholder="Ex.: Horas de operação"></label><div style="display:flex;gap:8px;margin-top:15px"><button id="hmv-cancel" style="flex:1;border:0;border-radius:10px;padding:11px;background:#1e293b;color:#fff;font-weight:800">Cancelar</button><button id="hmv-save" style="flex:1;border:0;border-radius:10px;padding:11px;background:#2563eb;color:#fff;font-weight:900">Aumentar Horímetro</button></div></div>';
    document.body.appendChild(o);
    const close=()=>o.classList.remove('open');o.querySelector('#hmv-x').onclick=close;o.querySelector('#hmv-cancel').onclick=close;o.onclick=e=>{if(e.target===o)close()};
    return o;
  }

  function open(id,e){
    const r=root();if(!r){alert('Aguarde a conexão com o Firebase.');return}
    const o=modal(),current=num(e?.horimetro);o.querySelector('#hmv-title').textContent=e?.name||e?.nome||e?.codigo||'Equipamento';o.querySelector('#hmv-current').innerHTML='Horímetro atual: <strong style="font-size:19px;color:#fff">'+current.toLocaleString('pt-BR')+' h</strong>';o.querySelector('#hmv-add').value='1';o.querySelector('#hmv-reason').value='';o.classList.add('open');
    o.querySelector('#hmv-save').onclick=async()=>{const add=num(o.querySelector('#hmv-add').value),reason=o.querySelector('#hmv-reason').value.trim(),btn=o.querySelector('#hmv-save');if(add<=0){alert('Informe uma quantidade maior que zero.');return}btn.disabled=true;btn.textContent='Salvando...';try{const snap=await r.child('equipments/'+id).once('value'),fresh=snap.val()||e||{},next=num(fresh.horimetro)+add;await r.child('equipments/'+id).update({horimetro:next,updatedAt:firebase.database.ServerValue.TIMESTAMP,updatedByDevice:window.deviceId||'DEV-NAVEGADOR'});const h=r.child('history').push();await h.set({date:firebase.database.ServerValue.TIMESTAMP,equipment:fresh.name||fresh.nome||id,event:'Horímetro atualizado: +'+add+' h'+(reason?' — '+reason:''),orderId:'-',cost:0,device:window.deviceId||'DEV-NAVEGADOR'});o.classList.remove('open')}catch(err){console.error(err);alert('Não foi possível atualizar o horímetro.')}finally{btn.disabled=false;btn.textContent='Aumentar Horímetro'}};
  }

  function install(){
    addStyles();const list=document.getElementById('equipmentList');if(!list)return;const entries=Object.entries(state().equipments||{});if(!entries.length)return;
    Array.from(list.children).forEach((card,index)=>{if(card.querySelector('.horimetro-visible-fix'))return;let entry=entries[index];const headings=card.querySelectorAll('h1,h2,h3,h4,h5,h6');const name=(headings[0]?.textContent||'').trim();if(name){entry=entries.find(([,e])=>String(e?.name||e?.nome||e?.codigo||e?.code||'').trim()===name)||entry}if(!entry)return;const b=document.createElement('button');b.type='button';b.className='horimetro-visible-fix';b.innerHTML='<i class="fa-solid fa-gauge-high"></i><span>Aumentar Horímetro</span>';b.onclick=()=>open(entry[0],entry[1]);card.appendChild(b)});
  }

  function init(){addStyles();install();const list=document.getElementById('equipmentList');if(list&&!list.dataset.hmvObserver){list.dataset.hmvObserver='1';new MutationObserver(()=>setTimeout(install,50)).observe(list,{childList:true,subtree:true})}const section=document.getElementById('equipamentos');if(section&&!section.dataset.hmvSectionObserver){section.dataset.hmvSectionObserver='1';new MutationObserver(()=>setTimeout(install,100)).observe(section,{childList:true,subtree:true})}[100,300,700,1200,2000,4000,7000].forEach(ms=>setTimeout(install,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
