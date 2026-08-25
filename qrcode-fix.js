(function(){
  const QR_SRC='https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
  function loadQR(cb){
    if(window.QRCode)return cb();
    const s=document.createElement('script');s.src=QR_SRC;s.onload=cb;s.onerror=()=>console.warn('QRCode.js não carregou');document.head.appendChild(s);
  }
  function openQR(name,type,location){
    loadQR(function(){
      let modal=document.getElementById('qrEquipmentModal');
      if(!modal){
        modal=document.createElement('div');modal.id='qrEquipmentModal';modal.className='fixed inset-0 z-[999] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4';
        modal.innerHTML='<div class="card w-full max-w-sm p-6 text-center"><div class="flex justify-between items-center mb-4"><div><div class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Identificação do ativo</div><h3 id="qrTitle" class="text-xl font-black"></h3></div><button id="qrClose" class="w-9 h-9 rounded-lg bg-slate-800">✕</button></div><div id="qrBox" class="bg-white rounded-2xl p-5 inline-flex justify-center"></div><p id="qrInfo" class="text-xs text-slate-400 mt-4"></p><button id="qrPrint" class="mt-4 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black"><i class="fa-solid fa-print mr-2"></i>Imprimir QR Code</button></div>';
        document.body.appendChild(modal);document.getElementById('qrClose').onclick=()=>modal.classList.add('hidden');document.getElementById('qrPrint').onclick=()=>window.print();modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
      }
      document.getElementById('qrTitle').textContent=name||'Equipamento';
      document.getElementById('qrInfo').textContent=[type,location].filter(Boolean).join(' • ');
      const box=document.getElementById('qrBox');box.innerHTML='';
      const payload=JSON.stringify({sistema:'SENAI Manutenção 4.0',equipamento:name||'',tipo:type||'',localizacao:location||'',url:location.href});
      new QRCode(box,{text:payload,width:230,height:230,colorDark:'#0f172a',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
      modal.classList.remove('hidden');modal.classList.add('flex');
    });
  }
  window.showEquipmentQR=openQR;
  function enhance(){
    const list=document.getElementById('equipmentList');if(!list)return;
    Array.from(list.children).forEach(card=>{
      if(card.dataset.qrReady)return;
      const name=card.querySelector('b')?.textContent?.trim()||'Equipamento';
      const info=Array.from(card.querySelectorAll('.text-xs')).map(x=>x.textContent.trim());
      const type=(info[0]||'').split('•')[0]?.trim()||'';const location=(info[0]||'').split('•')[1]?.trim()||'';
      const btn=document.createElement('button');btn.type='button';btn.className='mt-4 w-full p-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-xs font-black transition';btn.innerHTML='<i class="fa-solid fa-qrcode mr-2"></i>Gerar QR Code';btn.onclick=()=>openQR(name,type,location);card.appendChild(btn);card.dataset.qrReady='1';
    });
  }
  const start=()=>{enhance();const list=document.getElementById('equipmentList');if(list)new MutationObserver(enhance).observe(list,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
