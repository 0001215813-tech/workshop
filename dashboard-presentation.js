/* APENAS VISUAL: painel executivo adicional. Não altera handlers, dados ou regras do CMMS. */
(function(){'use strict';
function start(){
 if(document.getElementById('presentationDashboard')) return;
 const dash=document.getElementById('dashboard'); if(!dash) return setTimeout(start,500);
 const host=document.createElement('div'); host.id='presentationDashboard'; host.className='presentation-dashboard';
 host.innerHTML=`<div class="pd-head"><div><span>MONITORAMENTO OPERACIONAL</span><h3>Centro de Controle de Manutenção</h3></div><div class="pd-live"><i></i> DADOS EM TEMPO REAL</div></div>
 <div class="pd-grid">
  <div class="pd-gauge card"><div class="pd-label">DISPONIBILIDADE</div><div class="gauge"><div class="gauge-arc"></div><div class="gauge-value" id="pdAvailability">96%</div><div class="gauge-unit">OPERACIONAL</div></div></div>
  <div class="pd-gauge card"><div class="pd-label">SAÚDE DOS ATIVOS</div><div class="gauge gauge-blue"><div class="gauge-arc"></div><div class="gauge-value" id="pdHealth">--</div><div class="gauge-unit">ATIVOS</div></div></div>
  <div class="pd-gauge card"><div class="pd-label">ESTOQUE CRÍTICO</div><div class="gauge gauge-amber"><div class="gauge-arc"></div><div class="gauge-value" id="pdCritical">--</div><div class="gauge-unit">PEÇAS</div></div></div>
  <div class="pd-panel card"><div class="pd-label">STATUS DOS ATIVOS</div><div class="pd-bars"><div><span>Operando</span><b id="pdOp">0</b></div><div class="bar"><i id="pdOpBar"></i></div><div><span>Em manutenção</span><b id="pdMaint">0</b></div><div class="bar"><i id="pdMaintBar"></i></div><div><span>Parados</span><b id="pdStop">0</b></div><div class="bar"><i id="pdStopBar"></i></div></div></div>
  <div class="pd-panel pd-wide card"><div class="pd-label">FLUXO DE ORDENS DE SERVIÇO</div><div class="pd-flow"><div><strong id="pdPending">0</strong><span>PENDENTES</span></div><div class="flow-line"></div><div><strong id="pdDone">0</strong><span>CONCLUÍDAS</span></div><div class="flow-line"></div><div><strong id="pdTotal">0</strong><span>TOTAL</span></div></div></div>
 </div>`;
 const anchor=dash.querySelector('.grid'); if(anchor) dash.insertBefore(host,anchor); else dash.appendChild(host);
 function update(){try{const s=window.cmmsState||{};const eq=Object.values(s.equipments||{}), orders=Object.values(s.orders||{}), parts=Object.values(s.parts||{});let op=0,maint=0,stop=0;eq.forEach(e=>{const x=String(e.status||'Operando').toLowerCase();if(x.includes('manuten'))maint++;else if(x.includes('parad'))stop++;else op++});const total=Math.max(eq.length,1);document.getElementById('pdHealth').textContent=Math.round(op/total*100)+'%';document.getElementById('pdOp').textContent=op;document.getElementById('pdMaint').textContent=maint;document.getElementById('pdStop').textContent=stop;document.getElementById('pdOpBar').style.width=(op/total*100)+'%';document.getElementById('pdMaintBar').style.width=(maint/total*100)+'%';document.getElementById('pdStopBar').style.width=(stop/total*100)+'%';const pending=orders.filter(o=>!['concluida','concluído','concluido'].includes(String(o.status||'').toLowerCase())).length;const done=orders.length-pending;document.getElementById('pdPending').textContent=pending;document.getElementById('pdDone').textContent=done;document.getElementById('pdTotal').textContent=orders.length;const critical=parts.filter(p=>Number(p.quantity??p.stock??p.qty??p.quantidade??999)>0&&Number(p.quantity??p.stock??p.qty??p.quantidade)<5).length;document.getElementById('pdCritical').textContent=critical;}catch(e){console.warn('presentation UI',e)}}
 update();setInterval(update,1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
