/* QR Code robusto + ficha PDF completa: os dados do ativo viajam no proprio QR. */
(function(){
  'use strict';
  function getAsset(name){
    try{
      const eqs=(window.cmmsState&&window.cmmsState.equipments)||{};
      const target=String(name||'').trim();
      const found=Object.values(eqs).find(e=>String(e&&e.name||'').trim()===target);
      return found||{name:target};
    }catch(e){return {name:name||'Ativo'};}
  }
  function encode(obj){
    try{return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}catch(e){return ''}
  }
  function buildQRUrl(name){
    const data=encode(getAsset(name));
    const pdfUrl=new URL('./?asset='+encodeURIComponent(name||'Ativo')+'&assetData='+encodeURIComponent(data)+'&pdf=1&v=pdf5',window.location.href).href;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data='+encodeURIComponent(pdfUrl);
  }
  function close(modal){modal.classList.add('hidden');modal.classList.remove('flex')}
  function direct(name){
    let modal=document.getElementById('sourceQRModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='sourceQRModal';
      modal.className='fixed inset-0 z-[80] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4';
      modal.innerHTML='<div class="card w-full max-w-md p-6 text-center"><div class="flex justify-between items-center"><div class="text-lg font-black">QR Code do Ativo</div><button id="sourceQRClose" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700">✕</button></div><div id="sourceQRBox" class="my-5 flex justify-center min-h-[220px] items-center"></div><div id="sourceQRName" class="font-bold"></div><p class="text-xs text-slate-500 mt-2">Escaneie este codigo para abrir a ficha tecnica completa do equipamento.</p><div class="flex gap-2 mt-5"><button id="sourceQRPrint" class="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl py-2 font-black text-sm">🖨️ Imprimir QR</button><button id="sourceQROpen" class="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2 font-black text-sm">Emitir O.S.</button></div></div>';
      document.body.appendChild(modal);
      modal.querySelector('#sourceQRClose').onclick=()=>close(modal);
      modal.querySelector('#sourceQROpen').onclick=()=>{close(modal);if(typeof window.newOS==='function')window.newOS()};
      modal.querySelector('#sourceQRPrint').onclick=()=>window.print();
    }
    modal.querySelector('#sourceQRName').textContent=name||'Ativo';
    const box=modal.querySelector('#sourceQRBox');box.innerHTML='';
    const img=document.createElement('img');img.width=210;img.height=210;img.alt='QR Code do ativo '+(name||'Ativo');img.style.cssText='width:210px;height:210px;background:#fff;padding:8px;border-radius:12px;display:block';img.src=buildQRUrl(name);
    img.onerror=function(){box.innerHTML='<div class="rounded-xl bg-slate-900 border border-red-500/30 p-8 text-red-300 text-sm">Nao foi possivel gerar o QR Code. Verifique a conexao com a internet e tente novamente.</div>'};
    box.appendChild(img);modal.classList.remove('hidden');modal.classList.add('flex');
  }
  direct.__qrDirectPatched=true;window.showAssetQR=direct;
  document.addEventListener('click',function(e){const btn=e.target.closest&&e.target.closest('button');if(!btn)return;const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(text.includes('qr do ativo')){e.preventDefault();e.stopImmediatePropagation();const card=btn.closest('.card');const title=card&&card.querySelector('h3');direct(title?title.textContent.trim():'Ativo')}},true);
})();
