/* Remover Ativo - versão 5: botão persistente e identificação pelo Firebase. */
(function(){
  'use strict';
  var started=false;
  function root(){ try{return window.cmmsRoot||null}catch(e){return null} }
  function norm(v){return String(v==null?'':v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();}
  function entriesFromSnapshot(snap){
    var v=snap&&snap.val?snap.val():{};
    if(Array.isArray(v)) return v.map(function(e,i){return [String(e&&e.id||e&&e.assetId||i),e||{}]});
    return Object.entries(v||{});
  }
  function nameOf(e,id){return String((e&& (e.name||e.codigo||e.code||e.modelo||e.model)) || id || 'Ativo');}
  function match(card,entries,index){
    var text=norm(card.innerText||'');
    var best=null,bscore=-1;
    entries.forEach(function(p,i){
      var id=String(p[0]),e=p[1]||{},score=0;
      [id,nameOf(e,id),e.type,e.localizacao,e.location,e.setor,e.area,e.codigo,e.code].forEach(function(v){
        var x=norm(v); if(x && text.indexOf(x)>=0) score += x.length>=4?20:3;
      });
      if(i===index) score+=2;
      if(score>bscore){bscore=score;best=p;}
    });
    return best || entries[index] || null;
  }
  function style(b){
    b.style.display='block';b.style.width='100%';b.style.boxSizing='border-box';b.style.marginTop='12px';b.style.padding='10px 12px';b.style.minHeight='38px';b.style.borderRadius='10px';b.style.background='#3f1720';b.style.border='1px solid #991b1b';b.style.color='#fca5a5';b.style.fontSize='12px';b.style.fontWeight='900';b.style.lineHeight='1.2';b.style.cursor='pointer';b.style.visibility='visible';b.style.opacity='1';b.style.position='relative';b.style.zIndex='999';}
  async function removeById(id,name){
    var r=root();
    if(!r||!id){alert('Não foi possível identificar este ativo.');return;}
    if(!confirm('Remover o ativo "'+name+'" do cadastro?\n\nEsta ação não pode ser desfeita.'))return;
    try{await r.child('equipments').child(String(id)).remove();alert('Ativo removido com sucesso.');}
    catch(e){console.error(e);alert('Não foi possível remover o ativo. Verifique a conexão com o Firebase.');}
  }
  function ensure(entries){
    var list=document.getElementById('equipmentList');
    if(!list)return;
    var cards=Array.prototype.slice.call(list.children).filter(function(c){return c.nodeType===1;});
    cards.forEach(function(card,index){
      var pair=match(card,entries,index); if(!pair)return;
      var id=String(pair[0]||'');var e=pair[1]||{};var nm=nameOf(e,id);
      var b=card.querySelector('button[data-remove-asset-final]');
      if(!b){b=document.createElement('button');b.type='button';b.setAttribute('data-remove-asset-final','1');b.innerHTML='<i class="fa-solid fa-trash-can" style="margin-right:6px"></i>Remover Ativo';card.appendChild(b);}
      b.dataset.assetId=id;b.dataset.assetName=nm;style(b);
      if(!b.__removeBound){b.__removeBound=true;b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();removeById(b.dataset.assetId,b.dataset.assetName);});}
    });
  }
  async function sync(){
    var r=root(); if(!r)return;
    try{var snap=await r.child('equipments').once('value');ensure(entriesFromSnapshot(snap));}catch(e){console.warn('Remover Ativo:',e);}
  }
  function install(){
    if(started)return;started=true;
    sync();
    if(window.MutationObserver)new MutationObserver(function(){sync();}).observe(document.body,{childList:true,subtree:true});
    setInterval(sync,800);
  }
  window.removeAsset=removeById;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
