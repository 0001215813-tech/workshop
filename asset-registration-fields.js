/* Campos adicionais do cadastro de ativos. Mantém a base e o Firebase existentes. */
(function(){
  'use strict';
  function safe(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  function field(label,id,type='text',placeholder='',value=''){
    return `<label class="block"><span class="text-xs font-bold text-slate-400">${label}</span><input id="${id}" type="${type}" value="${safe(value)}" placeholder="${placeholder}" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500"></label>`;
  }
  function install(){
    if(typeof window.openForm!=='function' || typeof window.cmmsRoot==='undefined') return false;
    window.newEquipment=function(){
      window.openForm('Cadastrar Ativo',
        field('Nome do equipamento','eName','text','Ex.: Escavadeira CAT 320')+
        field('Código / TAG','eCode','text','Ex.: EQ-001')+
        field('Modelo','eModel','text','Ex.: 320 GC')+
        field('Fabricante','eManufacturer','text','Ex.: Caterpillar')+
        field('Número de série','eSerial','text','Ex.: CAT320-2026-001')+
        field('Localização','eLoc','text','Ex.: Linha 01')+
        `<div class="grid sm:grid-cols-2 gap-3">`+
          field('Ano de fabricação','eYear','number','Ex.: 2024','')+
          field('Setor / Centro de custo','eSector','text','Ex.: Produção / CC-001','')+
        `</div>`+
        `<div class="grid sm:grid-cols-2 gap-3">`+
          field('Horímetro (h)','eHorimetro','number','Ex.: 1250','')+
          field('Limite preventiva (h)','ePreventiveLimit','number','Ex.: 1500','')+
        `</div>`+
        `<label class="block"><span class="text-xs font-bold text-slate-400">Criticidade</span><select id="eCriticality" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500"><option value="Baixa">Baixa</option><option value="Média" selected>Média</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select></label>`+
        field('Responsável pelo ativo','eResponsible','text','Ex.: João da Silva')+
        field('Tipo do equipamento','eType','text','Ex.: Escavadeira hidráulica'),
        async function(){
          const root=window.cmmsRoot;
          if(!root) return alert('Firebase ainda não está disponível.');
          const r=root.child('equipments').push();
          await r.set({
            name:eName.value,
            code:eCode.value.trim(),
            model:eModel.value.trim(),
            manufacturer:eManufacturer.value.trim(),
            serialNumber:eSerial.value.trim(),
            type:eType.value.trim(),
            location:eLoc.value.trim(),
            year:eYear.value===''?null:Number(eYear.value),
            sector:eSector.value.trim(),
            responsible:eResponsible.value.trim(),
            horimetro:eHorimetro.value===''?null:Number(eHorimetro.value),
            preventiveLimit:ePreventiveLimit.value===''?null:Number(ePreventiveLimit.value),
            criticality:eCriticality.value,
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
  if(!install()){
    let tries=0; const timer=setInterval(()=>{if(install()||++tries>40)clearInterval(timer)},250);
  }
})();