(function(){
'use strict';
function box(color,style){return{top:{style:style||'thin',color:{rgb:color}},bottom:{style:style||'thin',color:{rgb:color}},left:{style:style||'thin',color:{rgb:color}},right:{style:style||'thin',color:{rgb:color}}}}
function cell(X,ws,r,c){var a=X.utils.encode_cell({r:r,c:c});if(!ws[a])ws[a]={t:'s',v:''};return ws[a]}
function applyStyle(X,ws,kind){
 var old=X.utils.sheet_to_json(ws,{header:1,raw:true,defval:''});if(!old.length)return;
 var title=old[0]&&old[0][0]||'RELATÓRIO DE MANUTENÇÃO',headers=old[1]||[],body=old.slice(2),footer=null;
 if(body.length&&String(body[body.length-1][0]||'').toUpperCase()==='TOTAIS GERAIS')footer=body.pop();
 var groups=kind==='assets'?[['IDENTIFICAÇÃO DO ATIVO',0,2],['LOCALIZAÇÃO E MEDIÇÃO',3,5],['CONTROLE E PREVENTIVA',6,headers.length-1]]:[['IDENTIFICAÇÃO DA O.S.',0,5],['EXECUÇÃO E PRAZOS',6,9],['CUSTOS',10,12],['STATUS E PEÇAS',13,15],['OBSERVAÇÕES E CONTROLE',16,headers.length-1]];
 groups=groups.filter(function(g){return g[1]<headers.length&&g[2]>=g[1]});
 var data=[[title],[] ,headers].concat(body);if(footer)data.push(footer);
 ws=X.utils.aoa_to_sheet(data);
 var lastCol=headers.length-1,lastRow=data.length-1,groupRow=1,headerRow=2,footerRow=footer?lastRow:-1;
 ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:lastCol}}];groups.forEach(function(g){ws['!merges'].push({s:{r:1,c:g[1]},e:{r:1,c:g[2]}})});
 ws['!rows']=[{hpt:44},{hpt:28},{hpt:38}];for(var i=0;i<body.length;i++)ws['!rows'].push({hpt:28});if(footer)ws['!rows'].push({hpt:30});
 ws['!pageSetup']={orientation:'landscape',fitToWidth:1,fitToHeight:0,paperSize:9};ws['!margins']={left:.25,right:.25,top:.35,bottom:.35,header:.15,footer:.15};ws['!autofilter']={ref:X.utils.encode_range({s:{r:2,c:0},e:{r:2+body.length,c:lastCol}})};ws['!freeze']={xSplit:0,ySplit:3};
 var blue='4F6B9A',teal='36575D',teal2='456B72',light='DCEBEC',white='FFFFFF',gray='555555',text='263238',grid='AEB9BB';
 cell(X,ws,0,0).s={fill:{patternType:'solid',fgColor:{rgb:'F3F3F3'}},font:{name:'Aptos Display',sz:25,bold:true,color:{rgb:blue}},alignment:{horizontal:'center',vertical:'center'},border:{bottom:{style:'medium',color:{rgb:grid}}}};
 groups.forEach(function(g,idx){var gc=cell(X,ws,1,g[1]);gc.s={fill:{patternType:'solid',fgColor:{rgb:idx===groups.length-1?'555555':teal}},font:{name:'Aptos',sz:10,bold:true,color:{rgb:white}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:box('B7C2C4','thin')}});
 for(var c=0;c<=lastCol;c++){var hc=cell(X,ws,headerRow,c);hc.s={fill:{patternType:'solid',fgColor:{rgb:teal2}},font:{name:'Aptos',sz:10,bold:true,color:{rgb:white}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:box('B7C2C4','thin')};for(var r=3;r<3+body.length;r++){var dc=cell(X,ws,r,c),even=((r-3)%2===0);dc.s={fill:{patternType:'solid',fgColor:{rgb:even?'F8F8F8':light}},font:{name:'Aptos',sz:10,color:{rgb:text}},alignment:{horizontal:typeof dc.v==='number'?'center':'left',vertical:'center',wrapText:true},border:box('C2C9CA','thin')};if(typeof dc.v==='number'&&/Custo/.test(headers[c]||''))dc.s.numFmt='R$ #,##0.00'}
 }
 if(footer){for(var k=0;k<=lastCol;k++){var fc=cell(X,ws,footerRow,k);fc.s={fill:{patternType:'solid',fgColor:{rgb:gray}},font:{name:'Aptos',sz:10,bold:true,color:{rgb:white}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:box('A8B0B2','thin')};if(typeof fc.v==='number'&&/Custo/.test(headers[k]||''))fc.s.numFmt='R$ #,##0.00'}}
 ws['!ref']=X.utils.encode_range({s:{r:0,c:0},e:{r:footerRow,c:lastCol}});
 ws['!cols']=headers.map(function(h,i){var max=Math.max(12,String(h).length+3);for(var r=0;r<body.length;r++)max=Math.max(max,String(body[r][i]==null?'':body[r][i]).length+2);if(/Descrição|Observações/.test(h))max=Math.max(max,34);if(/Data/.test(h))max=Math.max(max,18);if(/Custo/.test(h))max=Math.max(max,16);return{wch:Math.min(42,max)}});
 return ws;
}
function patch(){var X=window.XLSX;if(!X||X.__senaiStylePatch)return false;var original=X.writeFile;X.writeFile=function(wb,name,opts){try{if(wb&&wb.Sheets){Object.keys(wb.Sheets).forEach(function(n){applyStyle(X,wb.Sheets[n],n==='Ativos'?'assets':'os')})}}catch(e){console.warn('Formatação Excel:',e)}return original.call(X,wb,name,opts)};X.__senaiStylePatch=true;return true}
var timer=setInterval(function(){if(patch())clearInterval(timer)},250);patch();
})();
