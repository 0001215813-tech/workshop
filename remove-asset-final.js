/* Remover Ativo - correção definitiva de identificação do ativo. */
(function(){
  'use strict';

  function getRoot(){try{return window.cmmsRoot||null}catch(e){return null}}
  function getState(){try{return window.cmmsState||{}}catch(e){return {}}}

  function getEntries(){
    var eq=(getState()&&getState().equipments)||{};
    if(Array.isArray(eq)) return eq.map(function(e,i){return [String(e&&((e.id)||(e.assetId)||i)),e||{}]});
    return Object.entries(eq);
  }

  function clean(v){
    return String(v==null?'':v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  }

  function valuesOf(e,id){
    e=e||{};
    return [
      id,
      e.id,e.assetId,e.codigo,e.code,e.name,e.type,e.modelo,e.model,
      e.location,e.localizacao,e.setor,e.area
    ].filter(function(v){return v!==undefined&&v!==null&&String(v).trim()!==''}).map(clean);
  }

  function resolveEntry(card,index,entries){
    var text=clean(card.innerText||'');
    var scored=entries.map(function(pair,i){
      var id=pair[0],e=pair[1]||{};
      var vals=valuesOf(e,id),score=0;
      vals.forEach(function(v){
        if(v && text.indexOf(v)!==-1) score += (v.length>=4 ? 10 : 2);
      });
      if(i===index) score+=1;
      return {pair:pair,score:score,index:i};
    }).sort(function(a,b){return b.score-a.score||a.index-b.index});
    if(!scored.length)return null;
    return scored[0].score>1 ? scored[0].pair : (entries[index]||null);
  }

  async function removeAsset(id,name){
    var r=getRoot();
    if(!r){alert('Firebase ainda não está disponível.');return}
    if(!id){alert('Não foi possível identificar este ativo.');return}
    if(!confirm('Remover o ativo "'+name+'" do cadastro?\n\nEsta ação não pode ser desfeita.'))return;
    try{
      await r.child('equipments').child(String(id)).remove();
      alert('Ativo removido com sucesso.');
    }catch(e){
      console.error('Erro ao remover ativo:',e);
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
      var pair=resolveEntry(card,index,entries);
      if(!pair)return;
      var id=String(pair[0]||'');
      var e=pair[1]||{};
      var name=String(e.name||e.codigo||e.code||id||'Ativo');

      card.setAttribute('data-resolved-asset-id',id);

      var b=card.querySelector('[data-remove-asset-final]');
      if(!b){
        b=document.createElement('button');
        b.type='button';
        b.setAttribute('data-remove-asset-final','1');
        b.innerHTML='🗑️ &nbsp;Remover Ativo';
        card.appendChild(b);
      }

      b.setAttribute('data-asset-id',id);
      b.setAttribute('data-asset-name',name);
      b.style.cssText='display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:12px!important;padding:10px 12px!important;border-radius:10px!important;background:#3f1720!important;border:1px solid #991b1b!important;color:#fca5a5!important;font-size:12px!important;font-weight:900!important;line-height:1.2!important;cursor:pointer!important;min-height:38px!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:50!important';

      b.onclick=function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var rid=String(b.getAttribute('data-asset-id')||card.getAttribute('data-resolved-asset-id')||'');
        var rname=b.getAttribute('data-asset-name')||'Ativo';
        if(rid) removeAsset(rid,rname);
        else alert('Não foi possível identificar este ativo.');
      };
    });
  }

  function install(){
    addButtons();
    if(window.MutationObserver){
      new MutationObserver(function(){setTimeout(addButtons,20)}).observe(document.body,{childList:true,subtree:true});
    }
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
