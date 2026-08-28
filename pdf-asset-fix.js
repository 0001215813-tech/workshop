/* PDF executivo do ativo - recebe os dados DIRETAMENTE do QR Code. */
(function(){
  'use strict';

  function text(v){
    if(v===undefined||v===null||String(v).trim()==='') return '-';
    return String(v);
  }
  function clean(v){
    return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'');
  }
  function esc(v){return clean(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}

  function decodeBase64Url(value){
    try{
      let s=decodeURIComponent(value||'').replace(/-/g,'+').replace(/_/g,'/');
      while(s.length%4)s+='=';
      const bin=atob(s);
      const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      return JSON.parse(new TextDecoder('utf-8').decode(bytes));
    }catch(err){
      try{
        let s=decodeURIComponent(value||'').replace(/-/g,'+').replace(/_/g,'/');
        while(s.length%4)s+='=';
        return JSON.parse(decodeURIComponent(escape(atob(s))));
      }catch(e){return null;}
    }
  }

  function makePDF(raw){
    const e=raw||{};
    const data={
      name:e.name??e.nome??e.equipmentName??'-',
      code:e.code??e.tag??e.codigo??e.assetCode??'-',
      model:e.model??e.modelo??e.typeModel??'-',
      manufacturer:e.manufacturer??e.fabricante??'-',
      serialNumber:e.serialNumber??e.serial??e.numeroSerie??e.serie??'-',
      location:e.location??e.localizacao??e.local??'-',
      sector:e.sector??e.costCenter??e.centroCusto??'-',
      type:e.type??e.tipo??e.equipmentType??'-',
      year:e.year??e.ano??e.manufactureYear??'-',
      horimetro:e.horimetro??e.hourmeter??e.horimeter??'-',
      preventiveLimit:e.preventiveLimit??e.preventive_limit??e.limitePreventiva??'-',
      criticality:e.criticality??e.criticidade??'-',
      status:e.status??'Operando',
      responsible:e.responsible??e.responsavel??e.assetResponsible??'-'
    };

    const cmds=[];
    const NAVY='0.04 0.10 0.18', BLUE='0.10 0.28 0.55', LIGHT='0.96 0.97 0.98', GRID='0.78 0.82 0.88', WHITE='1 1 1', DARK='0.12 0.15 0.19';
    function textAt(x,y,size,font,s){cmds.push('BT',`/${font} ${size} Tf`,`1 0 0 1 ${x} ${y} Tm`,`(${esc(s)}) Tj`,'ET');}
    function fill(x,y,w,h,c){cmds.push(`${c} rg`,`${x} ${y} ${w} ${h} re f`);}
    function stroke(x,y,w,h,c){cmds.push(`${c} RG`,`${x} ${y} ${w} ${h} re S`);}
    function fit(v,n){const s=clean(v);return s.length>n?s.slice(0,n-3)+'...':s;}
    function section(title,y,rows){
      fill(42,y,511,22,BLUE);textAt(54,y+7,8,'F2',title);
      let cy=y-24;
      const half=255.5;
      rows.forEach((r,i)=>{
        const bg=i%2?LIGHT:WHITE;
        fill(42,cy,half,30,bg);stroke(42,cy,half,30,GRID);
        fill(42+half,cy,half,30,bg);stroke(42+half,cy,half,30,GRID);
        textAt(52,cy+19,6,'F2',String(r[0]).toUpperCase());textAt(52,cy+8,8,'F1',fit(r[1],34));
        textAt(307,cy+19,6,'F2',String(r[2]).toUpperCase());textAt(307,cy+8,8,'F1',fit(r[3],34));
        cy-=30;
      });
      return cy-16;
    }

    fill(0,780,595,62,NAVY);fill(42,796,48,28,BLUE);
    textAt(51,805,12,'F2','SENAI');textAt(104,811,15,'F2','FICHA EXECUTIVA DO ATIVO');textAt(104,797,8,'F1','CMMS SENAI - Plataforma Manutencao 4.0');
    textAt(465,811,7,'F2','DOCUMENTO');textAt(465,797,8,'F1','FICHA TECNICA');

    fill(42,731,511,37,WHITE);stroke(42,731,511,37,GRID);fill(42,731,8,37,BLUE);
    textAt(62,753,7,'F2','EQUIPAMENTO');textAt(62,739,13,'F2',fit(data.name,48));textAt(410,753,7,'F2','STATUS');fill(410,736,112,13,'0.90 0.96 0.93');textAt(420,740,8,'F2',fit(data.status,17));

    textAt(42,712,9,'F2','RESUMO EXECUTIVO');
    const sy=676,sh=29,cw=127.75;
    [['CODIGO / TAG',data.code],['MODELO',data.model],['CRITICIDADE',data.criticality],['HORIMETRO',data.horimetro==='-'?'-':data.horimetro+' h']].forEach((it,i)=>{const x=42+i*cw;fill(x,sy,cw,sh,i%2?LIGHT:WHITE);stroke(x,sy,cw,sh,GRID);textAt(x+8,sy+18,6,'F2',it[0]);textAt(x+8,sy+7,8,'F2',fit(it[1],20));});

    let y=651;
    y=section('01  IDENTIFICACAO E RASTREABILIDADE',y,[['Equipamento',data.name,'Codigo / TAG',data.code],['Modelo',data.model,'Fabricante',data.manufacturer],['Numero de serie',data.serialNumber,'Tipo do equipamento',data.type]]);
    y=section('02  LOCALIZACAO E RESPONSABILIDADE',y,[['Localizacao',data.location,'Setor / Centro de custo',data.sector],['Responsavel pelo ativo',data.responsible,'Ano de fabricacao',data.year]]);
    y=section('03  CONTROLE DE MANUTENCAO',y,[['Horimetro (h)',data.horimetro==='-'?'-':data.horimetro+' h','Limite preventivo (h)',data.preventiveLimit==='-'?'-':data.preventiveLimit+' h'],['Criticidade',data.criticality,'Status operacional',data.status]]);
    fill(42,105,511,45,'0.94 0.96 0.98');stroke(42,105,511,45,GRID);textAt(54,136,7,'F2','CONTROLE DOCUMENTAL');textAt(54,122,7,'F1','Documento gerado automaticamente a partir dos dados enviados pelo QR Code.');textAt(54,111,7,'F1','Identificacao, rastreabilidade e apoio ao planejamento de manutencao.');
    cmds.push('0.78 0.82 0.88 RG','42 48 m 553 48 l S');textAt(42,34,7,'F2','SENAI | CMMS MANUTENCAO 4.0');textAt(42,22,7,'F1','Gerado em: '+new Date().toLocaleString('pt-BR'));textAt(462,27,7,'F2','FICHA EXECUTIVA');

    const content=cmds.join('\n');
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
    let pdf='%PDF-1.4\n',offs=[0];objects.forEach((o,i)=>{offs[i+1]=pdf.length;pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const xref=pdf.length;pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';for(let i=1;i<=objects.length;i++)pdf+=String(offs[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return new Blob([pdf],{type:'application/pdf'});
  }

  function route(){
    const p=new URLSearchParams(location.search);
    if(p.get('pdf')!=='1')return false;
    const encoded=p.get('assetData');
    if(!encoded)return false;
    const data=decodeBase64Url(encoded);
    if(!data)return false;
    const url=URL.createObjectURL(makePDF(data));
    document.body.innerHTML='';
    location.replace(url);
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route);else route();
})();
