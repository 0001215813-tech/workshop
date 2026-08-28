/* Gerenciamento de peças do almoxarifado: adicionar e remover sem alterar as demais funções. */
(function(){
'use strict';

function root(){return window.cmmsRoot||null;}
function state(){return window.cmmsState||{};}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function entries(){return Object.entries(state().parts||{});}
function label(p,id){return String(p?.name||p?.nome||p?.partName||p?.descricao||p?.description||p?.code||p?.codigo||id||'Peça');}

function ensureStyles(){
 if(document.getElementById('partsMgmtStyles'))return;
 const s=document.createElement('style');s.id='partsMgmtStyles';s.textContent=`
 #partsMgmtBar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
 #partsMgmtAdd{background:#2563eb;color:#fff;border:0;border-radius:12px;padding:10px 16px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px #2563eb33}
 #partsMgmtAdd:hover{background:#3b82f6}
 .parts-remove-btn{width:100%;margin-top:12px;padding:9px 12px;border-radius:10px;background:rgba(220,38,38,.14);border:1px solid rgba(239,68,68,.35);color:#fca5a5;font-size:12px;font-weight:800;cursor:pointer}
 .parts-remove-btn:hover{background:#dc2626;color:#fff}
 #partsMgmtModal{display:none;position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.8);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px}
 #partsMgmtModal.open{display:flex}
 #partsMgmtModal .pm-card{width:min(680px,100%);max-height:90vh;overflow:auto;background:linear-gradient(145deg,#111c32,#0b1426);border:1px solid #23324d;border-radius:16px;box-shadow:0 20px 60px #0008;padding:24px;color:#e2e8f0}
 #partsMgmtModal label{display:block;margin-top:10px}
 #partsMgmtModal .pm-label{display:block;font-size:12px;font-weight:800;color:#94a3b8;margin-bottom:4px}
 #partsMgmtModal input,#partsMgmtModal select{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;outline:none}
 #partsMgmtModal input:focus,#partsMgmtModal select:focus{border-color:#3b82f6}
 #partsMgmtModal .pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
 #partsMgmtModal .pm-actions{display:flex;gap:10px;margin-top:18px}
 #partsMgmtModal button{border:0;border-radius:10px;padding:11px 14px;font-weight:900;cursor:pointer}
 #partsMgmtCancel{background:#1e293b;color:#e2e8f0}
 #partsMgmtSave{background:#2563eb;color:#fff;flex:1}
 @media(max-width:600px){#partsMgmtModal .pm-grid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}

function ensureModal(){
 if(document.getElementById('partsMgmtModal'))return;
 const m=document.createElement('div');m.id='partsMgmtModal';m.innerHTML=`<div class="pm-card">
 <div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-size:10px;color:#60a5fa;font-weight:800;text-transform:uppercase;letter-spacing:.12em">Almoxarifado</div><h3 style="font-size:20px;font-weight:900;margin:4px 0">Adicionar Peça</h3></div><button id="partsMgmtX" type="button" style="background:#1e293b;color:#e2e8f0;width:38px;height:38px">✕</button></div>
 <form id="partsMgmtForm">
 <label><span class="pm-label">Nome da peça</span><input id="pmName" required placeholder="Ex.: Filtro de óleo"></label>
 <div class="pm-grid"><label><span class="pm-label">Código / SKU</span><input id="pmCode" placeholder="Ex.: FIL-001"></label><label><span class="pm-label">Categoria</span><input id="pmCategory" placeholder="Ex.: Filtros"></label></div>
 <div class="pm-grid"><label><span class="pm-label">Quantidade</span><input id="pmQty" type="number" min="0" step="1" value="0"></label><label><span class="pm-label">Estoque mínimo</span><input id="pmMin" type="number" min="0" step="1" value="0"></label></div>
 <div class="pm-grid"><label><span class="pm-label">Unidade</span><select id="pmUnit"><option>un</option><option>kit</option><option>l</option><option>kg</option><option>m</option></select></label><label><span class="pm-label">Custo unitário (R$)</span><input id="pmCost" type="number" min="0" step="0.01" value="0"></label></div>
 <div class="pm-grid"><label><span class="pm-label">Fornecedor</span><input id="pmSupplier" placeholder="Ex.: Caterpillar"></label><label><span class="pm-label">Localização</span><input id="pmLocation" placeholder="Ex.: Prateleira A-01"></label></div>
 <div class="pm-actions"><button id="partsMgmtCancel" type="button">Cancelar</button><button id="partsMgmtSave" type="submit">Salvar peça no Firebase</button></div>
 </form></div>`;document.body.appendChild(m);
 const close=()=>m.classList.remove('open');
 m.querySelector('#partsMgmtX').onclick=close;m.querySelector('#partsMgmtCancel').onclick=close;
 m.addEventListener('click',e=>{if(e.target===m)close()});
 m.querySelector('#partsMgmtForm').onsubmit=async e=>{e.preventDefault();const r=root();if(!r){alert('Firebase ainda não está disponível.');return}const btn=m.querySelector('#partsMgmtSave');btn.disabled=true;try{const ref=r.child('parts').push();await ref.set({name:document.getElementById('pmName').value.trim(),code:document.getElementById('pmCode').value.trim(),category:document.getElementById('pmCategory').value.trim(),quantity:Number(document.getElementById('pmQty').value||0),stock:Number(document.getElementById('pmQty').value||0),minStock:Number(document.getElementById('pmMin').value||0),unit:document.getElementById('pmUnit').value,cost:Number(document.getElementById('pmCost').value||0),supplier:document.getElementById('pmSupplier').value.trim(),location:document.getElementById('pmLocation').value.trim(),createdAt:firebase.database.ServerValue.TIMESTAMP,createdByDevice:window.deviceId||'DEV-NAVEGADOR'});close();document.getElementById('partsMgmtForm').reset();document.getElementById('pmQty').value='0';document.getElementById('pmMin').value='0';document.getElementById('pmCost').value='0';alert('Peça adicionada ao almoxarifado com sucesso.')}catch(err){console.error(err);alert('Não foi possível adicionar a peça.')}finally{btn.disabled=false}};
}

function addBar(){
 const section=document.getElementById('estoque');if(!section)return false;
 if(document.getElementById('partsMgmtBar'))return true;
 const heading=section.querySelector('h2');if(!heading)return false;
 const bar=document.createElement('div');bar.id='partsMgmtBar';
 const b=document.createElement('button');b.id='partsMgmtAdd';b.type='button';b.innerHTML='<i class="fa-solid fa-plus" style="margin-right:7px"></i>Adicionar Peça';b.onclick=()=>{ensureModal();document.getElementById('partsMgmtModal').classList.add('open');setTimeout(()=>document.getElementById('pmName')?.focus(),50)};bar.appendChild(b);
 heading.parentElement.appendChild(bar);return true;
}

async function removePart(id,name){const r=root();if(!r){alert('Firebase ainda não está disponível.');return}if(!confirm('Remover a peça "'+name+'" do almoxarifado?\n\nEsta ação não pode ser desfeita.'))return;try{await r.child('parts/'+id).remove();alert('Peça removida com sucesso.')}catch(e){console.error(e);alert('Não foi possível remover a peça.')}}

function addRemoveButtons(){
 const list=document.getElementById('partsList');if(!list)return false;const es=entries();if(!es.length)return true;
 const cards=[...list.children].filter(x=>x&&x.nodeType===1);
 cards.forEach((card,i)=>{if(card.querySelector('.parts-remove-btn'))return;const ent=es[i];if(!ent)return;const id=ent[0],p=ent[1]||{};const b=document.createElement('button');b.type='button';b.className='parts-remove-btn';b.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>Remover Peça';b.onclick=e=>{e.preventDefault();e.stopPropagation();removePart(id,label(p,id))};card.appendChild(b)});return true;
}

function scan(){ensureStyles();ensureModal();addBar();addRemoveButtons()}
function init(){scan();const ob=new MutationObserver(()=>{if(window.__partsMgmtFrame)return;window.__partsMgmtFrame=requestAnimationFrame(()=>{window.__partsMgmtFrame=0;scan()})});ob.observe(document.body,{childList:true,subtree:true});[300,800,1500,3000,5000,8000].forEach(ms=>setTimeout(scan,ms))}
window.addInventoryPart=()=>{ensureModal();document.getElementById('partsMgmtModal').classList.add('open')};window.removeInventoryPart=removePart;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
