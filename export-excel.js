(function(){
'use strict';
function loadXLSX(){return new Promise(function(resolve,reject){if(window.XLSX)return resolve(window.XLSX);var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';s.onload=function(){window.XLSX?resolve(window.XLSX):reject(new Error('Biblioteca Excel não carregou.'))};s.onerror=function(){reject(new Error('Não foi possível carregar o módulo Excel.'))};document.head.appendChild(s)})}
function value(v){if(v==null)return '';if(typeof v==='object')return v.name||v.label||v.value||v.description||'';return v}
function date(v){if(!v)return '';var d=new Date(v);return isNaN(d.getTime())?value(v):d.toLocaleString('pt-BR')}
function list(v){if(!v)return[];if(Array.isArray(v))return v;return Object.keys(v).map(function(k){var x=v[k];if(x==null)x={};if(typeof x==='object'&&!Array.isArray(x)&&!x.__key)x.__key=k;return x})}
function isDone(v){var s=String(value(v&&v.status)||'').trim().toLowerCase();return['concluída','concluida','concluído','concluido','completed','finalizada','finalizado'].indexOf(s)>=0}
function normalize(data){var orders=list(data.orders),history=list(data.history),byId={},rows=[],seen={};orders.forEach(function(o){var id=String(o&&(o.id||o.orderId||o.osId||o.__key)||'');if(id)byId[id]=o});history.forEach(function(h){if(!h)return;var id=String(h.orderId||h.osId||h.orderID||h.id||h.__key||''),merged=Object.assign({},byId[id]||{},h);if(id)merged.id=id;if(!seen[id||String(rows.length)]){seen[id||String(rows.length)]=true;rows.push(merged)}});orders.forEach(function(o){if(!o||!isDone(o))return;var id=String(o.id||o.orderId||o.osId||o.__key||'');if(!seen[id||String(rows.length)]){seen[id||String(rows.length)]=true;rows.push(o)}});return{rows:rows,equipments:list(data.equipments)}}
function makeOSRows(rows){return rows.map(function(v){v=v||{};return{'Nº OS':value(v.orderNumber||v.osNumber||v.orderId||v.osId||v.id||v.__key),'Data Abertura':date(v.createdAt||v.openedAt||v.openDate||v.date),'Equipamento':value(v.equipment||v.equipmentName||v.asset||v.assetName),'Setor':value(v.sector||v.location||v.area),'Tipo':value(v.type||v.interventionType||v.maintenanceType),'Prioridade':value(v.priority),'Descrição / Serviço':value(v.description||v.service||v.event||v.diagnosis),'Técnico':value(v.technician||v.responsible||v.assignedTo||v.createdByDevice),'Data Prevista':date(v.dueDate||v.scheduledAt||v.preventiveDate||v.scheduledDate),'Data Conclusão':date(v.completedAt||v.closedAt||v.completionDate),'Custo Peças (R$)':Number(v.partsCost!=null?v.partsCost:(v.partCost!=null?v.partCost:0)),'Custo M.O. (R$)':Number(v.laborCost!=null?v.laborCost:(v.laborCostBRL!=null?v.laborCostBRL:0)),'Custo Total (R$)':Number(v.totalCost!=null?v.totalCost:(v.cost!=null?v.cost:Number(v.partsCost||v.partCost||0)+Number(v.laborCost||0))),'Status':value(v.status)||'Concluída','Peça Utilizada':value(v.partName||v.part||v.usedPart||v.partUsed),'Quantidade da Peça':Number(v.partQuantity||v.quantityUsed||v.usedQuantity||1),'Observações':value(v.notes||v.observations||v.comments),'Dispositivo':value(v.device||v.completedByDevice||v.createdByDevice)}})}
function makeAssets(rows){return rows.map(function(v){v=v||{};return{'Código':value(v.codigo||v.code||v.tag||v.__key),'Equipamento':value(v.nome||v.name),'Tipo / Modelo':value(v.type||v.model),'Fabricante':value(v.manufacturer),'Localização':value(v.location||v.sector),'Horímetro':value(v.horimetro),'Criticidade':value(v.criticality||v.criticidade),'Status':value(v.status),'Limite Preventiva':value(v.preventiveLimit||v.limite)}})}
function cell(X,ws,r,c){var a=X.utils.encode_cell({r:r,c:c});if(!ws[a])ws[a]={t:'s',v:''};return ws[a]}
function border(color,style){style=style||'thin';return{top:{style:style,color:{rgb:color}},bottom:{style:style,color:{rgb:color}},left:{style:style,color:{rgb:color}},right:{style:style,color:{rgb:color}}}}
function styleRange(X,ws,sr,er,sc,ec,style){for(var r=sr;r<=er;r++)for(var c=sc;c<=ec;c++){var q=cell(X,ws,r,c);q.s=Object.assign({},style)}}
function prepareSheet(X,rows,title,kind){
 var headers=Object.keys(rows[0]||{}),data=[];
 data.push([title]);
 data.push(headers);
 rows.forEach(function(o){data.push(headers.map(function(h){return o[h]}))});
 var ws=X.utils.aoa_to_sheet(data),lastCol=Math.max(0,headers.length-1),lastDataRow=data.length-1;
 var teal='315B60',teal2='3D6F74',light='E8F0F1',white='FFFFFF',gray='4A4A4A',blue='4772B8',grid='B8C1C3',text='273437',soft='F5F7F7';
 ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:lastCol}}];
 ws['!rows']=[];ws['!rows'][0]={hpt:42};ws['!rows'][1]={hpt:38};
 for(var rr=2;rr<=lastDataRow;rr++)ws['!rows'][rr]={hpt:30};
 ws['!pageSetup']={orientation:'landscape',fitToWidth:1,fitToHeight:0,paperSize:9};
 ws['!margins']={left:.25,right:.25,top:.35,bottom:.35,header:.15,footer:.15};
 ws['!autofilter']={ref:X.utils.encode_range({s:{r:1,c:0},e:{r:lastDataRow,c:lastCol}})};
 ws['!freeze']={xSplit:0,ySplit:2};
 var tc=cell(X,ws,0,0);tc.s={fill:{patternType:'solid',fgColor:{rgb:'FFFFFF'}},font:{name:'Aptos Display',sz:25,bold:true,color:{rgb:blue}},alignment:{horizontal:'left',vertical:'center',wrapText:true},border:{bottom:{style:'medium',color:{rgb:blue)}}};
 for(var c=0;c<=lastCol;c++){
   var hc=cell(X,ws,1,c);hc.s={fill:{patternType:'solid',fgColor:{rgb:teal}},font:{name:'Aptos',sz:10,bold:true,color:{rgb:white}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border('FFFFFF','thin')};
   for(var r=2;r<=lastDataRow;r++){
     var dc=cell(X,ws,r,c),even=(r%2===0),head=headers[c]||'';
     dc.s={fill:{patternType:'solid',fgColor:{rgb:even?'FFFFFF':light}},font:{name:'Aptos',sz:10,color:{rgb:text}},alignment:{horizontal:(typeof dc.v==='number'?'center':'left'),vertical:'center',wrapText:true},border:border(grid,'thin')};
     if(typeof dc.v==='number'&&/Custo/.test(head))dc.s.numFmt='R$ #,##0.00';
     else if(typeof dc.v==='number'&&/(Quantidade|Horímetro|Limite)/.test(head))dc.s.numFmt='#,##0.00';
     if(head==='Status'){
       var st=String(dc.v||'').toLowerCase();
       if(st.indexOf('concl')>=0||st.indexOf('ok')>=0){dc.s.fill={patternType:'solid',fgColor:{rgb:'E5F4EA'}};dc.s.font={name:'Aptos',sz:10,bold:true,color:{rgb:'18794E'}}}
       else if(st.indexOf('pend')>=0||st.indexOf('repor')>=0){dc.s.fill={patternType:'solid',fgColor:{rgb:'FFF4D6'}};dc.s.font={name:'Aptos',sz:10,bold:true,color:{rgb:'9A6700'}}}
     }
   }
 }
 var footerRow=lastDataRow+1,footer=[];for(var j=0;j<=lastCol;j++)footer[j]='';footer[0]='TOTAIS GERAIS';
 if(kind==='os'){
   ['Custo Peças (R$)','Custo M.O. (R$)','Custo Total (R$)','Quantidade da Peça'].forEach(function(name){var idx=headers.indexOf(name);if(idx>=0)footer[idx]=rows.reduce(function(a,o){return a+(Number(o[name])||0)},0)});
 } else {
   var idx=headers.indexOf('Código');if(idx>=0)footer[idx]=rows.length+' registro(s)';
 }
 X.utils.sheet_add_aoa(ws,[footer],{origin:{r:footerRow,c:0}});ws['!rows'][footerRow]={hpt:30};
 for(var k=0;k<=lastCol;k++){var fc=cell(X,ws,footerRow,k);fc.s={fill:{patternType:'solid',fgColor:{rgb:gray}},font:{name:'Aptos',sz:10,bold:true,color:{rgb:white}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border('FFFFFF','thin')};if(typeof fc.v==='number'&&/Custo/.test(headers[k]||''))fc.s.numFmt='R$ #,##0.00'}
 ws['!ref']=X.utils.encode_range({s:{r:0,c:0},e:{r:footerRow,c:lastCol}});
 ws['!cols']=headers.map(function(h){var max=Math.max(12,String(h).length+3);for(var z=0;z<rows.length;z++)max=Math.max(max,String(rows[z][h]==null?'':rows[z][h]).length+2);if(/Descrição|Observações/.test(h))max=Math.max(max,36);if(/Equipamento|Técnico|Fornecedor/.test(h))max=Math.max(max,24);return{wch:Math.min(42,max)}});
 return ws;
}
async function getData(){if(window.firebase&&firebase.database){var snap=await firebase.database().ref('workshopCMMS').once('value');return snap.val()||{}}return window.cmmsState||{}}
window.exportarExcelFormatado=async function(){var b=document.getElementById('exportXlsxBtn');try{if(b){b.disabled=true;b.textContent='⏳ Gerando...'}var X=await loadXLSX(),data=await getData(),n=normalize(data),osRows=makeOSRows(n.rows);if(!osRows.length)osRows=[{'Nº OS':'','Data Abertura':'','Equipamento':'','Setor':'','Tipo':'','Prioridade':'','Descrição / Serviço':'Nenhuma O.S. registrada no histórico','Técnico':'','Data Prevista':'','Data Conclusão':'','Custo Peças (R$)':0,'Custo M.O. (R$)':0,'Custo Total (R$)':0,'Status':'','Peça Utilizada':'','Quantidade da Peça':0,'Observações':'','Dispositivo':''}];var wb=X.utils.book_new();var ws=prepareSheet(X,osRows,'RELATÓRIO DE MANUTENÇÃO — HISTÓRICO DE ORDENS DE SERVIÇO','os');X.utils.book_append_sheet(wb,ws,'Histórico de O.S.');var assets=makeAssets(n.equipments);if(assets.length){var wa=prepareSheet(X,assets,'REGISTRO DE ATIVOS — EQUIPAMENTOS','assets');X.utils.book_append_sheet(wb,wa,'Ativos')}X.writeFile(wb,'Relatorio_Manutencao_'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'.xlsx');if(window.fusionToast)window.fusionToast('Planilha gerada no padrão profissional')}catch(err){console.error('Exportação Excel:',err);alert('Não foi possível gerar a planilha: '+(err&&err.message?err.message:err))}finally{if(b){b.disabled=false;b.textContent='📊 Exportar Excel formatado'}}};
window.exportarCSV=window.exportarExcelFormatado;
function install(){var s=document.getElementById('historico');if(!s)return;var h=s.querySelector('h2');if(!h)return;var b=document.getElementById('exportXlsxBtn');if(!b){b=document.createElement('button');b.id='exportXlsxBtn';b.type='button';b.className='fusion-btn fb';b.textContent='📊 Exportar Excel formatado';h.parentNode.classList.add('flex','justify-between','items-center','gap-3');h.parentNode.appendChild(b)}b.onclick=window.exportarExcelFormatado}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();setInterval(install,1500);
})();
