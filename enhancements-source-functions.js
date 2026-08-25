/* Funções adicionais inspiradas no HTML de referência, sem substituir a base Firebase. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cmmsState=()=>window.cmmsState||{};
  const cmmsRoot=()=>window.cmmsRoot||null;

  function ensureAlert(){
    if(document.getElementById('sourceFeatureAlert')) return document.getElementById('sourceFeatureAlert');
    const el=document.createElement('div'); el.id='sourceFeatureAlert';
    el.className='hidden mb-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 to-orange-950/50 p-4 shadow-xl';
    el.innerHTML='<div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl"><i class="fa-solid fa-triangle-exclamation"></i></div><div><div class="text-xs font-black text-amber-300 uppercase tracking-wider">Alerta de horímetro</div><div id="sourceFeatureAlertText" class="text-sm text-slate-300 mt-1"></div></div></div><button id="sourceFeatureAlertOS" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs"><i class="fa-solid fa-wrench mr-2"></i>Gerar O.S.</button></div>';
    const main=document.querySelector('main'); if(main) main.prepend(el);
    const b=el.querySelector('#sourceFeatureAlertOS'); if(b)b.onclick=()=>window.newOS&&window.newOS();
    return el;
  }

  window.simulateCase=function(){
    try{
      const eqs=cmmsState().equipments||{}; const id=Object.keys(eqs)[0]; const root=cmmsRoot();
      if(root&&id){
        root.child('equipments/'+id).update({status:'Em Manutenção',horimetro:505});
        const e=eqs[id], alertBox=ensureAlert();
        document.getElementById('sourceFeatureAlertText').textContent=`${e.name||'Equipamento'} atingiu o limite de manutenção preventiva. Horímetro simulado: 505 h.`;
        alertBox.classList.remove('hidden');
      }else alert('Cadastre pelo menos um equipamento antes de simular o caso.');
      if(window.tab)window.tab('dashboard');
    }catch(e){console.error('simulateCase',e);}
  };

  function installEquipmentActions(){
    const list=document.getElementById('equipmentList'); if(!list||list.dataset.sourceActions)return; list.dataset.sourceActions='1';
    const observer=new MutationObserver(()=>list.querySelectorAll('.card').forEach(card=>{
      if(card.querySelector('.source-eq-actions'))return; const title=card.querySelector('h3'); if(!title)return;
      const wrap=document.createElement('div'); wrap.className='source-eq-actions grid grid-cols-2 gap-2 mt-4';
      const btnOS=document.createElement('button'); btnOS.className='bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl px-3 py-2 text-xs font-black transition'; btnOS.innerHTML='<i class="fa-solid fa-file-circle-plus mr-1"></i> Abrir O.S.'; btnOS.onclick=()=>window.newOS&&window.newOS();
      const btnQR=document.createElement('button'); btnQR.className='bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs font-black transition'; btnQR.innerHTML='<i class="fa-solid fa-qrcode mr-1"></i> QR do ativo'; btnQR.onclick=()=>showAssetQR(title.textContent);
      wrap.append(btnOS,btnQR); card.appendChild(wrap);
    }));
    observer.observe(list,{childList:true,subtree:true});
  }

  function showAssetQR(name){
    let modal=document.getElementById('sourceQRModal');
    if(!modal){
      modal=document.createElement('div'); modal.id='sourceQRModal'; modal.className='fixed inset-0 z-[80] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4';
      modal.innerHTML='<div class="card w-full max-w-md p-6 text-center"><div class="flex justify-between items-center"><div class="text-lg font-black">QR Code do Ativo</div><button id="sourceQRClose" class="w-9 h-9 rounded-lg bg-slate-800">✕</button></div><div id="sourceQRBox" class="my-5 flex justify-center min-h-[220px] items-center"></div><div id="sourceQRName" class="font-bold"></div><p class="text-xs text-slate-500 mt-2">Código identificador do equipamento.</p><div class="flex gap-2 mt-5"><button id="sourceQRPrint" class="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl py-2 font-black text-sm">🖨️ Imprimir</button><button id="sourceQROpen" class="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2 font-black text-sm">Emitir O.S.</button></div></div>';
      document.body.appendChild(modal); modal.querySelector('#sourceQRClose').onclick=()=>{modal.classList.add('hidden');modal.classList.remove('flex')}; modal.querySelector('#sourceQROpen').onclick=()=>{modal.classList.add('hidden');modal.classList.remove('flex');window.newOS&&window.newOS()}; modal.querySelector('#sourceQRPrint').onclick=()=>window.print();
    }
    modal.querySelector('#sourceQRName').textContent=name; const box=modal.querySelector('#sourceQRBox'); box.innerHTML='';
    if(window.QRCode)new QRCode(box,{text:'SENAI-CMMS|ATIVO|'+name,width:210,height:210,correctLevel:QRCode.CorrectLevel.M});
    else {const d=document.createElement('div');d.className='rounded-xl bg-slate-900 border border-slate-700 p-8 text-slate-400 text-sm';d.textContent='Biblioteca de QR Code não carregada.';box.appendChild(d)}
    modal.classList.remove('hidden');modal.classList.add('flex');
  }
  window.showAssetQR=showAssetQR;

  function installPrintActions(){
    const osList=document.getElementById('osList'); if(!osList||osList.dataset.printActions)return; osList.dataset.printActions='1';
    const observer=new MutationObserver(()=>osList.querySelectorAll('tr').forEach(row=>{
      if(row.querySelector('.source-print-os'))return; const first=row.querySelector('td'),action=row.lastElementChild;if(!first||!action)return; const id=(first.textContent||'').replace('#','').trim();
      const b=document.createElement('button'); b.className='source-print-os ml-1 bg-slate-700 hover:bg-slate-600 rounded-lg px-2 py-1.5 text-xs'; b.title='Imprimir O.S.'; b.innerHTML='🖨️'; b.onclick=()=>printOSRow(row,id); action.appendChild(b);
    })); observer.observe(osList,{childList:true,subtree:true});
  }
  function printOSRow(row,id){
    const cells=[...row.querySelectorAll('td')].map(x=>x.textContent.trim()); const w=window.open('','_blank','width=900,height=700'); if(!w)return;
    w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ordem de Serviço '+esc(id)+'</title><style>body{font-family:Arial;padding:35px;color:#111}h1{border-bottom:2px solid #111;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:25px}td{padding:10px;border-bottom:1px solid #ddd}td:first-child{font-weight:700;width:180px}</style></head><body><h1>ORDEM DE SERVIÇO - SENAI</h1><table>'+['OS','Equipamento','Descrição','Tipo','Prioridade','Status','Custo'].map((k,i)=>'<tr><td>'+k+'</td><td>'+esc(cells[i]||'-')+'</td></tr>').join('')+'</table><p style="margin-top:30px">Emitido pelo CMMS SENAI Manutenção 4.0</p><script>window.print();<\/script></body></html>');w.document.close();
  }

  function installAdvancedDashboard(){
    const dash=document.getElementById('dashboard'); if(!dash||document.getElementById('sourceAdvancedCharts'))return;
    const box=document.createElement('div'); box.id='sourceAdvancedCharts'; box.className='grid lg:grid-cols-2 gap-5 mt-5';
    box.innerHTML='<div class="card p-5"><div class="flex justify-between"><div><h3 class="font-black">Proporção de Manutenções</h3><p class="text-xs text-slate-500">Preventiva x corretiva x preditiva</p></div><span class="status bg-blue-500/10 text-blue-400">ANÁLISE</span></div><canvas id="sourceTypeChart" height="120"></canvas></div><div class="card p-5"><div class="flex justify-between"><div><h3 class="font-black">Status Operacional da Linha</h3><p class="text-xs text-slate-500">Visão consolidada dos ativos</p></div><span class="status bg-emerald-500/10 text-emerald-400">REALTIME</span></div><canvas id="sourceAssetChart" height="120"></canvas></div>';
    dash.appendChild(box); let c1,c2;
    const draw=()=>{if(!window.Chart)return;const s=cmmsState(),orders=Object.values(s.orders||{}),eqs=Object.values(s.equipments||{});const types=['Preventiva','Corretiva','Preditiva'],tdata=types.map(t=>orders.filter(o=>o.type===t).length),sdata=['Operando','Em Manutenção','Parado'].map(x=>eqs.filter(e=>(e.status||'Operando')===x).length);if(c1)c1.destroy();if(c2)c2.destroy();c1=new Chart(document.getElementById('sourceTypeChart'),{type:'doughnut',data:{labels:types,datasets:[{data:tdata}]},options:{responsive:true,plugins:{legend:{labels:{color:'#cbd5e1'}}}}});c2=new Chart(document.getElementById('sourceAssetChart'),{type:'doughnut',data:{labels:['Operando','Em Manutenção','Parado'],datasets:[{data:sdata}]},options:{responsive:true,plugins:{legend:{labels:{color:'#cbd5e1'}}}}})};
    const oldRender=window.cmmsRender; if(typeof oldRender==='function'&&!oldRender.__sourceWrapped){const wrapped=function(){oldRender.apply(this,arguments);setTimeout(draw,0)};wrapped.__sourceWrapped=true;window.cmmsRender=wrapped} setTimeout(draw,800);
    window.sourceRefreshCharts=draw;
  }

  function init(){installSimulationButton();installEquipmentActions();installPrintActions();installAdvancedDashboard();setTimeout(()=>{installSimulationButton();installEquipmentActions();installPrintActions();},1200)}
  function installSimulationButton(){const btn=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('SIMULAR CASO'));if(btn)btn.onclick=window.simulateCase}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
