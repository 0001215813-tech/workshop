/* Exibe a opção de aumentar o horímetro diretamente nos cards de Cadastro de Ativos. */
(function(){
'use strict';
if(window.__horimetroVisibleFixInstalled)return;
window.__horimetroVisibleFixInstalled=true;
function styles(){if(document.getElementById('horimetro-visible-style'))return;const s=document.createElement('style');s.id='horimetro-visible-style';s.textContent='.horimetro-visible-fix{margin-top:12px!important;width:100%!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;border:1px solid #2563eb!important;background:#172554!important;color:#bfdbfe!important;border-radius:10px!important;padding:10px 12px!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important}.horimetro-visible-fix:hover{background:#2563eb!important;color:#fff!important}';document.head.appendChild(s)}
function install(){styles();const list=document.getElementById('equipmentList');if(!list)return;Array.from(list.children).forEach(card=>{if(card.querySelector('.horimetro-visible-fix'))return;const h=card.querySelector('h3');const name=(h?.textContent||'').trim();if(!name)return;const b=document.createElement('button');b.type='button';b.className='horimetro-visible-fix';b.innerHTML='<i class="fa-solid fa-gauge-high"></i><span>Aumentar Horímetro</span>';b.onclick=()=>{if(typeof window.aumentarHorimetroPorNome==='function'){window.aumentarHorimetroPorNome(name)}else if(typeof window.aumentarHorimetro==='function'){window.aumentarHorimetro(null,name)}else alert('Módulo do horímetro ainda está carregando.');};card.appendChild(b)})}
function init(){styles();install();const observer=new MutationObserver(()=>setTimeout(install,50));observer.observe(document.body,{childList:true,subtree:true});setInterval(install,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
