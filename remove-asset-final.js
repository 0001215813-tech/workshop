/* Remover Ativo - versão robusta. Mantém o restante do app intacto. */
(function(){
  'use strict';
  function getRoot(){try{return window.cmmsRoot||null}catch(e){return null}}
  function getState(){try{return window.cmmsState||{}}catch(e){return {}}}
  function getEntries(){return Object.entries((getState()&&getState().equipments)||{})}
  async function removeAsset(id,name){
    var r=getRoot();
    if(!r){alert('Firebase ainda não está disponível.');return}
    if(!id){alert('Não foi possível identificar este ativo.');return}
    if(!confirm('Remover o ativo "'+name+'" do cadastro?\n\nEsta ação não pode ser desfeita.'))return;
    try{
      await r.child('equipments').child(id).remove();
      alert('Ativo removido com sucesso.');
    }catch(e){
      console.error(e);
      alert('Não foi possível remover o ativo. Verifique a conexão com o Firebase.');
    }
  }
  function addButtons(){
    var list=document.getElementById('equipmentList');
    if(!list)return;
    var entries=getEntries();
    if(!entries.length)return;
    var cards=Array.prototype.slice.call(list.children).filter(function(x){return x&&x.nodeType===1});
    cards.forEach(function(card,index){
      var pair=entries[index];
      var id=pair?pair[0]:null;
      var e=pair?(pair[1]||{}):{};
      var name=String(e.name||e.codigo||e.code||id||'Ativo');
      var b=card.querySelector('[data-remove-asset-final]');
      if(!b){
        b=document.createElement('button');
        b.type='button';
        b.setAttribute('data-remove-asset-final','1');
        b.innerHTML='🗑️ &nbsp;Remover Ativo';
        card.appendChild(b);
      }
      /* Atualiza sempre o ID. Isso corrige o caso em que o botão foi criado
         antes do Firebase terminar de carregar os ativos. */
      b.setAttribute('data-asset-id',id||'');
      b.setAttribute('data-asset-name',name);
      b.style.cssText='display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:12px!important;padding:10px 12px!important;border-radius:10px!important;background:#3f1720!important;border:1px solid #991b1b!important;color:#fca5a5!important;font-size:12px!important;font-weight:900!important;line-height:1.2!important;cursor:pointer!important;min-height:38px!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:50!important';
      b.onclick=function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var rid=b.getAttribute('data-asset-id');
        var rname=b.getAttribute('data-asset-name')||'Ativo';
        if(rid)removeAsset(rid,rname);
        else alert('Não foi possível identificar este ativo.');
      };
    });
  }
  function install(){
    addButtons();
    new MutationObserver(function(){setTimeout(addButtons,0)}).observe(document.body,{childList:true,subtree:true});
    setInterval(addButtons,500);
    var tries=0,t=setInterval(function(){
      try{
        var r=getRoot();
        if(r){
          r.child('equipments').on('value',function(){setTimeout(addButtons,50)});
        }
      }catch(e){}
      if(++tries>120)clearInterval(t);
    },250);
  }
  window.removeAsset=removeAsset;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
