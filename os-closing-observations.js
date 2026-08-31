/* Observações e encerramento da O.S. — adição isolada, sem alterar as demais funções. */
(function(){
'use strict';
if(window.__osClosingObservationsInstalled)return;
window.__osClosingObservationsInstalled=true;

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function root(){return window.cmmsRoot||null;}
function norm(v){return String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}

function getOrderId(row,button){
  const ds=[button?.dataset?.orderId,button?.dataset?.osId,button?.dataset?.id,row?.dataset?.orderId,row?.dataset?.osId,row?.dataset?.id].filter(Boolean);
  if(ds[0])return String(ds[0]).replace(/^#/,'').trim();
  const first=(row?.querySelector('td')?.textContent||'').trim().replace(/^#/,'');
  return first;
}

async function resolveOrderId(row,button){
  const r=root(); if(!r)return '';
  const candidate=getOrderId(row,button);
  if(candidate){
    const snap=await r.child('orders/'+candidate).once('value');
    if(snap.exists())return candidate;
  }
  const needle=norm(candidate);
  const snap=await r.child('orders').once('value');
  let found='';
  snap.forEach(c=>{
    const o=c.val()||{};
    const vals=[o.number,o.os,o.orderNumber,c.key].map(norm);
    if(!found && needle && vals.some(v=>v===needle))found=c.key;
  });
  return found;
}

function removeDialog(){document.getElementById('osClosingDialog')?.remove();}
function showDialog(initial,submit,cancel){
  removeDialog();
  const wrap=document.createElement('div');
  wrap.id='osClosingDialog';
  wrap.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.78);backdrop-filter:blur(5px);padding:16px';
  wrap.innerHTML=`<div style="width:min(620px,100%);background:#111c32;border:1px solid #293b59;border-radius:16px;box-shadow:0 25px 70px rgba(0,0,0,.55);padding:24px;color:#e2e8f0;font-family:Inter,ui-sans-serif,system-ui,sans-serif"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-size:10px;color:#60a5fa;font-weight:800;text-transform:uppercase;letter-spacing:.12em">Encerramento da O.S.</div><h3 style="margin:5px 0 0;font-size:20px;font-weight:900">Observações e encerramento</h3></div><button type="button" id="osClosingCancelTop" style="width:36px;height:36px;border:0;border-radius:9px;background:#1e293b;color:#cbd5e1;font-size:18px;cursor:pointer">×</button></div><p style="font-size:12px;color:#94a3b8;margin:14px 0 8px">Registre diagnóstico, serviços executados, peças utilizadas, recomendações ou outras informações do encerramento.</p><textarea id="osClosingText" rows="7" style="width:100%;box-sizing:border-box;resize:vertical;padding:12px;border-radius:12px;background:#0b1426;border:1px solid #334155;color:#f8fafc;outline:none;font:inherit" placeholder="Digite as observações e o encerramento da manutenção...">${esc(initial||'')}</textarea><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px"><button type="button" id="osClosingCancel" style="padding:10px 16px;border:1px solid #475569;border-radius:10px;background:#1e293b;color:#e2e8f0;font-weight:800;cursor:pointer">Cancelar</button><button type="button" id="osClosingSave" style="padding:10px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:900;cursor:pointer">Salvar e concluir O.S.</button></div></div>`;
  document.body.appendChild(wrap);
  const text=wrap.querySelector('#osClosingText');
  const doCancel=()=>{removeDialog();cancel?.();};
  wrap.querySelector('#osClosingCancel').onclick=doCancel;
  wrap.querySelector('#osClosingCancelTop').onclick=doCancel;
  wrap.querySelector('#osClosingSave').onclick=async()=>{
    const b=wrap.querySelector('#osClosingSave');
    b.disabled=true;b.textContent='Salvando...';
    try{await submit(text.value.trim());removeDialog();}
    catch(e){console.error(e);alert('Não foi possível salvar as observações de encerramento.');b.disabled=false;b.textContent='Salvar e concluir O.S.';}
  };
  setTimeout(()=>text.focus(),0);
}

function isConclusionButton(button){
  const text=norm(button?.textContent||button?.getAttribute('aria-label')||button?.title||'');
  return /\b(concluir|finalizar|encerrar|finalizada|concluida)\b/.test(text) && !/pdf|imprimir|relatorio/.test(text);
}

async function intercept(e){
  if(window.__osClosingBypass)return;
  const list=document.getElementById('osList');
  if(!list)return;
  const button=e.target?.closest?.('button,a');
  if(!button||!list.contains(button)||!isConclusionButton(button))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const row=button.closest('tr');
  try{
    const r=root();if(!r){alert('Firebase ainda não está disponível.');return;}
    const id=await resolveOrderId(row,button);
    if(!id){alert('Não foi possível identificar a O.S. para o encerramento.');return;}
    const snap=await r.child('orders/'+id).once('value');
    const order=snap.val()||{};
    const initial=order.closingNotes||order.observacoesEncerramento||'';
    showDialog(initial,async notes=>{
      await r.child('orders/'+id).update({closingNotes:notes,observacoesEncerramento:notes});
      window.__osClosingBypass=true;
      try{button.click();}finally{setTimeout(()=>{window.__osClosingBypass=false},500);}
    });
  }catch(err){console.error('Observações de encerramento:',err);alert('Não foi possível abrir o encerramento da O.S.');}
}

document.addEventListener('click',intercept,true);
})();
