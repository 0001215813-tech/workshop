(()=>{
  const XLSX_URL='https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
  let loading=null;
  function loadXLSX(){
    if(window.XLSX) return Promise.resolve(window.XLSX);
    if(loading) return loading;
    loading=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=XLSX_URL;
      s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('Biblioteca XLSX não carregou'));
      s.onerror=()=>reject(new Error('Não foi possível carregar o gerador XLSX'));
      document.head.appendChild(s);
    });
    return loading;
  }
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const dt=v=>v?new Date(v).toLocaleDateString('pt-BR'):'-';
  const style={
    title:{fill:{fgColor:{rgb:'1F4E79'}},font:{color:{rgb:'FFFFFF'},bold:true,sz:14},alignment:{horizontal:'center',vertical:'center'}},
    header:{fill:{fgColor:{rgb:'2F5597'}},font:{color:{rgb:'FFFFFF'},bold:true},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'D9D9D9'}},bottom:{style:'thin',color:{rgb:'D9D9D9'}},left:{style:'thin',color:{rgb:'D9D9D9'}},right:{style:'thin',color:{rgb:'D9D9D9'}}}},
    cell:{border:{top:{style:'thin',color:{rgb:'D9D9D9'}},bottom:{style:'thin',color:{rgb:'D9D9D9'}},left:{style:'thin',color:{rgb:'D9D9D9'}},right:{style:'thin',color:{rgb:'D9D9D9'}}},alignment:{vertical:'center',wrapText:true}},
    kpiLabel:{fill:{fgColor:{rgb:'EDF2F8'}},font:{color:{rgb:'595959'},bold:true},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'D9D9D9'}},bottom:{style:'thin',color:{rgb:'D9D9D9'}},left:{style:'thin',color:{rgb:'D9D9D9'}},right:{style:'thin',color:{rgb:'D9D9D9'}}}},
    kpiValue:{fill:{fgColor:{rgb:'EDF2F8'}},font:{color:{rgb:'1F4E79'},bold:true,sz:14},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'thin',color:{rgb:'D9D9D9'}},bottom:{style:'thin',color:{rgb:'D9D9D9'}},left:{style:'thin',color:{rgb:'D9D9D9'}},right:{style:'thin',color:{rgb:'D9D9D9'}}}}
  };
  function setRangeStyle(ws,range,s){
    const r=XLSX.utils.decode_range(range);
    for(let R=r.s.r;R<=r.e.r;R++)for(let C=r.s.c;C<=r.e.c;C++){
      const a=XLSX.utils.encode_cell({r:R,c:C}); ws[a]??={v:''}; ws[a].s=s;
    }
  }
  function makeOSSheet(X,orders){
    const rows=[['REGISTRO DE ORDENS DE SERVIÇO DE MANUTENÇÃO'],[],['Nº OS','Data Abertura','Equipamento','Setor','Tipo','Prioridade','Descrição da Falha / Serviço','Técnico Responsável','Data Prevista','Data Conclusão','Custo Peças (R$)','Custo M.O. (R$)','Custo Total (R$)','Status']];
    Object.entries(orders||{}).sort((a,b)=>(a[1].createdAt||0)-(b[1].createdAt||0)).forEach(([id,o])=>rows.push([
      'OS-'+id.slice(-8).toUpperCase(),dt(o.createdAt),o.equipment||'-',o.sector||'-',o.type||'-',o.priority||'-',o.description||'-',o.technician||o.createdByDevice||'-',dt(o.dueDate),dt(o.completedAt),Number(o.partsCost||0),Number(o.laborCost||o.cost||0),Number(o.partsCost||0)+Number(o.laborCost||o.cost||0),o.status||'Pendente'
    ]));
    const ws=X.utils.aoa_to_sheet(rows); ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:13}}]; ws['!freeze']='C4'; ws['!autofilter']={ref:`A3:N${Math.max(3,rows.length)}`}; ws['!cols']=[46,16,26,13,13,13,38,23,16,17,19,18,19,15].map(w=>({wch:w}));
    ws['A1'].s=style.title; setRangeStyle(ws,`A3:N${Math.max(3,rows.length)}`,style.cell); setRangeStyle(ws,'A3:N3',style.header);
    for(let r=4;r<=rows.length;r++){ws[`B${r}`].z='dd/mm/yyyy';ws[`I${r}`].z='dd/mm/yyyy';ws[`J${r}`].z='dd/mm/yyyy';ws[`K${r}`].z='#,##0.00';ws[`L${r}`].z='#,##0.00';ws[`M${r}`].z='#,##0.00';}
    return ws;
  }
  function makePreventiveSheet(X,equip){
    const rows=[['PLANO DE MANUTENÇÃO PREVENTIVA DE EQUIPAMENTOS'],[],['Cód. Equipamento','Equipamento','Setor','Frequência','Última Realizada','Próxima Agendada','Responsável','Status do Plano']];
    Object.entries(equip||{}).forEach(([id,e],i)=>rows.push([e.code||('EQ-'+String(i+1).padStart(3,'0')),e.name||'-',e.sector||e.location||'-',e.frequency||'Mensal',dt(e.lastMaintenance),dt(e.nextMaintenance),e.responsible||e.createdByDevice||'-',e.planStatus||e.status||'Em Dia']));
    const ws=X.utils.aoa_to_sheet(rows); ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:7}}]; ws['!freeze']='C4'; ws['!autofilter']={ref:`A3:H${Math.max(3,rows.length)}`}; ws['!cols']=[50,24,14,14,20,20,24,25].map(w=>({wch:w})); ws['A1'].s=style.title; setRangeStyle(ws,`A3:H${Math.max(3,rows.length)}`,style.cell); setRangeStyle(ws,'A3:H3',style.header); for(let r=4;r<=rows.length;r++){ws[`E${r}`].z='dd/mm/yyyy';ws[`F${r}`].z='dd/mm/yyyy';} return ws;
  }
  function makeDashboard(X,orders){
    const arr=Object.values(orders||{}); const total=arr.length,done=arr.filter(o=>o.status==='Concluída').length,open=arr.filter(o=>o.status!=='Concluída').length,late=arr.filter(o=>o.status==='Atrasado').length,cost=arr.reduce((s,o)=>s+Number(o.partsCost||0)+Number(o.laborCost||o.cost||0),0);
    const rows=[['PAINEL DE CONTROLE DE MANUTENÇÃO E INDICADORES (KPIs)'],[],['TOTAL DE ORDENS DE SERVIÇO','','OS CONCLUÍDAS','','OS EM ANDAMENTO / PENDENTE','','OS EM ATRASO','','CUSTO TOTAL DE MANUTENÇÃO',''],[total,'',done,'',open,'',late,'',cost,'']];
    const ws=X.utils.aoa_to_sheet(rows); ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:10}},{s:{r:2,c:0},e:{r:2,c:1}},{s:{r:2,c:2},e:{r:2,c:3}},{s:{r:2,c:4},e:{r:2,c:5}},{s:{r:2,c:6},e:{r:2,c:7}},{s:{r:2,c:8},e:{r:2,c:9}},{s:{r:3,c:0},e:{r:4,c:1}},{s:{r:3,c:2},e:{r:4,c:3}},{s:{r:3,c:4},e:{r:4,c:5}},{s:{r:3,c:6},e:{r:4,c:7}},{s:{r:3,c:8},e:{r:4,c:9}}]; ws['!cols']=Array.from({length:11},()=>({wch:15})); ws['!cols'][4]={wch:18}; ws['A1'].s=style.title; setRangeStyle(ws,'A3:J3',style.kpiLabel); setRangeStyle(ws,'A4:J5',style.kpiValue); ws['I4'].z='R$ #,##0.00'; ws['!rows']=[{hpt:30},{hpt:8},{hpt:18},{hpt:20},{hpt:20}]; return ws;
  }
  function makeWorkbook(){
    const X=window.XLSX, S=window.state||{}; const wb=X.utils.book_new();
    X.utils.book_append_sheet(wb,makeDashboard(X,S.orders),'Painel de Controle');
    X.utils.book_append_sheet(wb,makeOSSheet(X,S.orders),'Ordens de Serviço');
    X.utils.book_append_sheet(wb,makePreventiveSheet(X,S.equipments),'Plano de Preventivas');
    return wb;
  }
  async function exportFormatted(){
    const btn=document.getElementById('exportXlsxBtn'); if(btn){btn.disabled=true;btn.textContent='Gerando...'}
    try{const X=await loadXLSX(); const wb=makeWorkbook(); const d=new Date(); const stamp=d.toISOString().slice(0,10); X.writeFile(wb,`gestao-manutencao-${stamp}.xlsx`);}
    catch(e){console.error(e);alert('Não foi possível gerar a planilha formatada. Verifique a conexão e tente novamente.');}
    finally{if(btn){btn.disabled=false;btn.textContent='📊 Exportar Excel formatado'}}
  }
  function install(){
    const section=document.getElementById('historico'); if(!section)return;
    const h=section.querySelector('h2'); if(!h||document.getElementById('exportXlsxBtn'))return;
    const b=document.createElement('button'); b.id='exportXlsxBtn'; b.type='button'; b.textContent='📊 Exportar Excel formatado'; b.className='bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-2 text-sm font-bold'; b.onclick=exportFormatted;
    const wrap=document.createElement('div'); wrap.className='flex justify-between items-center gap-3'; h.parentNode.insertBefore(wrap,h); wrap.appendChild(h); wrap.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.exportFormatted=exportFormatted;
})();
