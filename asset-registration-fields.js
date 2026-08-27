/* Cadastro de ativos - campos adicionais. Mantém as demais funções da plataforma. */
(function(){
  'use strict';

  function safe(v){
    return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  }

  function field(label,id,type='text',placeholder='',value=''){
    return `<label class="block"><span class="text-xs font-bold text-slate-400">${label}</span><input id="${id}" type="${type}" value="${safe(value)}" placeholder="${placeholder}" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500"></label>`;
  }

  function install(){
    // O formulário original já possui openForm; não dependemos de cmmsRoot
    // para instalar a interface, evitando que o cadastro antigo permaneça ativo.
    if(typeof window.openForm!=='function') return false;

    window.newEquipment=function(){
      window.openForm('Cadastrar Ativo',
        field('Nome do equipamento','eName','text','Ex.: Escavadeira CAT 320')+
        field('Código / TAG','eCode','text','Ex.: EQ-001')+
        field('Modelo','eModel','text','Ex.: 320 GC')+
        field('Fabricante','eManufacturer','text','Ex.: Caterpillar')+
        field('Número de série','eSerial','text','Ex.: CAT320-2026-001')+
        field('Localização','eLoc','text','Ex.: Linha 01')+
        `<div class="grid sm:grid-cols-2 gap-3">`+
          field('Ano de fabricação','eYear','number','Ex.: 2024')+
          field('Setor / Centro de custo','eSector','text','Ex.: Produção / CC-001')+
        `</div>`+
        `<div class="grid sm:grid-cols-2 gap-3">`+
          field('Horímetro (h)','eHorimetro','number','Ex.: 1250')+
          field('Limite preventiva (h)','ePreventiveLimit','number','Ex.: 1500')+
        `</div>`+
        `<label class="block"><span class="text-xs font-bold text-slate-400">Criticidade</span><select id="eCriticality" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500"><option value="Baixa">Baixa</option><option value="Média" selected>Média</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select></label>`+
        field('Responsável pelo ativo','eResponsible','text','Ex.: João da Silva')+
        field('Tipo do equipamento','eType','text','Ex.: Escavadeira hidráulica'),
        async function(){
          const root=window.cmmsRoot;
          if(!root) return alert('Firebase ainda não está disponível.');
          const name=document.getElementById('eName');
          const r=root.child('equipments').push();
          await r.set({
            name:name.value.trim(),
            code:document.getElementById('eCode').value.trim(),
            model:document.getElementById('eModel').value.trim(),
            manufacturer:document.getElementById('eManufacturer').value.trim(),
            serialNumber:document.getElementById('eSerial').value.trim(),
            type:document.getElementById('eType').value.trim(),
            location:document.getElementById('eLoc').value.trim(),
            year:document.getElementById('eYear').value===''?null:Number(document.getElementById('eYear').value),
            sector:document.getElementById('eSector').value.trim(),
            responsible:document.getElementById('eResponsible').value.trim(),
            horimetro:document.getElementById('eHorimetro').value===''?null:Number(document.getElementById('eHorimetro').value),
            preventiveLimit:document.getElementById('ePreventiveLimit').value===''?null:Number(document.getElementById('ePreventiveLimit').value),
            criticality:document.getElementById('eCriticality').value,
            status:'Operando',
            createdAt:firebase.database.ServerValue.TIMESTAMP,
            createdByDevice:window.deviceId||'DEV-NAVEGADOR'
          });
          window.closeModal();
        }
      );
    };
    return true;
  }

  // O HTML principal é carregado dinamicamente; tenta instalar imediatamente
  // e continua tentando por alguns segundos até openForm existir.
  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{
      if(install()||++tries>80) clearInterval(timer);
    },250);
  }
})();