/* Ficha tecnica do ativo: normaliza os nomes dos campos para que nenhum dado cadastrado seja perdido no PDF. */
(function(){
  'use strict';
  function val(e,keys,fallback){for(const k of keys){if(e&&e[k]!==undefined&&e[k]!==null&&String(e[k]).trim()!=='')return e[k]}return fallback??'-'}
  function clean(v){return String(v==null||v===''?'-':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'')}
  function esc(v){return clean(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
  function makePDF(e){
    const data={
      name:val(e,['name','nome','equipmentName']),code:val(e,['code','tag','codigo','assetCode']),model:val(e,['model','modelo','typeModel']),manufacturer:val(e,['manufacturer','fabricante']),serialNumber:val(e,['serialNumber','serial','numeroSerie','serie']),
      location:val(e,['location','localizacao','local']),sector:val(e,['sector','costCenter','centroCusto']),type:val(e,['type','tipo','equipmentType']),year:val(e,['year','ano','manufactureYear']),horimetro:val(e,['horimetro','hourmeter','horimeter']),preventiveLimit:val(e,['preventiveLimit','preventive_limit','limitePreventiva']),criticality:val(e,['criticality','criticidade']),status:val(e,['status'],'Operando'),responsible:val(e,['responsible','responsavel','assetResponsible'])
    };
    const rows=[
      ['IDENTIFICACAO','Equipamento',data.name],['IDENTIFICACAO','Codigo / TAG',data.code],['IDENTIFICACAO','Modelo',data.model],['IDENTIFICACAO','Fabricante',data.manufacturer],['IDENTIFICACAO','Numero de serie',data.serialNumber],
      ['LOCALIZACAO','Localizacao',data.location],['LOCALIZACAO','Setor / Centro de custo',data.sector],
      ['OPERACAO','Tipo do equipamento',data.type],['OPERACAO','Ano de fabricacao',data.year],['OPERACAO','Horimetro',data.horimetro==='-'?'-':data.horimetro+' h'],['OPERACAO','Limite preventiva',data.preventiveLimit==='-'?'-':data.preventiveLimit+' h'],['OPERACAO','Criticidade',data.criticality],['OPERACAO','Status',data.status],
      ['RESPONSAVEL','Responsavel pelo ativo',data.responsible]
    ];
    const cmds=['BT','/F1 18 Tf','50 792 Td',`(${esc('FICHA TECNICA DO ATIVO')}) Tj`,'/F1 9 Tf','0 -22 Td',`(${esc('CMMS SENAI - Plataforma Manutencao 4.0')}) Tj`,'ET'];
    let y=735,last='';
    rows.forEach(([section,label,value])=>{
      if(section!==last){cmds.push('BT','0 0 0 rg','/F1 10 Tf',`50 ${y} Td`,`(${esc(section)}) Tj`,'ET');y-=18;last=section;}
      let text=clean(value);if(text.length>48)text=text.slice(0,48)+'...';
      cmds.push('0.93 0.95 0.98 rg',`50 ${y-3} 495 30 re f`,'BT','0 0 0 rg','/F1 9 Tf',`62 ${y+7} Td`,`(${esc(label)}) Tj`,`250 0 Td`,`(${esc(text)}) Tj`,'ET');y-=38;
    });
    cmds.push('BT','/F1 8 Tf',`50 42 Td`,`(${esc('Gerado em: '+new Date().toLocaleString('pt-BR'))}) Tj`,'ET');
    const content=cmds.join('\n');
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
    let pdf='%PDF-1.4\n',offs=[0];objects.forEach((o,i)=>{offs[i+1]=pdf.length;pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const xref=pdf.length;pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';for(let i=1;i<=objects.length;i++)pdf+=String(offs[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return new Blob([pdf],{type:'application/pdf'});
  }
  function decode(s){try{let b=s.replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';return JSON.parse(decodeURIComponent(escape(atob(b))))}catch(e){return null}}
  function route(){const p=new URLSearchParams(location.search);if(p.get('pdf')!=='1'||!p.get('assetData'))return false;const data=decode(p.get('assetData'));if(!data)return false;const url=URL.createObjectURL(makePDF(data));location.replace(url);return true}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route);else route();
})();