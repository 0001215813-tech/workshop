/* Campos adicionais da O.S. — mantém a base e o Firebase existentes. */
(function(){
'use strict';
function safeOS(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function localDateTimeValue(date){
  const d=date||new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
async function newOSCompleta(){
  if(typeof openForm!=='function'){alert('Aguarde o formulário carregar.');return;}
  const st=window.cmmsState||{};
  const eqs=st.equipments||{};
  const parts=st.parts||{};
  let eqEntries=Object.entries(eqs);
  // Fallback direto no mesmo caminho usado pelo restante do sistema.
  // Isso corrige apenas o carregamento dos equipamentos no formulário de O.S.
  if(!eqEntries.length && typeof firebase!=='undefined' && firebase.database){
    try{
      const snap=await firebase.database().ref('workshopCMMS/equipments').once('value');
      const directEquipments=snap.val()||{};
      eqEntries=Object.entries(directEquipments);
    }catch(err){console.error('Falha ao carregar equipamentos para O.S.',err);}
  }
  const partEntries=Object.entries(parts);
  const eqOptions=eqEntries.length?eqEntries.map(([id,e])=>`<option value="${safeOS(e.name||id)}" data-equipment-id="${safeOS(id)}">${safeOS(e.name||id)}${e.code?' — '+safeOS(e.code):''}</option>`).join(''):'<option value="">Nenhum equipamento cadastrado</option>';
  const partOptions='<option value="">Nenhuma Peça (R$ 0,00)</option>'+partEntries.map(([id,p])=>{const name=p.name||p.item||id;const price=Number(p.cost??p.price??p.unitCost??0);return `<option value="${safeOS(name)}" data-cost="${price}">${safeOS(name)} (R$ ${price.toLocaleString('pt-BR',{minimumFractionDigits:2})})</option>`}).join('');
  const openedAt=new Date();
  const openedAtValue=localDateTimeValue(openedAt);
  const html=`
  <label class="block"><span class="text-xs font-bold text-slate-400">Selecione o Equipamento:</span><select id="fEq" required class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500"><option value="">Selecione...</option>${eqOptions}</select></label>
  <div class="grid sm:grid-cols-2 gap-3">
    <label><span class="text-xs font-bold text-slate-400">Tipo de Intervenção:</span><select id="fType" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700"><option value="Preventiva">Preventiva (Revisão Programada)</option><option value="Corretiva">Corretiva (Falha)</option><option value="Preditiva">Preditiva (Inspeção)</option></select></label>
    <label><span class="text-xs font-bold text-slate-400">Técnico Responsável:</span><select id="fTech" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700"><option>Carlos Silva (Turno A)</option><option>Ana Souza (Turno B)</option><option>João Santos (Turno C)</option><option>Equipe de Manutenção</option></select></label>
  </div>
  <div id="preventiveScheduleField" class="block rounded-xl border border-blue-900/60 bg-blue-950/20 p-3">
    <span class="text-xs font-bold text-blue-300">Agendamento da Manutenção Preventiva:</span>
    <div class="mt-1 text-xs text-slate-400">Escolha a data e o horário. O agendamento não pode ser anterior ao momento de abertura desta O.S.</div>
    <input id="fScheduledAt" type="datetime-local" min="${openedAtValue}" value="${openedAtValue}" class="mt-2 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-blue-500">
  </div>
  <label class="block"><span class="text-xs font-bold text-slate-400">Categoria da Falha:</span><select id="fCategory" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700"><option>N/A - Preventiva</option><option>Falha Mecânica</option><option>Falha Elétrica</option><option>Falha Hidráulica</option><option>Vazamento</option><option>Desgaste de Componente</option><option>Lubrificação</option><option>Outro</option></select></label>
  <label class="block"><span class="text-xs font-bold text-slate-400">Peça do Estoque Necessária:</span><select id="fPart" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700">${partOptions}</select></label>
  <div class="grid sm:grid-cols-2 gap-3">
    <label><span class="text-xs font-bold text-slate-400">Tempo Parada (Minutos):</span><input id="fDowntime" type="number" min="0" step="1" placeholder="Ex: 30" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700"></label>
    <label><span class="text-xs font-bold text-slate-400">Custo Mão de Obra (R$):</span><input id="fLabor" type="number" min="0" step="0.01" placeholder="Ex: 150" value="0" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700"></label>
  </div>
  <label class="block"><span class="text-xs font-bold text-slate-400">Status Inicial da O.S.:</span><select id="fStatus" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700"><option>Concluída</option><option>Pendente</option><option>Em andamento</option></select></label>
  <label class="block"><span class="text-xs font-bold text-slate-400">Descrição / Diagnóstico Técnico:</span><textarea id="fDesc" required rows="3" class="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700" placeholder="Insira a causa raiz ou ação preventiva efetuada"></textarea></label>`;
  openForm('Emissão e Gestão de Ordem de Serviço',html,async()=>{
    const root=window.cmmsRoot||null;
    if(!root){alert('Firebase ainda não está disponível.');return;}
    const eq=fEq.value.trim();
    if(!eq){alert('Selecione o equipamento.');return;}
    const selectedEquipment=fEq.options[fEq.selectedIndex];
    const equipmentId=selectedEquipment?.dataset?.equipmentId||'';
    const selectedPart=fPart.options[fPart.selectedIndex];
    const partCost=Number(selectedPart?.dataset?.cost||0);
    const labor=Number(fLabor.value||0);
    const total=partCost+labor;
    const initialStatus=fStatus.value;
    const interventionType=fType.value;
    const scheduledAtValue=(interventionType==='Preventiva'?(fScheduledAt?.value||''):'');

    if(interventionType==='Preventiva' && scheduledAtValue){
      const scheduledDate=new Date(scheduledAtValue);
      if(Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime()<openedAt.getTime()-60000){
        alert('A data e o horário da manutenção preventiva não podem ser anteriores ao momento de abertura da O.S.');
        return;
      }
    }

    let assetStatus=null;
    if(initialStatus==='Em andamento'){
      assetStatus='Em manutenção';
    }else if(initialStatus==='Pendente' && (interventionType==='Corretiva' || interventionType==='Preditiva')){
      assetStatus='Parado';
    }else if(initialStatus==='Pendente' && interventionType==='Preventiva'){
      assetStatus='Operando - manutenção preventiva agendada';
    }

    const r=root.child('orders').push();
    const data={
      equipment:eq,
      equipmentId:equipmentId,
      description:fDesc.value.trim(),
      type:interventionType,
      interventionType:interventionType,
      technician:fTech.value,
      failureCategory:fCategory.value,
      requiredPart:fPart.value||'',
      partCost:partCost,
      downtimeMinutes:Number(fDowntime.value||0),
      laborCost:labor,
      priority:interventionType==='Corretiva'?'Alta':'Média',
      status:initialStatus,
      cost:total,
      createdAt:firebase.database.ServerValue.TIMESTAMP,
      createdByDevice:typeof deviceId!=='undefined'?deviceId:'DEV-NAVEGADOR',
      scheduledAt:scheduledAtValue?new Date(scheduledAtValue).getTime():null
    };

    await r.set(data);

    if(assetStatus && equipmentId){
      await root.child('equipments/'+equipmentId).update({status:assetStatus});
    }

    closeModal();
    if(typeof tab==='function')tab('ordens');
  });

  const type=document.getElementById('fType');
  const schedule=document.getElementById('preventiveScheduleField');
  const scheduled=document.getElementById('fScheduledAt');
  function updateScheduleVisibility(){
    if(!type||!schedule)return;
    const isPreventive=type.value==='Preventiva';
    schedule.style.display=isPreventive?'block':'none';
    if(isPreventive && scheduled && !scheduled.value)scheduled.value=openedAtValue;
  }
  if(type)type.addEventListener('change',updateScheduleVisibility);
  updateScheduleVisibility();

  const part=document.getElementById('fPart');
  const labor=document.getElementById('fLabor');
  if(part&&labor)part.addEventListener('change',()=>{const o=part.options[part.selectedIndex];const pc=Number(o?.dataset?.cost||0);if(!Number(labor.value))labor.value=0;part.title=`Custo da peça: R$ ${pc.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;});
}
function install(){
  window.newOS=newOSCompleta;
  document.querySelectorAll('[onclick="newOS()"], [onclick="newOS() "]').forEach(b=>b.onclick=newOSCompleta);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50));else setTimeout(install,50);
setTimeout(install,1000);
})();