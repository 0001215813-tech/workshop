/* Ficha tecnica do ativo - layout industrial profissional. */
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
    const cmds=[];
    function text(x,y,size,font,s){cmds.push('BT',`/${font} ${size} Tf`,`1 0 0 1 ${x} ${y} Tm`,`(${esc(s)}) Tj`,'ET')}
    function rect(x,y,w,h,fill,stroke){cmds.push(`${fill} rg`,`${x} ${y} ${w} ${h} re f`,`${stroke} RG`,`${x} ${y} ${w} ${h} re S`)}
    function line(x1,y1,x2,y2){cmds.push('0.78 0.82 0.88 RG',`${x1} ${y1} m ${x2} ${y2} l S`)}
    function section(title,y){rect(42,y-6,511,22,'0.08 0.22 0.40','0.08 0.22 0.40');text(54,y+1,9,'F2',title);return y-35}
    function field(x,y,w,label,value){rect(x,y-4,w,36,'0.96 0.97 0.98','0.86 0.89 0.92');text(x+10,y+17,7,'F2',label.toUpperCase());let t=clean(value);if(t.length>42)t=t.slice(0,42)+'...';text(x+10,y+5,9,'F1',t)}

    // Cabecalho institucional
    rect(0,780,595,62,'0.04 0.10 0.18','0.04 0.10 0.18');
    rect(42,795,48,30,'0.16 0.36 0.82','0.16 0.36 0.82');
    text(51,805,12,'F2','SENAI');
    text(104,810,15,'F2','FICHA TECNICA DO ATIVO');
    text(104,796,8,'F1','CMMS SENAI - Plataforma Manutencao 4.0');
    text(472,812,7,'F2','DOCUMENTO');
    text(472,799,9,'F1','ATIVO');

    // Identificacao principal
    rect(42,731,511,36,'0.94 0.96 0.98','0.82 0.86 0.90');
    text(54,752,7,'F2','ATIVO');
    let nm=clean(data.name);if(nm.length>52)nm=nm.slice(0,52)+'...';text(54,739,14,'F2',nm);
    text(410,752,7,'F2','STATUS');
    text(410,739,9,'F2',clean(data.status));

    let y=704;
    y=section('1  IDENTIFICACAO DO EQUIPAMENTO',y);
    field(42,y,248,'Equipamento',data.name);field(305,y,248,'Codigo / TAG',data.code);y-=47;
    field(42,y,248,'Modelo',data.model);field(305,y,248,'Fabricante',data.manufacturer);y-=47;
    field(42,y,248,'Numero de serie',data.serialNumber);field(305,y,248,'Tipo do equipamento',data.type);y-=47;

    y=section('2  LOCALIZACAO E GESTAO',y);
    field(42,y,248,'Localizacao',data.location);field(305,y,248,'Setor / Centro de custo',data.sector);y-=47;
    field(42,y,248,'Responsavel pelo ativo',data.responsible);field(305,y,248,'Ano de fabricacao',data.year);y-=47;

    y=section('3  CONTROLE DE MANUTENCAO',y);
    field(42,y,248,'Horimetro (h)',data.horimetro==='-'?'-':data.horimetro+' h');field(305,y,248,'Limite preventivo (h)',data.preventiveLimit==='-'?'-':data.preventiveLimit+' h');y-=47;
    field(42,y,248,'Criticidade',data.criticality);field(305,y,248,'Status operacional',data.status);y-=55;

    // Area de rastreabilidade
    rect(42,y-2,511,50,'0.97 0.98 0.99','0.82 0.86 0.90');
    text(54,y+31,8,'F2','RASTREABILIDADE');
    text(54,y+16,8,'F1','Ficha gerada automaticamente a partir do cadastro do ativo no CMMS.');
    text(54,y+4,8,'F1','Os dados apresentados correspondem ao registro disponivel no sistema no momento da emissao.');

    // Rodape
    line(42,48,553,48);
    text(42,33,7,'F1','CMMS SENAI - Plataforma Manutencao 4.0');
    text(42,21,7,'F1','Gerado em: '+new Date().toLocaleString('pt-BR'));
    text(505,27,7,'F2','FICHA DE ATIVO');

    const content=cmds.join('\n');
    const objects=[
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
    ];
    let pdf='%PDF-1.4\n',offs=[0];objects.forEach((o,i)=>{offs[i+1]=pdf.length;pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const xref=pdf.length;pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';for(let i=1;i<=objects.length;i++)pdf+=String(offs[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return new Blob([pdf],{type:'application/pdf'});
  }
  function decode(s){try{let b=s.replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';return JSON.parse(decodeURIComponent(escape(atob(b))))}catch(e){return null}}
  function route(){const p=new URLSearchParams(location.search);if(p.get('pdf')!=='1'||!p.get('assetData'))return false;const data=decode(p.get('assetData'));if(!data)return false;const url=URL.createObjectURL(makePDF(data));location.replace(url);return true}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route);else route();
})();