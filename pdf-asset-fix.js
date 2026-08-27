/* Ficha tecnica do ativo - layout executivo industrial em tabelas. */
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
    function fillRect(x,y,w,h,color){cmds.push(`${color} rg`,`${x} ${y} ${w} ${h} re f`)}
    function strokeRect(x,y,w,h,color){cmds.push(`${color} RG`,`${x} ${y} ${w} ${h} re S`)}
    function rect(x,y,w,h,fill,stroke){fillRect(x,y,w,h,fill);strokeRect(x,y,w,h,stroke)}
    function line(x1,y1,x2,y2,color='0.78 0.82 0.88'){cmds.push(`${color} RG`,`${x1} ${y1} m ${x2} ${y2} l S`)}
    function fit(s,n){let t=clean(s);return t.length>n?t.slice(0,n-3)+'...':t}

    // Paleta executiva industrial
    const NAVY='0.04 0.10 0.18', BLUE='0.10 0.28 0.55', LIGHT='0.96 0.97 0.98', GRID='0.78 0.82 0.88', WHITE='1 1 1', DARK='0.12 0.15 0.19';

    // Cabecalho
    fillRect(0,780,595,62,NAVY);
    fillRect(42,796,48,28,BLUE);
    text(51,805,12,'F2','SENAI');
    text(104,811,15,'F2','FICHA EXECUTIVA DO ATIVO');
    text(104,797,8,'F1','CMMS SENAI - Plataforma Manutencao 4.0');
    text(465,811,7,'F2','DOCUMENTO');
    text(465,797,8,'F1','FICHA TECNICA');

    // Identificacao executiva
    rect(42,731,511,37,WHITE,GRID);
    fillRect(42,731,8,37,BLUE);
    text(62,753,7,'F2','EQUIPAMENTO');
    text(62,739,13,'F2',fit(data.name,48));
    text(410,753,7,'F2','STATUS');
    fillRect(410,736,112,13,'0.90 0.96 0.93');
    text(420,740,8,'F2',fit(data.status,17));

    // Resumo executivo em tabela
    text(42,712,9,'F2','RESUMO EXECUTIVO');
    const sy=676, sh=29, sw=511, cw=127.75;
    const summary=[['CODIGO / TAG',data.code],['MODELO',data.model],['CRITICIDADE',data.criticality],['HORIMETRO',data.horimetro==='-'?'-':data.horimetro+' h']];
    summary.forEach((it,i)=>{
      const x=42+i*cw;
      fillRect(x,sy,cw,sh,i%2?LIGHT:WHITE);strokeRect(x,sy,cw,sh,GRID);
      text(x+8,sy+18,6,'F2',it[0]);text(x+8,sy+7,8,'F2',fit(it[1],20));
    });

    // Tabela principal: duas colunas de campos
    function tableSection(title,y,rows){
      fillRect(42,y,511,22,BLUE);text(54,y+7,8,'F2',title);
      let cy=y-24;
      const half=255.5;
      rows.forEach((r,idx)=>{
        const bg=idx%2===0?WHITE:LIGHT;
        // esquerda
        fillRect(42,cy,half,30,bg);strokeRect(42,cy,half,30,GRID);
        text(52,cy+19,6,'F2',clean(r[0]).toUpperCase());text(52,cy+8,8,'F1',fit(r[1],34));
        // direita
        fillRect(42+half,cy,half,30,bg);strokeRect(42+half,cy,half,30,GRID);
        text(307,cy+19,6,'F2',clean(r[2]).toUpperCase());text(307,cy+8,8,'F1',fit(r[3],34));
        cy-=30;
      });
      return cy-16;
    }

    let y=651;
    y=tableSection('01  IDENTIFICACAO E RASTREABILIDADE',y,[
      ['Equipamento',data.name,'Codigo / TAG',data.code],
      ['Modelo',data.model,'Fabricante',data.manufacturer],
      ['Numero de serie',data.serialNumber,'Tipo do equipamento',data.type]
    ]);
    y=tableSection('02  LOCALIZACAO E RESPONSABILIDADE',y,[
      ['Localizacao',data.location,'Setor / Centro de custo',data.sector],
      ['Responsavel pelo ativo',data.responsible,'Ano de fabricacao',data.year]
    ]);
    y=tableSection('03  CONTROLE DE MANUTENCAO',y,[
      ['Horimetro (h)',data.horimetro==='-'?'-':data.horimetro+' h','Limite preventivo (h)',data.preventiveLimit==='-'?'-':data.preventiveLimit+' h'],
      ['Criticidade',data.criticality,'Status operacional',data.status]
    ]);

    // Area de observacao executiva
    if(y>105){
      fillRect(42,y,511,45,'0.94 0.96 0.98');strokeRect(42,y,511,45,GRID);
      text(54,y+31,7,'F2','CONTROLE DOCUMENTAL');
      text(54,y+17,7,'F1','Documento gerado automaticamente a partir do cadastro do ativo no CMMS.');
      text(54,y+6,7,'F1','Uso recomendado: identificacao, rastreabilidade e apoio ao planejamento de manutencao.');
    }

    // Rodape profissional
    line(42,48,553,48,GRID);
    text(42,34,7,'F2','SENAI | CMMS MANUTENCAO 4.0');
    text(42,22,7,'F1','Gerado em: '+new Date().toLocaleString('pt-BR'));
    text(462,27,7,'F2','FICHA EXECUTIVA');

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