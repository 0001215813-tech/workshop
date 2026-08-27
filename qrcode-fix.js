/* QR Code robusto: resolve o ativo pelo estado local e, se necessario, consulta o Firebase antes de gerar o QR. */
(function(){
  'use strict';
  function normalize(e,name){
    e=e||{};
    return {
      name:e.name??e.nome??e.equipmentName??name??'Ativo',
      code:e.code??e.tag??e.codigo??e.assetCode??'',
      model:e.model??e.modelo??e.typeModel??'',
      manufacturer:e.manufacturer??e.fabricante??'',
      serialNumber:e.serialNumber??e.serial??e.numeroSerie??e.serie??'',
      type:e.type??e.tipo??e.equipmentType??'',
      location:e.location??e.localizacao??e.local??'',
      year:e.year??e.ano??e.manufactureYear??'',
      sector:e.sector??e.costCenter??e.centroCusto??'',
      responsible:e.responsible??e.responsavel??e.assetResponsible??'',
      horimetro:e.horimetro??e.hourmeter??e.horimeter??null,
      preventiveLimit:e.preventiveLimit??e.preventive_limit??e.limitePreventiva??null,
      criticality:e.criticality??e.criticidade??'Média',
      status:e.status??'Operando',
      createdAt:e.createdAt??null,
      createdByDevice:e.createdByDevice??''
    };
  }
  function findLocal(name){
    try{
      const eqs=(window.cmmsState&&window.cmmsState.equipments)||{};
      const target=String(name||'').trim().toLowerCase();
      const vals=Array.isArray(eqs)?eqs:Object.values(eqs);
      return vals.find(e=>String(e?.name??e?.nome??e?.equipmentName??'').trim().toLowerCase()===target)||null;
    }catch(e){return null;}
  }
  async function findFirebase(name){
    try{
      const root=window.cmmsRoot||(window.firebase&&firebase.database?firebase.database().ref('workshopCMMS'):null);
      if(!root)return null;
      const snap=await root.child('equipments').once('value');
      let found=null; const target=String(name||'').trim().toLowerCase();
      snap.forEach(c=>{const e=c.val()||{};const n=String(e.name??e.nome??e.equipmentName??'').trim().toLowerCase();if(!found&&n===target)found=e;});
      return found;
    }catch(e){console.warn('Busca Firebase do ativo para QR',e);return null;}
  }
  function encode(obj){try{return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}catch(e){return ''}}
  function buildQRUrl(asset){
    const data=encode(normalize(asset,asset?.name||'Ativo'));
    const pdfUrl=new URL('./?asset='+encodeURIComponent(asset?.name||'Ativo')+'&assetData='+encodeURIComponent(data)+'&pdf=1&v=pdf6',window.location.href).href;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data='+encodeURIComponent(pdfUrl);
  }
  function close(modal){modal.classList.add('hidden');modal.classList.remove('flex')}
  async function direct(name){
    let modal=document.getElementById('sourceQRModal');
    if(!modal){
      modal=document.createElement('div');modal.id='sourceQRModal';modal.className='fixed inset-0 z-[80] hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4';
      modal.innerHTML='<div class="card w-full max-w-md p-6 text-center"><div class="flex justify-between items-center"><div class="text-lg font-black">QR Code do Ativo</div><button id="sourceQRClose" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700">✕</button></div><div id="sourceQRBox" class="my-5 flex justify-center min-h-[220px] items-center"></div><div id="sourceQRName" class="font-bold"></div><p class="text-xs text-slate-500 mt-2">Escaneie este codigo para abrir a ficha tecnica completa do equipamento.</p><div class="flex gap-2 mt-5"><button id="sourceQRPrint" class="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl py-2 font-black text-sm">🖨️ Imprimir QR</button><button id="sourceQROpen" class="flex-1 bg-slate-800 hover:bg-slate-700 rounded-xl py-2 font-black text-sm">Emitir O.S.</button></div></div>';
      document.body.appendChild(modal);modal.querySelector('#sourceQRClose').onclick=()=>close(modal);modal.querySelector('#sourceQROpen').onclick=()=>{close(modal);if(typeof window.newOS==='function')window.newOS()};modal.querySelector('#sourceQRPrint').onclick=()=>window.print();
    }
    modal.querySelector('#sourceQRName').textContent=name||'Ativo';const box=modal.querySelector('#sourceQRBox');box.innerHTML='<div class="text-sm text-slate-400">Carregando dados do ativo...</div>';modal.classList.remove('hidden');modal.classList.add('flex');
    let asset=findLocal(name);if(!asset)asset=await findFirebase(name);asset=normalize(asset,name);
    const img=document.createElement('img');img.width=210;img.height=210;img.alt='QR Code do ativo '+asset.name;img.style.cssText='width:210px;height:210px;background:#fff;padding:8px;border-radius:12px;display:block';img.src=buildQRUrl(asset);img.onerror=function(){box.innerHTML='<div class="rounded-xl bg-slate-900 border border-red-500/30 p-8 text-red-300 text-sm">Nao foi possivel gerar o QR Code. Verifique a conexao com a internet e tente novamente.</div>'};box.innerHTML='';box.appendChild(img);
  }
  direct.__qrDirectPatched=true;window.showAssetQR=direct;
  document.addEventListener('click',function(e){const btn=e.target.closest&&e.target.closest('button');if(!btn)return;const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(text.includes('qr do ativo')){e.preventDefault();e.stopImmediatePropagation();const card=btn.closest('.card');const title=card&&card.querySelector('h3');direct(title?title.textContent.trim():'Ativo')}},true);
})();