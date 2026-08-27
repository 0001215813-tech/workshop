/* PDF do ativo - usa os dados codificados no QR para não depender do Firebase na abertura da ficha. */
(function(){
  'use strict';
  function clean(v){return String(v==null||v===''?'-':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'');}
  function esc(v){return clean(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
  function makePDF(e){
    const rows=[
      ['IDENTIFICACAO','Equipamento',e.name],['IDENTIFICACAO','Codigo / TAG',e.code],['IDENTIFICACAO','Modelo',e.model],['IDENTIFICACAO','Fabricante',e.manufacturer],['IDENTIFICACAO','Numero de serie',e.serialNumber],
      ['LOCALIZACAO','Localizacao',e.location],['LOCALIZACAO','Setor / Centro de custo',e.sector],['OPERACAO','Tipo do equipamento',e.type],['OPERACAO','Ano de fabricacao',e.year],['OPERACAO','Horimetro',e.horimetro==null?'-':e.horimetro+' h'],['OPERACAO','Limite preventiva',e.preventiveLimit==null?'-':e.preventiveLimit+' h'],['OPERACAO','Criticidade',e.criticality],['OPERACAO','Status',e.status||'Operando'],['RESPONSAVEL','Responsavel pelo ativo',e.responsible]
    ];
    const cmds=['BT','/F1 18 Tf','50 792 Td',`(${esc('FICHA TECNICA DO ATIVO')}) Tj`,'/F1 9 Tf','0 -22 Td',`(${esc('CMMS SENAI - Plataforma Manutencao 4.0')}) Tj`,'ET'];
    let y=735,last='';
    rows.forEach(([section,label,value])=>{
      if(section!==last){cmds.push('0 0 0 rg',`50 ${y} Td`,'/F1 10 Tf',`(${esc(section)}) Tj`,'ET');y-=18;last=section;}
      cmds.push('0.93 0.95 0.98 rg',`50 ${y-3} 495 30 re f`,'0 0 0 rg','BT','/F1 9 Tf',`62 ${y+7} Td`,`(${esc(label)}) Tj`,'/F1 10 Tf',`250 0 Td`,`(${esc(value)}) Tj`,'ET');y-=38;
    });
    cmds.push('BT','/F1 8 Tf',`50 42 Td`,`(${esc('Gerado em: '+new Date().toLocaleString('pt-BR'))}) Tj`,'ET');
    const content=cmds.join('\n');
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
    let pdf='%PDF-1.4\n',offs=[0];objects.forEach((o,i)=>{offs[i+1]=pdf.length;pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const xref=pdf.length;pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';for(let i=1;i<=objects.length;i++)pdf+=String(offs[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return new Blob([pdf],{type:'application/pdf'});
  }
  function decode(s){try{let b=s.replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';return JSON.parse(decodeURIComponent(escape(atob(b))))}catch(e){return null}}
  function route(){const p=new URLSearchParams(location.search);const raw=p.get('assetData');if(p.get('pdf')!=='1'||!raw)return false;const data=decode(raw);if(!data)return false;const url=URL.createObjectURL(makePDF(data));location.replace(url);return true}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route);else route();
})();
