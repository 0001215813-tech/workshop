/* Remover Ativo - versão 6: botão garantido e remoção pelo ID real do Firebase. */
(function(){
  'use strict';
  var started=false, syncing=false;
  function db(){
    try{
      if(window.firebase && firebase.apps && firebase.apps.length) return firebase.database();
    }catch(e){}
    return null;
  }
  function norm(v){return String(v==null?'':v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();}
  function entriesFrom(v){
    if(Array.isArray(v)) return v.map(function(e,i){return [String(e&&e.id||e&&e.assetId||i),e||{}];});
    return Object.entries(v||{});
  }
  function nameOf(e,id){return String((e&&(e.name||e.codigo||e.code||e.modelo||e.model))||id||'Ativo');}
  function matchCard(card,entries,index){
    var text=norm(card.innerText||''), best=null, bestScore=-1;
    entries.forEach(function(p,i){
      var id=String(p[0]), e=p[1]||{}, score=0;
      var vals=[id,nameOf(e,id),e.type,e.localizacao,e.location,e.setor,e.area,e.codigo,e.code];
      vals.forEach(function(v){var x=norm(v);if(x&&text.indexOf(x)>=0)score+=x.length>=4?20:3;});
      if(i===index)score+=5;
      if(score>bestScore){bestScore=score;best=p;}
    });
    return best||entries[index]||null;
  }
  function style(b){
    b.setAttribute('data-remove-asset-final','1');
    b.style.cssText='display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:12px!important;padding:10px 12px!important;min-height:38px!important;border-radius:10px!important;background:#3f1720!important;border:1px solid #991b1b!important;color:#fca5a5!important;font-size:12px!important;font-weight:900!important;line-height:1.2!important;cursor:pointer!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:9999!important;';
  }
  async function removeById(id,name){
    var database=db();
    if(!database||!id){alert('Não foi possível identificar este ativo.');return;}
    if(!confirm('Remover o ativo "'+name+'" do cadastro?\n\nEsta ação não pode ser desfeita.'))return;
    try{await database.ref('equipments').child(String(id)).remove();alert('Ativo removido com sucesso.');}
    catch(e){console.error('Remover Ativo:',e);alert('Não foi possível remover o ativo. Verifique a conexão com o Firebase.');}
  }
  function ensureWithEntries(entries){
    var list=document.getElementById('equipmentList');
    if(!list||!entries.length)return;
    var cards=Array.prototype.slice.call(list.children).filter(function(c){return c&&c.nodeType===1;});
    cards.forEach(function(card,index){
      var pair=matchCard(card,entries,index);if(!pair)return;
      var id=String(pair[0]||''), e=pair[1]||{}, nm=nameOf(e,id);
      var b=card.querySelector('button[data-remove-asset-final]');
      if(!b){b=document.createElement('button');b.type='button';b.innerHTML='<i class="fa-solid fa-trash-can" style="margin-right:6px"></i>Remover Ativo';card.appendChild(b);}
      b.dataset.assetId=id;b.dataset.assetName=nm;style(b);
      if(!b.__removeBound){b.__removeBound=true;b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();removeById(b.dataset.assetId,b.dataset.assetName);});}
    });
  }
  async function sync(){
    if(syncing)return;var database=db();if(!database)return;syncing=true;
    try{var snap=await database.ref('equipments').once('value');ensureWithEntries(entriesFrom(snap.val()));}
    catch(e){console.warn('Remover Ativo:',e)}finally{syncing=false;}
  }
  function install(){
    if(started)return;started=true;
    sync();
    if(window.MutationObserver)new MutationObserver(function(){setTimeout(sync,0);}).observe(document.body,{childList:true,subtree:true});
    setInterval(sync,1000);
  }
  window.removeAsset=removeById;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
