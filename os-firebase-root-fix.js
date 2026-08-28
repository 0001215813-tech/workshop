/* Corrige somente a referência ao Firebase usada pelos módulos externos da O.S. */
(function(){
  'use strict';
  function install(){
    try{
      Object.defineProperty(window,'cmmsRoot',{
        configurable:true,
        get:function(){
          try{
            const current=typeof window.__cmmsRootRef==='function'?window.__cmmsRootRef():null;
            if(current) return current;
            if(typeof firebase!=='undefined' && firebase.database) return firebase.database().ref('workshopCMMS');
          }catch(e){console.warn('Firebase root fallback',e)}
          return null;
        }
      });
    }catch(e){console.warn('Falha ao instalar correção do Firebase',e)}
  }
  install();
  setTimeout(install,100);
  setTimeout(install,500);
  setTimeout(install,1500);
})();
