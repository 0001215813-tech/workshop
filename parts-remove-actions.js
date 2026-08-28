/* Opção de remover peças do almoxarifado - somente adiciona o recurso de remoção. */
(function(){
'use strict';

function db(){
  try{
    if(typeof firebase==='undefined'||!firebase.database)return null;
    return firebase.database();
  }catch(e){
    console.error('Firebase peças - remoção:',e);
    return null;
  }
}

function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
function label(p,id){return String(p?.name||p?.nome||p?.partName||p?.descricao||p?.description||p?.code||p?.codigo||id||'Peça');}

function styles(){
  if(document.getElementById('partsRemoveFixStyles'))return;
  const s=document.createElement('style');
  s.id='partsRemoveFixStyles';
  s.textContent=`
    .parts-remove-fix-btn{
      display:block!important;width:100%;margin-top:8px;padding:10px 12px;
      border-radius:10px;background:rgba(220,38,38,.14);
      border:1px solid rgba(248,113,113,.38);color:#fca5a5;
      font-size:12px;font-weight:900;cursor:pointer;position:relative;z-index:25;
    }
    .parts-remove-fix-btn:hover{background:#dc2626;color:#fff;border-color:#ef4444}
    .parts-remove-fix-btn:disabled{opacity:.6;cursor:wait}
  `;
  document.head.appendChild(s);
}

async function getEntries(){
  const d=db();
  if(!d)return [];
  try{
    const snap=await d.ref('workshopCMMS/parts').once('value');
    return Object.entries(snap.val()||{});
  }catch(e){
    console.error('Erro ao ler peças para remoção:',e);
    return [];
  }
}

async function removePart(id,name,button){
  const d=db();
  if(!d){alert('Firebase não está disponível.');return;}
  if(!confirm('Remover a peça "'+name+'" do almoxarifado?\n\nEsta ação não pode ser desfeita.'))return;
  if(button){button.disabled=true;button.textContent='Removendo...';}
  try{
    await d.ref('workshopCMMS/parts').child(id).remove();
    const render=window.cmmsRender;
    if(typeof render==='function'){
      render();
    }else{
      location.reload();
    }
  }catch(e){
    console.error('Erro ao remover peça:',e);
    alert('Não foi possível remover a peça do Firebase.');
    if(button){button.disabled=false;button.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>Remover Peça';}
  }
}

async function addButtons(){
  const list=document.getElementById('partsList');
  if(!list)return;
  const entries=await getEntries();
  if(!entries.length)return;
  const cards=[...list.children].filter(x=>x&&x.nodeType===1);
  cards.forEach((card,i)=>{
    if(card.querySelector('.parts-remove-fix-btn'))return;
    const text=(card.textContent||'').toLowerCase();
    let ent=entries.find(([id,p])=>{
      const n=label(p,id).toLowerCase();
      const c=String(p?.code||p?.codigo||'').toLowerCase();
      return (n&&text.includes(n))||(c&&text.includes(c));
    })||entries[i];
    if(!ent)return;
    const id=ent[0],p=ent[1]||{};
    const b=document.createElement('button');
    b.type='button';
    b.className='parts-remove-fix-btn';
    b.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>Remover Peça';
    b.onclick=e=>{e.preventDefault();e.stopPropagation();removePart(id,label(p,id),b)};
    card.appendChild(b);
  });
}

function scan(){styles();addButtons();}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
new MutationObserver(()=>{
  clearTimeout(window.__partsRemoveFixTimer);
  window.__partsRemoveFixTimer=setTimeout(scan,120);
}).observe(document.body,{childList:true,subtree:true});
setInterval(scan,2000);
})();
