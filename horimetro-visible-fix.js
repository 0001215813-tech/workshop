/* Correção de visibilidade da ação Aumentar Horímetro. Não altera a lógica do horímetro. */
(function(){
  'use strict';
  if(window.__horimetroVisibleFixInstalled)return;
  window.__horimetroVisibleFixInstalled=true;

  const getState=()=>window.cmmsState||{};
  const getAction=()=>window.aumentarHorimetro;

  function styles(){
    if(document.getElementById('horimetro-visible-fix-style'))return;
    const s=document.createElement('style');
    s.id='horimetro-visible-fix-style';
    s.textContent=`
      .horimetro-visible-fix{margin-top:10px;width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid #2563eb;background:#172554;color:#bfdbfe;border-radius:10px;padding:9px 10px;font-size:12px;font-weight:800;cursor:pointer;transition:.2s}
      .horimetro-visible-fix:hover{background:#2563eb;color:#fff}
    `;
    document.head.appendChild(s);
  }

  function addButtons(){
    const list=document.getElementById('equipmentList');
    const action=getAction();
    if(!list||typeof action!=='function')return;
    const entries=Object.entries(getState().equipments||{});
    if(!entries.length)return;

    const cards=Array.from(list.children);
    cards.forEach((card,index)=>{
      if(!card||card.querySelector('.horimetro-visible-fix'))return;

      let entry=null;
      const headings=Array.from(card.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      const cardName=(headings[0]?.textContent||'').trim();
      if(cardName){
        entry=entries.find(([,e])=>String(e?.name||e?.nome||e?.codigo||e?.code||'').trim()===cardName);
      }
      if(!entry)entry=entries[index];
      if(!entry)return;

      const button=document.createElement('button');
      button.type='button';
      button.className='horimetro-visible-fix';
      button.innerHTML='<i class="fa-solid fa-gauge-high"></i>Aumentar Horímetro';
      button.addEventListener('click',()=>action(entry[0],entry[1]));
      card.appendChild(button);
    });
  }

  function init(){
    styles();
    addButtons();
    const section=document.getElementById('equipamentos');
    if(section&&!section.dataset.horimetroVisibleObserver){
      section.dataset.horimetroVisibleObserver='1';
      new MutationObserver(()=>setTimeout(addButtons,20)).observe(section,{childList:true,subtree:true});
    }
    [100,300,700,1200,2000,3000,5000,8000].forEach(ms=>setTimeout(addButtons,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
