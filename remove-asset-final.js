/* Correção definitiva do botão Remover Ativo. Não altera outras funções. */
(function(){
  'use strict';
  var started=false;

  function getRoot(){ return window.cmmsRoot || null; }
  function getState(){ return window.cmmsState || {}; }
  function entries(){ return Object.entries((getState().equipments)||{}); }

  function findIdByCard(card){
    var title=card.querySelector('h3');
    var wanted=((title && title.textContent)||'').trim();
    if(!wanted) return null;
    var list=entries();
    for(var i=0;i<list.length;i++){
      var id=list[i][0], e=list[i][1]||{};
      var names=[e.name,e.codigo,e.code,e.id,id].filter(Boolean).map(function(x){return String(x).trim();});
      if(names.indexOf(wanted)>=0) return {id:id,name:String(e.name||e.codigo||e.code||id)};
    }
    return null;
  }

  async function remove(id,name){
    var r=getRoot();
    if(!r){ alert('Firebase ainda não está disponível.'); return; }
    if(!window.confirm('Remover o ativo "'+name+'" do cadastro?\n\nEsta ação não pode ser desfeita.')) return;
    try{
      await r.child('equipments').child(id).remove();
      alert('Ativo removido com sucesso.');
    }catch(e){
      console.error('removeAssetFinal',e);
      alert('Não foi possível remover o ativo.');
    }
  }

  function add(){
    var list=document.getElementById('equipmentList');
    if(!list) return;
    Array.prototype.slice.call(list.children).forEach(function(card){
      if(!card || card.nodeType!==1 || card.querySelector('[data-remove-asset-final]')) return;
      var info=findIdByCard(card);
      if(!info) return;

      var wrap=document.createElement('div');
      wrap.setAttribute('data-remove-asset-final-wrap','1');
      wrap.style.cssText='width:100%;margin-top:12px;padding-top:12px;border-top:1px solid #1e293b;';

      var btn=document.createElement('button');
      btn.type='button';
      btn.setAttribute('data-remove-asset-final','1');
      btn.className='w-full rounded-xl px-3 py-2.5 text-xs font-black transition';
      btn.style.cssText='width:100%;padding:10px 12px;border-radius:10px;background:#3f1720;border:1px solid #7f1d1d;color:#fca5a5;font-size:12px;font-weight:900;cursor:pointer;';
      btn.innerHTML='<i class="fa-solid fa-trash" style="margin-right:7px"></i>Remover Ativo';
      btn.onmouseenter=function(){btn.style.background='#991b1b';btn.style.color='#fff';};
      btn.onmouseleave=function(){btn.style.background='#3f1720';btn.style.color='#fca5a5';};
      btn.onclick=function(ev){
        ev.preventDefault(); ev.stopPropagation();
        remove(info.id,info.name);
      };
      wrap.appendChild(btn);
      card.appendChild(wrap);
    });
  }

  function watchFirebase(){
    var r=getRoot();
    if(!r) return false;
    if(started) return true;
    started=true;
    try{
      r.child('equipments').on('value',function(){ setTimeout(add,0); });
    }catch(e){ console.warn('removeAssetFinal watcher',e); }
    return true;
  }

  function init(){
    add();
    watchFirebase();
    var listObserver=new MutationObserver(function(){
      requestAnimationFrame(function(){ add(); watchFirebase(); });
    });
    listObserver.observe(document.body,{childList:true,subtree:true});
    var tries=0;
    var timer=setInterval(function(){
      add();
      if(watchFirebase() || ++tries>120) clearInterval(timer);
    },250);
  }

  window.removeAsset=remove;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
