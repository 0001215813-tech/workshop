/* Correção do QR Code: garante carregamento da biblioteca mesmo quando o CDN principal falhar. */
(function(){
  'use strict';
  const QR_SOURCES=[
    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
  ];
  let loading=null;

  function loadQR(){
    if(window.QRCode) return Promise.resolve(true);
    if(loading) return loading;
    loading=new Promise(resolve=>{
      let index=0;
      const next=()=>{
        if(window.QRCode) return resolve(true);
        if(index>=QR_SOURCES.length) return resolve(false);
        const s=document.createElement('script');
        s.src=QR_SOURCES[index++];
        s.async=true;
        s.onload=()=>resolve(!!window.QRCode);
        s.onerror=next;
        document.head.appendChild(s);
      };
      next();
    });
    return loading;
  }

  function patchAssetQR(){
    if(typeof window.showAssetQR!=='function') return false;
    if(window.showAssetQR.__qrFallbackPatched) return true;
    const original=window.showAssetQR;
    const wrapped=function(name){
      loadQR().then(()=>original(name));
    };
    wrapped.__qrFallbackPatched=true;
    wrapped.__original=original;
    window.showAssetQR=wrapped;
    return true;
  }

  function start(){
    patchAssetQR();
    let tries=0;
    const timer=setInterval(()=>{
      if(patchAssetQR()||++tries>100) clearInterval(timer);
    },200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();

  // Mantém também a função auxiliar existente para qualquer botão adicional de QR.
  window.showEquipmentQR=function(name,type,location){
    loadQR().then(ok=>{
      if(!ok){ alert('Não foi possível carregar a biblioteca de QR Code.'); return; }
      let modal=document.getElementById('qrEquipmentModal');
      if(!modal){
        modal=document.createElement('div');
        modal.id='qrEquipmentModal';
        modal.className='fixed inset-0 z-[999] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4';
        modal.innerHTML='<div class="card w-full max-w-sm p-6 text-center"><div class="flex justify-between items-center mb-4"><div><div class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Identificação do ativo</div><h3 id="qrTitle" class="text-xl font-black"></h3></div><button id="qrClose" class="w-9 h-9 rounded-lg bg-slate-800">✕</button></div><div id="qrBox" class="bg-white rounded-2xl p-5 inline-flex justify-center"></div><p id="qrInfo" class="text-xs text-slate-400 mt-4"></p><button id="qrPrint" class="mt-4 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black"><i class="fa-solid fa-print mr-2"></i>Imprimir QR Code</button></div>';
        document.body.appendChild(modal);
        document.getElementById('qrClose').onclick=()=>modal.classList.add('hidden');
        document.getElementById('qrPrint').onclick=()=>window.print();
        modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
      }
      document.getElementById('qrTitle').textContent=name||'Equipamento';
      document.getElementById('qrInfo').textContent=[type,location].filter(Boolean).join(' • ');
      const box=document.getElementById('qrBox');
      box.innerHTML='';
      const payload=JSON.stringify({sistema:'SENAI Manutenção 4.0',equipamento:name||'',tipo:type||'',localizacao:location||'',url:window.location.href});
      new QRCode(box,{text:payload,width:230,height:230,colorDark:'#0f172a',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  };
})();
