/* Compra de peças do almoxarifado: a compra fica EM TRÂNSITO e só altera o estoque quando a entrega chegar. */
(function(){
'use strict';
if(window.__partsBuyInitialized)return;
window.__partsBuyInitialized=true;
const DELIVERY_MS=30000;
function db(){try{return typeof firebase!=='undefined'&&firebase.database?firebase.database():null}catch(e){return null}}
function partsRef(){const d=db();return d?d.ref('workshopCMMS/parts'):null}
function ordersRef(){const d=db();return d?d.ref('workshopCMMS/partOrders'):null}
function value(p,...keys){for(const k of keys){if(p&&p[k]!==undefined&&p[k]!==null&&p[k]!=='')return p[k]}return ''}
function partName(p,id){return String(value(p,'name','nome','partName','descricao','description','code','codigo')||id||'Peça')}
function partQty(p){const n=Number(value(p,'quantity','stock','qty','quantidade')||0);return Number.isFinite(n)?n:0}
function formatRemaining(ms){const s=Math.max(0,Math.ceil(ms/1000));if(s<60)return s+'s';const m=Math.floor(s/60),r=s%60;return m+'min'+(r?' '+r+'s':'')}
function addStyles(){if(document.getElementById('partsBuyStyles'))return;const s=document.createElement('style');s.id='partsBuyStyles';s.textContent=`.parts-buy-btn{width:100%;margin-top:8px;padding:9px 12px;border-radius:10px;background:#2563eb;border:1px solid #3b82f6;color:#fff;font-size:12px;font-weight:800;cursor:pointer;display:block!important;visibility:visible!important;opacity:1!important;position:relative;z-index:2}.parts-buy-btn:hover{background:#3b82f6}.parts-buy-btn:disabled{opacity:.65!important;cursor:wait}.parts-buy-box{width:100%;box-sizing:border-box;margin-top:8px;padding:10px;border-radius:10px;background:#0f172a;border:1px solid #334155;display:none}.parts-buy-box.open{display:block}.parts-buy-box input{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;background:#020617;border:1px solid #334155;color:#e2e8f0}.parts-buy-box .pbb-actions{display:flex;gap:7px;margin-top:8px}.parts-buy-box button{border:0;border-radius:8px;padding:8px 10px;font-weight:800;cursor:pointer}.pbb-cancel{background:#1e293b;color:#e2e8f0}.pbb-confirm{background:#2563eb;color:#fff;flex:1}.parts-delivery-status{width:100%;box-sizing:border-box;margin-top:8px;padding:8px 10px;border-radius:9px;background:#172554;border:1px solid #1d4ed8;color:#bfdbfe;font-size:11px;font-weight:800}`;document.head.appendChild(s)}
async function loadParts(){const r=partsRef();if(!r)return {};try{const s=await r.once('value');return s.val()||{}}catch(e){console.error(e);return {}}}
async function loadOrders(){const r=ordersRef();if(!r)return {};try{const s=await r.once('value');return s.val()||{}}catch(e){console.error(e);return {}}}
function entries(parts){return Object.entries(parts||{})}
function findEntry(card,parts,index){const es=entries(parts),text=(card.textContent||'').trim().toLowerCase();return es.find(([id,p])=>{const n=partName(p,id).trim().toLowerCase();return n&&text.includes(n)})||es[index]}
/* REGISTRA somente a compra. O estoque NÃO é alterado nesta etapa. */
async function createPurchase(id,p,q){
 const or=ordersRef(),pr=partsRef();if(!or||!pr)throw new Error('Firebase indisponível');
 const now=Date.now(),eta=now+DELIVERY_MS,orderRef=or.push();
 const order={partId:id,partName:partName(p,id),quantity:q,unit:value(p,'unit','unidade')||'un',status:'pending',createdAt:firebase.database.ServerValue.TIMESTAMP,etaAt:eta,deliverySeconds:30};
 await orderRef.set(order);
 await pr.child(id).update({lastPurchaseAt:firebase.database.ServerValue.TIMESTAMP,lastPurchaseQuantity:q,lastPurchaseOrderId:orderRef.key,lastPurchaseStatus:'pending',lastPurchaseEta:eta});
 return orderRef.key;
}
/* Só executa depois de etaAt. */
async function deliverOrder(orderId,order){
 const or=ordersRef(),pr=partsRef();if(!or||!pr||!order||order.status!=='pending')return false;
 const eta=Number(order.etaAt);if(!Number.isFinite(eta)||eta>Date.now())return false;
 const tx=await or.child(orderId).transaction(cur=>{if(!cur||cur.status!=='pending'||!Number.isFinite(Number(cur.etaAt))||Number(cur.etaAt)>Date.now())return cur;return Object.assign({},cur,{status:'delivered',deliveredAt:firebase.database.ServerValue.TIMESTAMP})});
 if(!tx.committed)return false;
 await pr.child(order.partId).transaction(cur=>{if(!cur)return cur;const next=partQty(cur)+Math.max(0,Number(order.quantity)||0);return Object.assign({},cur,{quantity:next,stock:next,qty:next,quantidade:next,lastPurchaseStatus:'delivered',lastDeliveryAt:firebase.database.ServerValue.TIMESTAMP})});
 return true;
}
let pendingOrders={};
async function processDeliveries(){if(window.__partsDeliveryBusy)return;window.__partsDeliveryBusy=true;try{const orders=await loadOrders();for(const [id,o] of Object.entries(orders||{})){if(o&&o.status==='pending'&&Number.isFinite(Number(o.etaAt))&&Number(o.etaAt)<=Date.now())await deliverOrder(id,o)}pendingOrders=await loadOrders()}catch(e){console.error('Erro nas entregas:',e)}finally{window.__partsDeliveryBusy=false}}
function deliveryFor(id){return Object.entries(pendingOrders||{}).filter(([oid,o])=>o&&o.partId===id&&o.status==='pending').map(([oid,o])=>({id:oid,o:o})).sort((a,b)=>Number(a.o.etaAt)-Number(b.o.etaAt))}
function renderDelivery(card,id){let box=card.querySelector('.parts-delivery-status');const list=deliveryFor(id);if(!list.length){if(box)box.remove();return}if(!box){box=document.createElement('div');box.className='parts-delivery-status';const buy=card.querySelector('.parts-buy-btn');if(buy&&buy.parentNode)buy.parentNode.insertBefore(box,buy);else card.appendChild(box)}const first=list[0].o,total=list.reduce((sum,x)=>sum+Number(x.o.quantity||0),0);box.textContent='🚚 Entrega em '+formatRemaining(Number(first.etaAt)-Date.now())+' • '+total+' '+String(first.unit||'un')+' em trânsito'}
function buyUI(card,id,p){if(card.querySelector('.parts-buy-btn')){renderDelivery(card,id);return}const b=document.createElement('button');b.type='button';b.className='parts-buy-btn';b.innerHTML='<i class="fa-solid fa-cart-shopping" style="margin-right:7px"></i>Comprar Peça';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();let box=card.querySelector('.parts-buy-box');if(box){box.classList.toggle('open');return}box=document.createElement('div');box.className='parts-buy-box open';box.innerHTML='<div style="font-size:11px;color:#94a3b8;margin-bottom:6px">Quantidade a comprar</div><input class="pbb-input" type="number" min="1" step="1" value="1"><div style="font-size:11px;color:#94a3b8;margin-top:8px">Tempo de entrega: <strong style="color:#e2e8f0">30 segundos</strong></div><div class="pbb-actions"><button type="button" class="pbb-cancel">Cancelar</button><button type="button" class="pbb-confirm">Confirmar compra</button></div>';card.appendChild(box);box.querySelector('.pbb-cancel').onclick=()=>box.remove();box.querySelector('.pbb-confirm').onclick=async()=>{const q=Number(box.querySelector('.pbb-input').value);if(!Number.isInteger(q)||q<=0){alert('Informe uma quantidade inteira maior que zero.');return}const btn=box.querySelector('.pbb-confirm');btn.disabled=true;btn.textContent='Registrando...';try{await createPurchase(id,p,q);box.remove();pendingOrders=await loadOrders();renderDelivery(card,id);alert('Compra confirmada! A mercadoria ficará em trânsito por 30 segundos e só depois entrará no estoque.')}catch(err){console.error(err);alert('Não foi possível registrar a compra no Firebase.');btn.disabled=false;btn.textContent='Confirmar compra'}}});card.appendChild(b);renderDelivery(card,id)}
async function addButtons(){const list=document.getElementById('partsList');if(!list)return;const parts=await loadParts();window.__partsLoaded=parts;[...list.children].filter(x=>x&&x.nodeType===1).forEach((card,i)=>{const ent=findEntry(card,parts,i);if(ent)buyUI(card,ent[0],ent[1]||{})})}
function scan(){addStyles();addButtons()}
function init(){addStyles();loadOrders().then(x=>{pendingOrders=x;scan()});setInterval(async()=>{await processDeliveries();pendingOrders=await loadOrders();scan()},1000);setInterval(()=>document.querySelectorAll('#partsList>*').forEach((card,i)=>{const ent=findEntry(card,window.__partsLoaded||{},i);if(ent)renderDelivery(card,ent[0])}),500);[300,800,1500,3000,5000,8000].forEach(ms=>setTimeout(scan,ms))}
window.buyInventoryPart=async function(id,p){const q=prompt('Quantas unidades de "'+partName(p,id)+'" deseja comprar?','1');if(q===null)return;const n=Number(q);if(!Number.isInteger(n)||n<=0)return alert('Informe uma quantidade inteira maior que zero.');try{await createPurchase(id,p,n);pendingOrders=await loadOrders();alert('Compra confirmada! A mercadoria ficará em trânsito por 30 segundos e só depois entrará no estoque.')}catch(e){console.error(e);alert('Não foi possível registrar a compra no Firebase.')}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
