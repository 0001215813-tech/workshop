/* QR Code robusto: não depende da biblioteca QRCodeJS/CDN. */
(function(){
  'use strict';
  function buildQRUrl(name){
    const pdfUrl=new URL('./?asset='+encodeURIComponent(name||'Ativo')+'&pdf=1&v=pdf3',window.location.href).href;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data='+encodeURIComponent(pdfUrl);
  }
  function patchAssetQR(){
    if(typeof window.showAssetQR!=='function') return false;
    if(window.showAssetQR.__qrDirectPatched) return true;
    const direct=function(name){
      let modal=document.getElementById('sourceQRModal');
      if(!modal){
        modal=document.createElement('div');
        modal.id='sourceQRModal';
        modal.className='fixed inset-0 z-[80] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4';
        modal.innerHTML='<div class="card w-full max-w-md p-6 text-center"><div class="flex justify-between items-center"><div class="text-lg font-black">QR Code do Ativo</div><button id="sourceQRClose" class="w-9 h-9 rounded-lg bg-slate-800">✕</button></div><div id="sourceQRBox" class="my-5 flex justify-center min-h-[220px] items-center"></div><div id="sourceQRName" class="font-bold"></div><p class="text-xs text-slate-500 mt-2">Escaneie este código para abrir a ficha PDF do equipamento.</p><div class="flex gap-2 mt-5"><button id="sourceQRPrint" class="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl py-2 font-black text-sm">🖨️ Imprimir QR</button><button id="sourceQROpen" class="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2 font-black text-sm">Emitir O.S.</button></div></div>';
        document.body.appendChild(modal);
        modal.querySelector('#sourceQRClose').onclick=()=>{modal.classList.add('hidden');modal.classList.remove('flex')};
        modal.querySelector('#sourceQROpen').onclick=()=>{modal.classList.add('hidden');modal.classList.remove('flex');window.newOS&&window.newOS()};
        modal.querySelector('#sourceQRPrint').onclick=()=>window.print();
      }
      modal.querySelector('#sourceQRName').textContent=name||'Ativo';
      const box=modal.querySelector('#sourceQRBox');
      box.innerHTML='';
      const img=document.createElement('img');
      img.width=210; img.height=210;
      img.alt='QR Code do ativo '+(name||'Ativo');
      img.style.width='210px'; img.style.height='210px'; img.style.background='#fff'; img.style.padding='8px'; img.style.borderRadius='12px';
      img.src=buildQRUrl(name);
      img.onerror=function(){box.innerHTML='<div class="rounded-xl bg-slate-900 border border-red-500/30 p-8 text-red-300 text-sm">Não foi possível gerar o QR Code. Verifique a conexão com a internet e tente novamente.</div>'};
      box.appendChild(img);
      modal.classList.remove('hidden'); modal.classList.add('flex');
    };
    direct.__qrDirectPatched=true;
    window.showAssetQR=direct;
    return true;
  }
  function start(){
    patchAssetQR();
    let tries=0;
    const timer=setInterval(()=>{if(patchAssetQR()||++tries>100) clearInterval(timer)},200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
