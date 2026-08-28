/* Detalhes das peças do almoxarifado. Somente leitura; não altera os dados do Firebase. */
(function(){
'use strict';

function state(){return window.cmmsState||{};}
function entries(){return Object.entries(state().parts||{});}
function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
function partLabel(p,id){return String(p?.name||p?.nome||p?.partName||p?.descricao||p?.description||p?.code||p?.codigo||id||'Peça');}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function date(v){if(!v)return '-';const d=new Date(Number(v));return isNaN(d.getTime())?String(v):d.toLocaleString('pt-BR');}

function ensureStyles(){
 if(document.getElementById('partsDetailsStyles'))return;
 const s=document.createElement('style');s.id='partsDetailsStyles';s.textContent=`
 .parts-details-btn{display:block!important;width:100%;margin-top:12px;padding:10px 12px;border-radius:10px;background:#2563eb;border:1px solid #3b82f6;color:#fff;font-size:12px;font-weight:900;cursor:pointer;transition:.2s;position:relative;z-index:5}
 .parts-details-btn:hover{background:#3b82f6;transform:translateY(-1px)}
 #partsDetailsModal{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.82);backdrop-filter:blur(7px);align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
 #partsDetailsModal.open{display:flex}
 #partsDetailsModal .pdm-card{width:min(720px,100%);max-height:90vh;overflow:auto;background:linear-gradient(145deg,#111c32,#0b1426);border:1px solid #2d4265;border-radius:18px;box-shadow:0 24px 70px #0009;color:#e2e8f0;padding:24px;box-sizing:border-box}
 .pdm-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1px solid #263854;padding-bottom:16px}
 .pdm-kicker{font-size:10px;color:#60a5fa;font-weight:900;text-transform:uppercase;letter-spacing:.12em}
 .pdm-title{font-size:23px;font-weight:950;margin:4px 0 0;color:#f8fafc}
 .pdm-close{background:#1e293b;color:#e2e8f0;border:0;border-radius:10px;width:40px;height:40px;font-size:18px;cursor:pointer}
 .pdm-close:hover{background:#334155}
 .pdm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
 .pdm-item{background:#0f172a;border:1px solid #243653;border-radius:12px;padding:12px}
 .pdm-label{font-size:10px;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
 .pdm-value{font-size:14px;color:#f1f5f9;font-weight:800;margin-top:5px;word-break:break-word}
 .pdm-footer{margin-top:18px;padding-top:14px;border-top:1px solid #263854;font-size:11px;color:#94a3b8}
 @media(max-width:600px){.pdm-grid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}

function ensureModal(){
 if(document.getElementById('partsDetailsModal'))return;
 const m=document.createElement('div');m.id='partsDetailsModal';m.innerHTML=`<div class="pdm-card"><div class="pdm-header"><div><div class="pdm-kicker">Almoxarifado</div><div id="pdmTitle" class="pdm-title">Detalhes da Peça</div></div><button type="button" id="pdmClose" class="pdm-close">✕</button></div><div id="pdmBody"></div></div>`;
 document.body.appendChild(m);
 const close=()=>m.classList.remove('open');
 document.getElementById('pdmClose').onclick=close;
 m.addEventListener('click',e=>{if(e.target===m)close()});
}

function showDetails(id,p){
 ensureModal();
 const m=document.getElementById('partsDetailsModal');
 document.getElementById('pdmTitle').textContent=partLabel(p,id);
 const qty=p?.quantity??p?.stock??p?.quantidade??0;
 const min=p?.minStock??p?.estoqueMinimo??p?.estoque_minimo??0;
 document.getElementById('pdmBody').innerHTML=`
 <div class="pdm-grid">
   <div class="pdm-item"><div class="pdm-label">Nome da peça</div><div class="pdm-value">${esc(partLabel(p,id))}</div></div>
   <div class="pdm-item"><div class="pdm-label">Código / SKU</div><div class="pdm-value">${esc(p?.code||p?.codigo||'-')}</div></div>
   <div class="pdm-item"><div class="pdm-label">Categoria</div><div class="pdm-value">${esc(p?.category||p?.categoria||'-')}</div></div>
   <div class="pdm-item"><div class="pdm-label">Quantidade em estoque</div><div class="pdm-value">${esc(qty)} ${esc(p?.unit||p?.unidade||'un')}</div></div>
   <div class="pdm-item"><div class="pdm-label">Estoque mínimo</div><div class="pdm-value">${esc(min)} ${esc(p?.unit||p?.unidade||'un')}</div></div>
   <div class="pdm-item"><div class="pdm-label">Custo unitário</div><div class="pdm-value">${money(p?.cost??p?.custo??p?.custoUnitario??0)}</div></div>
   <div class="pdm-item"><div class="pdm-label">Fornecedor</div><div class="pdm-value">${esc(p?.supplier||p?.fornecedor||'-')}</div></div>
   <div class="pdm-item"><div class="pdm-label">Localização</div><div class="pdm-value">${esc(p?.location||p?.localizacao||'-')}</div></div>
   <div class="pdm-item"><div class="pdm-label">ID da peça</div><div class="pdm-value">${esc(id)}</div></div>
   <div class="pdm-item"><div class="pdm-label">Data de cadastro</div><div class="pdm-value">${date(p?.createdAt)}</div></div>
 </div>
 <div class="pdm-footer">Dados exibidos diretamente do cadastro da peça no almoxarifado.</div>`;
 m.classList.add('open');
}

function findEntryForCard(card,index,es){
 const text=(card.textContent||'').trim().toLowerCase();
 for(const ent of es){
   const [id,p]=ent;
   const name=partLabel(p,id).toLowerCase();
   const code=String(p?.code||p?.codigo||'').toLowerCase();
   if((name&&text.includes(name))||(code&&text.includes(code)))return ent;
 }
 return es[index]||null;
}

function addButtons(){
 const list=document.getElementById('partsList');
 if(!list)return false;
 const es=entries();
 if(!es.length)return false;
 const cards=[...list.children].filter(x=>x&&x.nodeType===1);
 if(!cards.length)return false;
 cards.forEach((card,i)=>{
   if(card.querySelector('.parts-details-btn'))return;
   const ent=findEntryForCard(card,i,es);if(!ent)return;
   const [id,p]=ent;
   const b=document.createElement('button');
   b.type='button';b.className='parts-details-btn';b.innerHTML='<i class="fa-solid fa-circle-info" style="margin-right:7px"></i>Ver detalhes';
   b.onclick=e=>{e.preventDefault();e.stopPropagation();showDetails(id,p||{})};
   card.appendChild(b);
 });
 return cards.some(card=>card.querySelector('.parts-details-btn'));
}

function scan(){ensureStyles();ensureModal();addButtons()}
function init(){
 scan();
 const ob=new MutationObserver(()=>{if(window.__partsDetailsFrame)return;window.__partsDetailsFrame=requestAnimationFrame(()=>{window.__partsDetailsFrame=0;scan()})});
 ob.observe(document.body,{childList:true,subtree:true});
 let tries=0;const timer=setInterval(()=>{scan();if(++tries>=40)clearInterval(timer)},500);
}
window.viewPartDetails=showDetails;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
