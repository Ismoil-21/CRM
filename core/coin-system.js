// ================================================
// COIN SHOP SYSTEM — EduManage
// Admin: mahsulot qo'shish + mentorga coin
// Talaba: coin shop — sotib olish
// ================================================
(function(){
'use strict';

var SHOP_KEY     = 'edu_shop_v1';
var COIN_KEY     = 'edu_mentor_coins_v1';
var PURCHASE_KEY = 'edu_purchases_v1';

function getShop(){try{return JSON.parse(localStorage.getItem(SHOP_KEY)||'[]');}catch(e){return[];}}
function saveShop(d){localStorage.setItem(SHOP_KEY,JSON.stringify(d));}
function getCoins(){try{return JSON.parse(localStorage.getItem(COIN_KEY)||'{}');}catch(e){return{};}}
function saveCoins(d){localStorage.setItem(COIN_KEY,JSON.stringify(d));}
function getPurchases(){try{return JSON.parse(localStorage.getItem(PURCHASE_KEY)||'[]');}catch(e){return[];}}
function savePurchases(d){localStorage.setItem(PURCHASE_KEY,JSON.stringify(d));}

// Per-group mentor balance: key = "mg_MentorName_GroupId"
function _mgKey(name,gid){return 'mg_'+name+'_'+gid;}
function getMentorGroupBal(name,gid){return getCoins()[_mgKey(name,gid)]||0;}
function setMentorGroupBal(name,gid,n){var c=getCoins();c[_mgKey(name,gid)]=Math.max(0,n);saveCoins(c);}
// Sum across all groups (for display/compatibility)
function getMentorBal(name){
  var c=getCoins(),sum=0,hasGroup=false;
  Object.keys(c).forEach(function(k){
    if(k.startsWith('mg_'+name+'_')){sum+=c[k]||0;hasGroup=true;}
  });
  // Legacy fallback: FAQAT guruh keylari yo'q bo'lsa ishlatilsin
  if(!hasGroup&&c['m_'+name])sum=c['m_'+name];
  return sum;
}
// Legacy setMentorBal not used for new sends, kept for compatibility
function setMentorBal(name,n){var c=getCoins();c['m_'+name]=Math.max(0,n);saveCoins(c);}
function getStudentBal(id){return getCoins()['s_'+id]||0;}
function setStudentBal(id,n){var c=getCoins();c['s_'+id]=Math.max(0,n);saveCoins(c);}

// ─── Backend bilan sinxronlash ───────────────────────────────────────────────
var API_BASE=(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1')
  ?(window.location.protocol+'//'+window.location.hostname+':'+(window.location.port||3000))
  :window.location.origin;

function syncToBackend(){
  try{
    var payload={coins:getCoins(),shop:getShop(),purchases:getPurchases()};
    fetch(API_BASE+'/api/coins',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){});
  }catch(e){}
}

function loadFromBackend(cb){
  // /api/kv dan o'qiymiz — shim ham shu yerga yozadi, bir xil manba
  fetch(API_BASE+'/api/kv').then(function(r){return r.json();}).then(function(d){
    if(!d||!d.ok)return cb&&cb();
    var data=d.data||{};
    // Storage.prototype.setItem — shimni bypass qilib faqat local yangilaymiz (loop bo'lmasin)
    if(data[COIN_KEY]){
      try{
        var coins=JSON.parse(data[COIN_KEY]);
        if(typeof coins==='object'&&Object.keys(coins).length){
          Storage.prototype.setItem.call(localStorage,COIN_KEY,data[COIN_KEY]);
        }
      }catch(e){}
    }
    if(data[SHOP_KEY]){
      try{
        var shop=JSON.parse(data[SHOP_KEY]);
        if(Array.isArray(shop)&&shop.length){
          Storage.prototype.setItem.call(localStorage,SHOP_KEY,data[SHOP_KEY]);
        }
      }catch(e){}
    }
    if(data[PURCHASE_KEY]){
      try{
        var purchases=JSON.parse(data[PURCHASE_KEY]);
        if(Array.isArray(purchases)&&purchases.length){
          Storage.prototype.setItem.call(localStorage,PURCHASE_KEY,data[PURCHASE_KEY]);
        }
      }catch(e){}
    }
    cb&&cb();
  }).catch(function(){cb&&cb();});
}
// ─────────────────────────────────────────────────────────────────────────────
function tl(uz,ru,en){var l=(typeof LANG!=='undefined'?LANG:null)||window.LANG||'uz';return l==='ru'?ru:l==='en'?en:uz;}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function escJs(s){return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");}

function coinPill(n,big){
  var fs=big?'15px':'12px', pad=big?'5px 14px':'3px 10px';
  return '<span style="display:inline-flex;align-items:center;gap:3px;background:linear-gradient(135deg,rgba(245,158,11,0.22),rgba(217,119,6,0.15));color:#fcd34d;font-size:'+fs+';font-weight:800;padding:'+pad+';border-radius:20px;border:1.5px solid rgba(251,191,36,0.55);box-shadow:0 0 6px rgba(245,158,11,0.2)">🪙 '+n+'</span>';
}
function toast(msg,color){
  color=color||'#0d9488';
  var el=document.createElement('div');
  el.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg);border:2px solid '+color+';padding:10px 22px;border-radius:24px;font-size:14px;font-weight:700;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.18);white-space:nowrap';
  el.textContent=msg;document.body.appendChild(el);
  setTimeout(function(){el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(function(){el.remove();},350);},2400);
}
function fmtDate(d){
  if(!d)return'—';var dt=new Date(d);
  return String(dt.getDate()).padStart(2,'0')+'.'+String(dt.getMonth()+1).padStart(2,'0')+'.'+dt.getFullYear()+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');
}

function injectStyles(){
  if(document.getElementById('cs-styles'))return;
  var s=document.createElement('style');s.id='cs-styles';
  s.textContent=
    '.cs-tab{padding:8px 16px;border-radius:20px;border:2px solid var(--border2);background:var(--bg2);color:var(--text);font-size:13px;font-weight:700;cursor:pointer;transition:.15s}'
    +'.cs-tab:hover{border-color:#f59e0b;background:var(--bg3);color:var(--amber-text,#92400e)}'
    +'.cs-tab-act{background:var(--accent,#3b82f6)!important;color:#fff!important;border-color:transparent!important}'
    +'.cs-mrow{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:14px;border:2px solid var(--border2);background:var(--bg2);cursor:pointer;margin-bottom:9px;transition:.15s}'
    +'.cs-mrow:hover{border-color:#f59e0b;background:var(--bg3)}'
    +'.cs-mrow.selected{border-color:#f59e0b!important;background:rgba(245,158,11,0.12)!important}'
    +'.cs-modal-input{width:100%;border:2px solid var(--border2);border-radius:10px;outline:none;box-sizing:border-box;background:var(--bg2);color:var(--text);transition:.2s;font-family:inherit}'
    +'.cs-modal-input:focus{border-color:#f59e0b}'
    +'@keyframes csUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

// ===================================================
// ADMIN COIN SHOP
// ===================================================
window.renderAdminCoinShop=function(){
  var wrap=document.getElementById('panel-coin-shop');if(!wrap)return;
  injectStyles();
  var items=getShopItems();
  var purchases=getPurchases();

  wrap.innerHTML=
    '<div style="padding:0 0 32px">'
    // Header
    +'<div style="background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:18px;padding:24px 26px;color:#fff;margin-bottom:22px;position:relative;overflow:hidden;box-shadow:0 4px 24px rgba(245,158,11,.3)">'
      +'<div style="position:absolute;right:-20px;top:-20px;font-size:110px;opacity:.1;pointer-events:none">🪙</div>'
      +'<div style="font-size:24px;font-weight:900;margin-bottom:4px">🪙 Coin Shop</div>'
      +'<div style="font-size:13px;opacity:.88;margin-bottom:18px">'+tl("Mahsulotlar · Mentor balanslari · Xaridlar tarixi","Товары · Балансы менторов · История покупок","Products · Mentor balances · Purchases")+'</div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
        +'<button onclick="csOpenAddProduct()" style="background:rgba(255,255,255,.22);border:2px solid rgba(255,255,255,.6);color:#fff;border-radius:24px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer">➕ '+tl("Mahsulot qo'shish","Добавить товар","Add Product")+'</button>'
        +'<button onclick="csOpenSendCoin()" style="background:rgba(255,255,255,.22);border:2px solid rgba(255,255,255,.6);color:#fff;border-radius:24px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer">🎁 '+tl("Mentorga coin","Монеты ментору","Coins to Mentor")+'</button>'
      +'</div>'
    +'</div>'
    // Stats
    +'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:22px">'
      +'<div style="background:var(--bg2);border:1.5px solid #bfdbfe;border-radius:14px;padding:16px"><div style="font-size:22px;margin-bottom:6px">📦</div><div style="font-size:24px;font-weight:900;color:var(--accent)">'+items.length+'</div><div style="font-size:12px;color:var(--text2);font-weight:600">'+tl('Mahsulotlar','Товары','Products')+'</div></div>'
      +'<div style="background:var(--teal-light);border:1.5px solid var(--teal);border-radius:14px;padding:16px"><div style="font-size:22px;margin-bottom:6px">🧾</div><div style="font-size:24px;font-weight:900;color:var(--teal-text)">'+purchases.length+'</div><div style="font-size:12px;color:var(--text2);font-weight:600">'+tl('Jami xaridlar','Всего покупок','Total Purchases')+'</div></div>'
    +'</div>'
    // Tabs
    +'<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">'
      +'<button id="cstab-p" onclick="csTab(\'p\')" class="cs-tab cs-tab-act">📦 '+tl('Mahsulotlar','Товары','Products')+' ('+items.length+')</button>'
      +'<button id="cstab-x" onclick="csTab(\'x\')" class="cs-tab">🧾 '+tl('Xaridlar','Покупки','Purchases')+' ('+(purchases.filter(function(p){return p.type!=='admin-send';}).length)+')</button>'
    +'</div>'
    +'<div id="csp-p">'+renderAdminProducts(items)+'</div>'
    +'<div id="csp-x" style="display:none">'+renderAdminPurchases(purchases)+'</div>'
    +'</div>';
};

function getShopItems(){return getShop();}

function csAllCoinSum(){
  var c=getCoins(),sum=0;
  Object.keys(c).forEach(function(k){if(k.startsWith('m_'))sum+=c[k]||0;});
  return sum;
}

window.csTab=function(t){
  ['p','x'].forEach(function(k){
    var p=document.getElementById('csp-'+k),b=document.getElementById('cstab-'+k);
    if(p)p.style.display=k===t?'block':'none';
    if(b){b.className=k===t?'cs-tab cs-tab-act':'cs-tab';}
  });
};

function renderAdminProducts(items){
  if(!items.length)return(
    '<div style="text-align:center;padding:70px 20px;color:var(--text3)">'
    +'<div style="font-size:64px;margin-bottom:16px">🛒</div>'
    +'<div style="font-size:18px;font-weight:700;margin-bottom:8px">'+tl("Mahsulot yo'q","Товаров нет","No products yet")+'</div>'
    +'<div style="font-size:13px">'+tl("'+ Mahsulot qo\\'shish' tugmasini bosing","Нажмите '+ Добавить товар'","Click '+ Add Product'")+'</div>'
    +'</div>'
  );
  return'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px">'
    +items.map(function(item){
      var st=item.stock||0,so=st<=0;
      var sc=so?'#ef4444':st<=3?'#f59e0b':'#10b981';
      var sbg=so?'#fef2f2':st<=3?'#fffbeb':'#f0fdf4';
      return'<div style="background:var(--bg);border-radius:18px;overflow:hidden;border:1.5px solid var(--border);box-shadow:0 2px 12px rgba(0,0,0,.07);transition:.2s" onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 10px 28px rgba(0,0,0,.13)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 12px rgba(0,0,0,.07)\'">'
        +'<div style="position:relative;height:140px;overflow:hidden;background:linear-gradient(135deg,#fef3c7,#fde68a)">'
          +(item.image?'<img src="'+esc(item.image)+'" style="width:100%;height:100%;object-fit:cover">':'<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:52px">🎁</div>')
          +(so?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:14px;font-weight:800;border:2px solid rgba(255,255,255,.7);padding:4px 14px;border-radius:20px">'+tl('TUGAGAN','НЕТУ','SOLD OUT')+'</span></div>':'')
        +'</div>'
        +'<div style="padding:14px 16px">'
          +'<div style="font-size:15px;font-weight:800;margin-bottom:10px;line-height:1.3;color:var(--text)">'+esc(item.name)+'</div>'
          +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
            +coinPill(item.price)
            +'<span style="font-size:12px;font-weight:700;color:'+sc+';background:'+sbg+';padding:3px 10px;border-radius:12px;border:1.5px solid '+sc+'">📦 '+st+' '+tl('ta','шт','left')+'</span>'
          +'</div>'
          +'<div style="display:flex;gap:7px">'
            +'<button onclick="csOpenAddProduct(\''+escJs(item.id)+'\')" style="flex:1;padding:8px;border-radius:10px;border:1.5px solid var(--border2);background:var(--bg2);font-size:12px;font-weight:700;cursor:pointer" onmouseover="this.style.background=\'#eff6ff\'" onmouseout="this.style.background=\'#f8fafc\'">✏️ '+tl('Tahrir','Изменить','Edit')+'</button>'
            +'<button onclick="csDeleteProduct(\''+escJs(item.id)+'\')" style="padding:8px 12px;border-radius:10px;border:1.5px solid #fecaca;background:var(--bg)5f5;color:#ef4444;font-size:12px;font-weight:700;cursor:pointer" onmouseover="this.style.background=\'#fee2e2\'" onmouseout="this.style.background=\'#fff5f5\'">🗑</button>'
          +'</div>'
        +'</div>'
      +'</div>';
    }).join('')+'</div>';
}

function renderAdminBalances(){
  var mentors=(window.D&&window.D.mentors)||[];
  if(!mentors.length)return'<div style="text-align:center;padding:40px;color:var(--text3);font-size:14px">'+tl("Mentorlar yo'q","Менторов нет","No mentors")+'</div>';
  return'<div style="font-size:15px;font-weight:800;margin-bottom:16px">🎓 '+tl("Mentor coinlari (guruh bo\'yicha)","Монеты менторов (по группам)","Mentor Coins (per group)")+'</div>'
    +'<div style="display:flex;flex-direction:column;gap:14px">'
    +mentors.map(function(m){
      var grps=((window.D&&window.D.groups)||[]).filter(function(g){return g.mentor===m.name;});
      var totalBal=getMentorBal(m.name);
      var grpRows=grps.length?grps.map(function(g){
        var gBal=getMentorGroupBal(m.name,g.id);
        return'<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:9px;background:var(--bg3);font-size:12px">'
          +'<span style="flex:1;font-weight:600">📚 '+esc(g.name||g.id)+'</span>'
          +coinPill(gBal)
        +'</div>';
      }).join(''):'<div style="font-size:11px;color:var(--text3);padding:4px 0">'+tl("Guruh yo'q","Нет групп","No groups")+'</div>';
      return'<div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:14px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
          +'<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0">'+(m.name[0]||'M')+'</div>'
          +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700">'+esc(m.name)+'</div>'
          +'<div style="font-size:11px;color:var(--text3)">'+tl('Jami','Итого','Total')+': '+coinPill(totalBal)+'</div></div>'
          +'<button onclick="csOpenSendCoin(\''+escJs(m.name)+'\')" style="padding:5px 12px;border-radius:8px;border:1.5px solid #fbbf24;background:var(--bg3);color:#92400e;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0">+🪙</button>'
        +'</div>'
        +'<div style="display:flex;flex-direction:column;gap:5px">'+grpRows+'</div>'
      +'</div>';
    }).join('')+'</div>';
}

function renderAdminPurchases(purchases){
  // Faqat talaba xaridlarini ko'rsatamiz (admin->mentor transferlarini emas)
  var filtered = purchases.filter(function(p){return p.type !== 'admin-send';});
  if(!filtered.length)return'<div style="text-align:center;padding:50px;color:var(--text3)"><div style="font-size:44px;margin-bottom:12px">🧾</div><div style="font-size:14px">'+tl("Xaridlar yo'q","Покупок нет","No purchases yet")+'</div></div>';
  var sorted=filtered.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  return'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:var(--bg2);border-radius:14px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.07)">'
    +'<thead><tr style="background:var(--bg2);border-bottom:2px solid var(--border2)">'
    +'<th style="text-align:left;padding:12px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase">'+tl('Talaba','Студент','Student')+'</th>'
    +'<th style="text-align:left;padding:12px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase">'+tl('Mahsulot','Товар','Product')+'</th>'
    +'<th style="text-align:center;padding:12px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase">'+tl('Narxi','Цена','Price')+'</th>'
    +'<th style="text-align:center;padding:12px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase">'+tl('Sana','Дата','Date')+'</th>'
    +'<th style="text-align:center;padding:12px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase">'+tl('Holat','Статус','Status')+'</th>'
    +'</tr></thead><tbody>'
    +sorted.map(function(p,i){
      return'<tr style="border-bottom:1px solid var(--border);background:'+(i%2?'var(--bg2)':'var(--bg)')+'">'
        +'<td style="padding:11px 14px"><div style="font-size:13px;font-weight:700">'+esc(p.studentName||'—')+'</div></td>'
        +'<td style="padding:11px 14px"><div style="display:flex;align-items:center;gap:10px">'
          +(p.itemImage?'<img src="'+esc(p.itemImage)+'" style="width:34px;height:34px;border-radius:8px;object-fit:cover">':'<div style="width:34px;height:34px;border-radius:8px;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:16px">🎁</div>')
          +'<span style="font-size:13px;font-weight:600">'+esc(p.itemName||'—')+'</span></div></td>'
        +'<td style="text-align:center;padding:11px 14px">'+coinPill(p.coinPrice||0)+'</td>'
        +'<td style="text-align:center;padding:11px 14px;font-size:12px;color:var(--text2);font-weight:600">'+fmtDate(p.date)+'</td>'
        +'<td style="text-align:center;padding:11px 14px">'
          +'<span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:'+(p.approved?'#d1fae5':'#fef3c7')+';color:'+(p.approved?'#065f46':'#92400e')+'">'+(p.approved?'✅ '+tl('Tasdiqlangan','Подтверждено','Approved'):'⏳ '+tl('Kutilmoqda','Ожидание','Pending'))+'</span>'
          +(!p.approved?'<br><button onclick="csApprove(\''+escJs(p.id)+'\')" style="margin-top:4px;padding:3px 10px;border-radius:8px;border:1px solid #6ee7b7;background:var(--teal-light);color:var(--teal-text);font-size:11px;font-weight:700;cursor:pointer">'+tl('Tasdiqlash','Подтвердить','Approve')+'</button>':'')
        +'</td></tr>';
    }).join('')+'</tbody></table></div>';
}

window.csApprove=function(id){
  var p=getPurchases(),it=p.find(function(x){return x.id===id;});
  if(it){it.approved=true;savePurchases(p);}
  toast('✅ '+tl('Tasdiqlandi!','Подтверждено!','Approved!'),'#0d9488');
  renderAdminCoinShop();
};

// ===================================================
// MAHSULOT QO'SHISH MODAL
// ===================================================
window.csOpenAddProduct=function(editId){
  var items=getShop();
  var item=editId?items.find(function(x){return x.id===editId;}):null;
  var old=document.getElementById('cs-prod-modal');if(old)old.remove();
  var ov=document.createElement('div');
  ov.id='cs-prod-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9100;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);

  var isEdit=!!item;
  var hdr=isEdit?'linear-gradient(135deg,#7c3aed,#6d28d9)':'linear-gradient(135deg,#2563eb,#1d4ed8)';

  var box=document.createElement('div');
  box.style.cssText='background:var(--bg);border-radius:22px;overflow:hidden;max-width:460px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.28);max-height:94vh;display:flex;flex-direction:column;animation:csUp .25s';
  box.innerHTML=
    '<div style="background:'+hdr+';padding:22px 24px;color:#fff;position:relative;overflow:hidden;flex-shrink:0">'
      +'<div style="position:absolute;right:-18px;top:-18px;font-size:90px;opacity:.1;pointer-events:none">'+(isEdit?'✏️':'📦')+'</div>'
      +'<div style="font-size:21px;font-weight:900;margin-bottom:3px">'+(isEdit?'✏️ '+tl("Tahrirlash","Редактировать","Edit Product"):'📦 '+tl("Yangi mahsulot","Новый товар","New Product"))+'</div>'
      +'<div style="font-size:12px;opacity:.88">'+tl("Nomi · coin narxi · soni · rasmi","Название · цена · остаток · фото","Name · price · stock · image")+'</div>'
    +'</div>'
    +'<div style="padding:22px 24px;overflow-y:auto;flex:1">'
      // Rasm preview — kliklab yuklash
      +'<div id="csp-imgprev" onclick="document.getElementById(\'csp-file\').click()" style="height:155px;border-radius:14px;overflow:hidden;background:var(--bg2);border:2px dashed var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:18px;transition:.2s" onmouseover="this.style.borderColor=\'#3b82f6\'" onmouseout="this.style.borderColor=\'#93c5fd\'">'
        +(item&&item.image?'<img src="'+esc(item.image)+'" style="width:100%;height:100%;object-fit:cover">':'<div style="text-align:center;color:var(--accent);pointer-events:none"><div style="font-size:40px;margin-bottom:8px">🖼</div><div style="font-size:13px;font-weight:700">'+tl("Rasm yuklash","Загрузить фото","Upload Image")+'</div><div style="font-size:11px;opacity:.7">'+tl("Bosib tanlang yoki URL kiring","Нажмите или введите URL","Click or enter URL")+'</div></div>')
      +'</div>'
      +'<input id="csp-file" type="file" accept="image/*" style="display:none">'
      // URL
      +'<div style="margin-bottom:14px">'
        +'<label style="font-size:12px;font-weight:700;color:var(--text);display:block;margin-bottom:5px">🔗 URL '+tl("(yoki yuqoridan yuklang)","(или загрузите выше)","(or upload above)")+'</label>'
        +'<input id="csp-url" type="text" value="'+(item&&item.image&&!item.image.startsWith('data:')?esc(item.image):'')+'" style="width:100%;padding:10px 14px;border:2px solid var(--border2);border-radius:10px;font-size:13px;outline:none;box-sizing:border-box;transition:.2s" placeholder="https://..." onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e5e7eb\'">'
      +'</div>'
      // Nomi
      +'<div style="margin-bottom:14px">'
        +'<label style="font-size:12px;font-weight:700;color:var(--text);display:block;margin-bottom:5px">📝 '+tl("Nomi *","Название *","Name *")+'</label>'
        +'<input id="csp-name" type="text" value="'+(item?esc(item.name):'')+'" style="width:100%;padding:11px 14px;border:2px solid var(--border2);border-radius:10px;font-size:15px;font-weight:600;outline:none;box-sizing:border-box;transition:.2s" placeholder="'+tl("Masalan: Uy vazifasini o\\'tkazib yuborish","Например: Пропуск д/з","E.g. Skip homework")+'" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e5e7eb\'">'
      +'</div>'
      // Narxi + Soni
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
        +'<div>'
          +'<label style="font-size:12px;font-weight:700;color:var(--text);display:block;margin-bottom:5px">🪙 '+tl("Coin narxi *","Цена *","Price *")+'</label>'
          +'<div style="position:relative"><span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none">🪙</span>'
          +'<input id="csp-price" type="number" min="1" value="'+(item?item.price:'')+'" style="width:100%;padding:11px 14px 11px 38px;border:2px solid var(--border2);border-radius:10px;font-size:20px;font-weight:900;outline:none;box-sizing:border-box;color:#92400e;transition:.2s" placeholder="500" onfocus="this.style.borderColor=\'#f59e0b\'" onblur="this.style.borderColor=\'#e5e7eb\'"></div>'
        +'</div>'
        +'<div>'
          +'<label style="font-size:12px;font-weight:700;color:var(--text);display:block;margin-bottom:5px">📦 '+tl("Qolgan soni *","Остаток *","Stock *")+'</label>'
          +'<div style="position:relative"><span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none">📦</span>'
          +'<input id="csp-stock" type="number" min="0" value="'+(item?item.stock:'')+'" style="width:100%;padding:11px 14px 11px 38px;border:2px solid var(--border2);border-radius:10px;font-size:20px;font-weight:900;outline:none;box-sizing:border-box;color:#065f46;transition:.2s" placeholder="10" onfocus="this.style.borderColor=\'#10b981\'" onblur="this.style.borderColor=\'#e5e7eb\'"></div>'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;background:var(--bg3)">'
      +'<button id="csp-cancel" style="padding:11px 22px;border-radius:11px;border:2px solid var(--border2);background:var(--bg2);color:var(--text);font-size:13px;font-weight:600;cursor:pointer">'+tl('Bekor','Отмена','Cancel')+'</button>'
      +'<button id="csp-save" style="padding:11px 28px;border-radius:11px;border:none;background:'+hdr+';color:#fff;font-size:14px;font-weight:800;cursor:pointer">💾 '+tl('Saqlash','Сохранить','Save')+'</button>'
    +'</div>';

  ov.appendChild(box);

  function setPreview(src){
    var a=document.getElementById('csp-imgprev');if(!a)return;
    a.innerHTML=src?'<img src="'+src+'" style="width:100%;height:100%;object-fit:cover">':'<div style="text-align:center;color:var(--accent);pointer-events:none"><div style="font-size:40px;margin-bottom:8px">🖼</div><div style="font-size:13px;font-weight:700">'+tl("Rasm yuklash","Загрузить фото","Upload Image")+'</div></div>';
  }
  document.getElementById('csp-url').oninput=function(){setPreview(this.value.trim()||null);};
  document.getElementById('csp-file').onchange=function(){
    var f=this.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(e){setPreview(e.target.result);};r.readAsDataURL(f);
  };
  document.getElementById('csp-cancel').onclick=function(){ov.remove();};
  document.getElementById('csp-save').onclick=function(){csSaveProduct(editId||null);};
  setTimeout(function(){var n=document.getElementById('csp-name');if(n)n.focus();},100);
};

window.csSaveProduct=function(editId){
  var name=(document.getElementById('csp-name').value||'').trim();
  var price=parseInt(document.getElementById('csp-price').value)||0;
  var stock=parseInt(document.getElementById('csp-stock').value);
  var url=(document.getElementById('csp-url').value||'').trim();
  var fi=document.getElementById('csp-file');
  if(!name){alert(tl("Nomini kiriting!","Введите название!","Enter name!"));return;}
  if(price<=0){alert(tl("Coin narxini kiriting!","Введите цену!","Enter price!"));return;}
  if(isNaN(stock)||stock<0){alert(tl("Sonini kiriting!","Введите остаток!","Enter stock!"));return;}
  function done(img){
    var items=getShop();
    if(editId){
      var idx=items.findIndex(function(x){return x.id===editId;});
      if(idx>=0)items[idx]=Object.assign({},items[idx],{name:name,price:price,stock:stock,image:img!==undefined?img:items[idx].image});
    }else{items.push({id:'p_'+Date.now(),name:name,price:price,stock:stock,image:img||null});}
    saveShop(items);
    var m=document.getElementById('cs-prod-modal');if(m)m.remove();
    toast('✅ '+(editId?tl('Yangilandi','Обновлено','Updated'):tl("Qo'shildi","Добавлено","Added"))+': '+name,'#0d9488');
    renderAdminCoinShop();
  }
  if(fi&&fi.files[0]){var r=new FileReader();r.onload=function(e){done(e.target.result);};r.readAsDataURL(fi.files[0]);}
  else done(url||null);
};

window.csDeleteProduct=function(id){
  if(!confirm(tl("O'chirasizmi?","Удалить?","Delete?")))return;
  saveShop(getShop().filter(function(x){return x.id!==id;}));
  toast('🗑 '+tl("O'chirildi","Удалено","Deleted"),'#f59e0b');
  renderAdminCoinShop();
};

// ===================================================
// MENTORGA COIN YUBORISH MODAL
// Barcha mentorlar + ularning barcha guruhlari
// ===================================================
window.csOpenSendCoin=function(pre){
  var mentors=(window.D&&window.D.mentors)||[];
  if(!mentors.length){alert(tl("Mentorlar yo'q!","Менторов нет!","No mentors!"));return;}
  var old=document.getElementById('cs-send-modal');if(old)old.remove();
  var ov=document.createElement('div');
  ov.id='cs-send-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9100;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);

  // HAMMA mentorlar — nechta bo'lsa ham barchasi
  var rows=mentors.map(function(m){
    var grps=((window.D&&window.D.groups)||[]).filter(function(g){return g.mentor===m.name;});
    var stus=((window.D&&window.D.students)||[]).filter(function(s){return grps.some(function(g){return g.id===s.groupId;});});
    var safe='msrow_'+m.name.replace(/[^a-zA-Z0-9]/g,'_');
    var sel=pre&&pre===m.name;
    return'<div id="'+safe+'" onclick="csSelMentor(\''+escJs(m.name)+'\')"'
      +' class="cs-mrow'+(sel?' selected':'')+'">'
      +'<div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0">'+(m.name[0]||'M')+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:14px;font-weight:800;margin-bottom:3px">'+esc(m.name)+'</div>'
        +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
          +'<span style="font-size:11px;color:var(--text2)">📚 '+grps.length+' '+tl('guruh','групп','groups')+'</span>'
          +'<span style="font-size:11px;color:var(--text2)">👥 '+stus.length+' '+tl('talaba','студ.','students')+'</span>'
        +'</div>'
      +'</div>'
      +'<span id="chk_'+safe+'" style="font-size:20px;'+(sel?'':'display:none')+'">✅</span>'
    +'</div>';
  }).join('');

  var box=document.createElement('div');
  box.style.cssText='background:var(--bg);border-radius:22px;overflow:hidden;max-width:500px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.28);max-height:94vh;display:flex;flex-direction:column;animation:csUp .25s';
  box.innerHTML=
    '<div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:22px 24px;color:#fff;position:relative;overflow:hidden;flex-shrink:0">'
      +'<div style="position:absolute;right:-18px;top:-18px;font-size:90px;opacity:.1;pointer-events:none">🪙</div>'
      +'<div style="font-size:21px;font-weight:900;margin-bottom:3px">🎁 '+tl("Mentorga coin yuborish","Монеты ментору","Send Coins to Mentor")+'</div>'
      +'<div style="font-size:12px;opacity:.88">'+tl("Mentor tanlanadi → uning barcha guruhlari teng coin oladi","Выберите ментора → все его группы получат монеты","Select mentor → all groups receive coins equally")+'</div>'
    +'</div>'
    +'<div style="padding:20px 24px;overflow-y:auto;flex:1">'
      +'<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">'+tl("Mentorni tanlang","Выберите ментора","Select Mentor")+'</div>'
      // BARCHA mentorlar scroll bilan
      +'<div style="max-height:310px;overflow-y:auto;padding-right:3px;margin-bottom:16px">'+rows+'</div>'
      +'<div id="cs-send-info" style="display:none;margin-bottom:14px;padding:12px 16px;background:var(--teal-light);border:1.5px solid var(--teal);border-radius:12px;font-size:12px;color:var(--teal-text);line-height:1.6"></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
        +'<div><label style="font-size:12px;font-weight:700;color:var(--text);display:block;margin-bottom:5px">🪙 '+tl("Coin miqdori *","Количество *","Amount *")+'</label>'
        +'<div style="position:relative"><span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:16px;pointer-events:none">🪙</span>'
        +'<input id="cs-send-amt" type="number" min="1" class="cs-modal-input" style="padding:11px 14px 11px 38px;font-size:20px;font-weight:900;" placeholder="500" oninput="csUpdateInfo()"></div></div>'
        +'<div><label style="font-size:12px;font-weight:700;color:var(--text);display:block;margin-bottom:5px">💬 '+tl("Sabab","Причина","Reason")+'</label>'
        +'<input id="cs-send-rsn" type="text" class="cs-modal-input" style="padding:11px 14px;font-size:13px;" placeholder="'+tl("Oylik mukofot","Ежемес. награда","Monthly reward")+'"></div>'
      +'</div>'
    +'</div>'
    +'<div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;background:var(--bg3)">'
      +'<button onclick="document.getElementById(\'cs-send-modal\').remove()" style="padding:11px 22px;border-radius:11px;border:2px solid var(--border2);background:var(--bg2);color:var(--text);font-size:13px;font-weight:600;cursor:pointer">'+tl('Bekor','Отмена','Cancel')+'</button>'
      +'<button onclick="csSendCoins()" style="padding:11px 28px;border-radius:11px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:14px;font-weight:800;cursor:pointer">🪙 '+tl('Yuborish','Отправить','Send')+'</button>'
    +'</div>';

  ov.appendChild(box);
  window._csSel=pre||null;
  if(pre)csUpdateInfo();
};

window.csSelMentor=function(name){
  window._csSel=name;
  document.querySelectorAll('[id^="msrow_"]').forEach(function(el){el.classList.remove('selected');});
  var safe='msrow_'+name.replace(/[^a-zA-Z0-9]/g,'_');
  var row=document.getElementById(safe);
  if(row)row.classList.add('selected');
  var chks=document.querySelectorAll('[id^="chk_msrow_"]');
  chks.forEach(function(el){el.style.display='none';});
  var chk=document.getElementById('chk_'+safe);
  if(chk)chk.style.display='inline';
  csUpdateInfo();
};

window.csUpdateInfo=function(){
  var name=window._csSel;
  var amt=parseInt((document.getElementById('cs-send-amt')||{}).value)||0;
  var info=document.getElementById('cs-send-info');
  if(!info)return;
  if(!name){info.style.display='none';return;}
  var grps=((window.D&&window.D.groups)||[]).filter(function(g){return g.mentor===name;});
  var stus=((window.D&&window.D.students)||[]).filter(function(s){return grps.some(function(g){return g.id===s.groupId;});});
  var grpCount=Math.max(1,grps.length);
  var total=amt*grpCount;
  info.style.display='block';
  info.innerHTML='✅ <b>'+esc(name)+'</b><br>'
    +'🪙 <b>'+amt+'</b> × <b>'+grpCount+'</b> '+tl('guruh','групп','groups')+' = <b>🪙 '+total+'</b><br>'
    +'📚 <b>'+grps.length+'</b> '+tl('guruh','групп','groups')+' &nbsp;·&nbsp; 👥 <b>'+stus.length+'</b> '+tl('talaba','студентов','students');
};

window.csSendCoins=function(){
  var name=window._csSel;
  var amt=parseInt((document.getElementById('cs-send-amt')||{}).value)||0;
  var rsn=((document.getElementById('cs-send-rsn')||{}).value||tl('Admin yubordi','Отправил админ','Admin sent')).trim();
  if(!name){alert(tl('Mentor tanlang!','Выберите ментора!','Select a mentor!'));return;}
  if(amt<=0){alert(tl('Coin miqdori kiriting!','Введите количество!','Enter amount!'));return;}

  var grps=((window.D&&window.D.groups)||[]).filter(function(g){return g.mentor===name;});
  var stus=((window.D&&window.D.students)||[]).filter(function(s){return grps.some(function(g){return g.id===s.groupId;});});
  var grpCount=Math.max(1,grps.length);
  var total=amt*grpCount;

  // Admin → har guruh uchun ALOHIDA balance (mg_MentorName_GroupId)
  if(grps.length>0){
    grps.forEach(function(g){
      var cur=getMentorGroupBal(name,g.id);
      setMentorGroupBal(name,g.id,cur+amt);
    });
  } else {
    // Guruhi yo'q fallback
    var curBal=getMentorBal(name);
    setMentorBal(name,curBal+total);
  }

  // Purchases tarixiga qo'shish
  var purchases=getPurchases();
  purchases.push({id:Date.now(),type:'admin-send',mentorName:name,amount:total,perGroup:amt,groupCount:grpCount,reason:rsn,studentCount:stus.length,date:new Date().toISOString()});
  savePurchases(purchases);

  document.getElementById('cs-send-modal').remove();
  window._csSel=null;
  toast('🎁 '+esc(name)+' — 🪙'+amt+'×'+grpCount+' = 🪙'+total+' '+tl("qo'shildi!",'добавлено!','added!'),'#0d9488');
  updateMentorCoinTopbar();
  renderAdminCoinShop();
};

// ===================================================
// TALABA COIN SHOP
// Tepasiada coin balansi + admin qoshgan mahsulotlar
// ===================================================
window.renderStudentCoinShop=function(){
  var wrap=document.getElementById('panel-student-coin-shop');if(!wrap)return;
  injectStyles();
  var cu=(window.getCurrentUser?window.getCurrentUser():{});
  var stuId=cu.studentId?parseInt(cu.studentId):null;
  var stu=(window.D&&window.D.students||[]).find(function(s){return s.id===stuId;});
  var bal=getStudentBal(stuId);
  var items=getShop();
  var myBuys=getPurchases().filter(function(p){return p.studentId===stuId;});

  wrap.innerHTML=
    '<div style="padding:0 0 40px">'

    // ── Hero coin kartochkasi ──────────────────────
    +'<div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#b45309 100%);border-radius:22px;padding:28px 28px 22px;color:#fff;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(245,158,11,.4)">'
      +'<div style="position:absolute;right:-30px;top:-30px;font-size:140px;opacity:.1;pointer-events:none">🪙</div>'
      +'<div style="position:absolute;left:-10px;bottom:-20px;font-size:100px;opacity:.07;pointer-events:none">✨</div>'
      +'<div style="font-size:11px;font-weight:800;opacity:.8;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px">💰 '+tl("Mening balansi","Мой баланс","My Balance")+'</div>'
      +'<div style="font-size:58px;font-weight:900;letter-spacing:-2px;line-height:1;margin-bottom:12px;text-shadow:0 2px 12px rgba(0,0,0,.2)">🪙 '+bal+'</div>'
      +'<div style="display:flex;align-items:center;gap:10px">'
        +'<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900">'+(stu?(stu.name||'T')[0].toUpperCase():'T')+'</div>'
        +'<div>'
          +'<div style="font-size:14px;font-weight:800">'+(stu?esc(stu.name):'')+'</div>'
          +'<div style="font-size:11px;opacity:.75">'+tl("Talaba","Студент","Student")+'</div>'
        +'</div>'
      +'</div>'
    +'</div>'

    // ── Stats row ─────────────────────────────────
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">'
      +'<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:1.5px solid #fbbf24;border-radius:16px;padding:14px 16px;text-align:center">'
        +'<div style="font-size:28px;font-weight:900;color:#92400e">🛍️ '+items.length+'</div>'
        +'<div style="font-size:11px;font-weight:700;color:#a16207">'+tl("Do'kondagi mahsulotlar","Товаров в магазине","Products in shop")+'</div>'
      +'</div>'
      +'<div style="background:linear-gradient(135deg,#d1fae5,#a7f3d0);border:1.5px solid #6ee7b7;border-radius:16px;padding:14px 16px;text-align:center">'
        +'<div style="font-size:28px;font-weight:900;color:#065f46">🧾 '+myBuys.length+'</div>'
        +'<div style="font-size:11px;font-weight:700;color:#047857">'+tl("Xaridlarim","Мои покупки","My purchases")+'</div>'
      +'</div>'
    +'</div>'

    // ── Tabs ─────────────────────────────────────
    +'<div style="display:flex;gap:8px;margin-bottom:22px">'
      +'<button id="cstab-st" onclick="csStudentTab(\'shop\')" class="cs-tab cs-tab-act" style="flex:1;padding:11px;font-size:14px">🛍️ '+tl("Do'kon","Магазин","Shop")+' ('+items.length+')</button>'
      +'<button id="cstab-sb" onclick="csStudentTab(\'buys\')" class="cs-tab" style="flex:1;padding:11px;font-size:14px">🧾 '+tl("Xaridlarim","Покупки","My Buys")+' ('+myBuys.length+')</button>'
    +'</div>'

    +'<div id="stu-shop-panel">'+renderStudentShopGrid(items,bal,stuId)+'</div>'
    +'<div id="stu-buys-panel" style="display:none">'+renderStudentPurchases(myBuys)+'</div>'
    +'</div>';
};

window.csStudentTab=function(t){
  var sp=document.getElementById('stu-shop-panel');
  var bp=document.getElementById('stu-buys-panel');
  var st=document.getElementById('cstab-st');
  var sb=document.getElementById('cstab-sb');
  if(sp)sp.style.display=t==='shop'?'block':'none';
  if(bp)bp.style.display=t==='buys'?'block':'none';
  if(st)st.className=t==='shop'?'cs-tab cs-tab-act':'cs-tab';
  if(sb)sb.className=t==='buys'?'cs-tab cs-tab-act':'cs-tab';
};

function renderStudentShopGrid(items,bal,stuId){
  if(!items.length)return(
    '<div style="text-align:center;padding:80px 20px;color:var(--text3)">'
    +'<div style="font-size:72px;margin-bottom:16px;filter:grayscale(.3)">🛒</div>'
    +'<div style="font-size:18px;font-weight:800;margin-bottom:8px">'+tl("Do\'konda mahsulot yo\'q","Магазин пуст","Shop is empty")+'</div>'
    +'<div style="font-size:13px;opacity:.7">'+tl("Admin hali mahsulot qo\'shmagan","Администратор ещё не добавил товары","Admin has not added products yet")+'</div>'
    +'</div>'
  );
  return'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px">'
    +items.map(function(item){
      var st=item.stock||0,so=st<=0,canBuy=bal>=item.price&&!so;
      var cardBorder=canBuy?'rgba(16,185,129,0.4)':so?'rgba(239,68,68,0.3)':'var(--border)';
      var cardGlow=canBuy?'0 4px 20px rgba(16,185,129,.2)':'0 2px 12px rgba(0,0,0,.07)';
      return'<div style="background:var(--bg);border-radius:20px;overflow:hidden;border:2px solid '+cardBorder+';box-shadow:'+cardGlow+';transition:.25s;position:relative" '
        +(canBuy?'onmouseover="this.style.transform=\'translateY(-6px)\';this.style.boxShadow=\'0 16px 40px rgba(0,0,0,.16)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\''+cardGlow+'\';"':'')+'>'
        // Az qoldi badge
        +(!so&&st<=3&&st>0?'<div style="position:absolute;top:10px;right:10px;z-index:2;background:#f59e0b;color:#fff;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.2)">⚡ '+st+' '+tl('qoldi','осталось','left')+'</div>':'')
        // Rasm — KATTA (180px)
        +'<div style="position:relative;height:180px;overflow:hidden;background:linear-gradient(135deg,#fef3c7,#fde68a)">'
          +(item.image?'<img src="'+esc(item.image)+'" style="width:100%;height:100%;object-fit:cover;transition:.4s" '+(canBuy?'onmouseover="this.style.transform=\'scale(1.08)\'" onmouseout="this.style.transform=\'\'"':'')+'>'
            :'<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:64px">🎁</div>')
          +(so?'<div style="position:absolute;inset:0;background:rgba(0,0,0,.58);display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:14px;font-weight:800;border:2px solid rgba(255,255,255,.7);padding:5px 16px;border-radius:20px;letter-spacing:.05em">'+tl('TUGAGAN','НЕТУ','SOLD OUT')+'</span></div>':'')
          +(canBuy?'<div style="position:absolute;bottom:8px;left:8px;background:rgba(16,185,129,.88);backdrop-filter:blur(4px);color:#fff;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px">✅ '+tl("Sotib olish mumkin","Можно купить","Available")+'</div>':'')
        +'</div>'
        // Karta ma\'lumotlari
        +'<div style="padding:16px 16px 14px">'
          +'<div style="font-size:15px;font-weight:800;margin-bottom:10px;line-height:1.35;color:var(--text)">'+esc(item.name)+'</div>'
          +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
            +coinPill(item.price,true)
            +(bal<item.price&&!so?'<span style="font-size:11px;font-weight:700;color:#ef4444;background:#fef2f2;padding:3px 9px;border-radius:12px;border:1px solid #fecaca">−'+(item.price-bal)+'🪙</span>':'')
          +'</div>'
          +(so
            ?'<button disabled style="width:100%;padding:10px;border-radius:12px;border:none;background:var(--bg3);color:var(--text3);font-size:12px;font-weight:700">'+tl('Tugagan','Нет в наличии','Sold Out')+'</button>'
            :canBuy
              ?'<button onclick="csBuyItem(\''+escJs(item.id)+'\')" style="width:100%;padding:11px;border-radius:12px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,.38);transition:.2s" onmouseover="this.style.filter=\'brightness(1.1)\'" onmouseout="this.style.filter=\'\'">🛒 '+tl("Sotib olish","Купить","Buy Now")+'</button>'
              :'<button disabled style="width:100%;padding:10px;border-radius:12px;border:none;background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e;font-size:12px;font-weight:700">💔 '+tl("Coin yetmaydi","Монет не хватает","Not enough")+'</button>')
        +'</div>'
      +'</div>';
    }).join('')+'</div>';
}

function renderStudentPurchases(buys){
  if(!buys.length)return'<div style="text-align:center;padding:50px;color:var(--text3)"><div style="font-size:44px;margin-bottom:12px">🛍️</div><div style="font-size:14px">'+tl("Hali hech narsa sotib olmadingiz","Вы ещё ничего не купили","You haven't bought anything yet")+'</div></div>';
  var sorted=buys.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  return'<div style="display:flex;flex-direction:column;gap:10px">'
    +sorted.map(function(p){
      return'<div style="background:var(--bg);border:1.5px solid var(--border2);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
        +(p.itemImage?'<img src="'+esc(p.itemImage)+'" style="width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0">':'<div style="width:48px;height:48px;border-radius:10px;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🎁</div>')
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:14px;font-weight:700;margin-bottom:4px">'+esc(p.itemName||'—')+'</div>'
          +'<div style="font-size:11px;color:var(--text3)">'+fmtDate(p.date)+'</div>'
        +'</div>'
        +coinPill(p.coinPrice||0)
        +'<span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+(p.approved?'#d1fae5':'#fef3c7')+';color:'+(p.approved?'#065f46':'#92400e')+';flex-shrink:0">'+(p.approved?'✅':  '⏳')+'</span>'
      +'</div>';
    }).join('')+'</div>';
}

// ── Sotib olish modali ──────────────────────────
window.csBuyItem=function(itemId){
  var item=getShop().find(function(x){return x.id===itemId;});
  if(!item){alert(tl("Mahsulot topilmadi!","Товар не найден!","Product not found!"));return;}
  var cu=(window.getCurrentUser?window.getCurrentUser():{});
  var stuId=cu.studentId?parseInt(cu.studentId):null;
  var bal=getStudentBal(stuId);
  if(bal<item.price){alert(tl("Coin yetarli emas!","Недостаточно монет!","Not enough coins!"));return;}
  if((item.stock||0)<=0){alert(tl("Mahsulot tugagan!","Товар закончился!","Out of stock!"));return;}

  var old=document.getElementById('cs-buy-modal');if(old)old.remove();
  var ov=document.createElement('div');
  ov.id='cs-buy-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);

  var box=document.createElement('div');
  box.style.cssText='background:var(--bg);border-radius:22px;overflow:hidden;max-width:340px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.3);text-align:center;animation:csUp .25s';
  box.innerHTML=
    '<div style="background:linear-gradient(135deg,#10b981,#0d9488);padding:22px 20px;color:#fff;position:relative;overflow:hidden">'
      +'<div style="position:absolute;right:-10px;top:-10px;font-size:80px;opacity:.1;pointer-events:none">🛒</div>'
      +(item.image?'<img src="'+esc(item.image)+'" style="width:80px;height:80px;border-radius:14px;object-fit:cover;margin-bottom:12px;box-shadow:0 4px 16px rgba(0,0,0,.25)">':'<div style="font-size:60px;margin-bottom:12px">🎁</div>')
      +'<div style="font-size:17px;font-weight:800;margin-bottom:8px">'+esc(item.name)+'</div>'
      +coinPill(item.price,true)
    +'</div>'
    +'<div style="padding:22px 20px">'
      +'<div style="font-size:13px;color:var(--text2);margin-bottom:16px;line-height:1.6">'+tl("Sotib olishni tasdiqlaysizmi?","Подтвердить покупку?","Confirm purchase?")+'<br>'
        +'<span style="color:#059669;font-weight:700">'+tl("Sizda qoladi","У вас останется","You will have")+': 🪙 '+(bal-item.price)+'</span></div>'
      +'<div style="display:flex;gap:8px">'
        +'<button onclick="document.getElementById(\'cs-buy-modal\').remove()" style="flex:1;padding:12px;border-radius:12px;border:2px solid var(--border2);background:var(--bg2);color:var(--text);font-size:13px;font-weight:600;cursor:pointer">'+tl('Bekor','Отмена','Cancel')+'</button>'
        +'<button onclick="csConfirmBuy(\''+escJs(itemId)+'\')" style="flex:1;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#10b981,#0d9488);color:#fff;font-size:14px;font-weight:800;cursor:pointer">🛒 '+tl('Sotib olish','Купить','Buy')+'</button>'
      +'</div>'
    +'</div>';
  ov.appendChild(box);
};

window.csConfirmBuy=function(itemId){
  var cu=(window.getCurrentUser?window.getCurrentUser():{});
  var stuId=cu.studentId?parseInt(cu.studentId):null;
  var items=getShop();
  var item=items.find(function(x){return x.id===itemId;});
  if(!item){alert(tl("Mahsulot topilmadi!","Не найдено!","Not found!"));return;}
  var bal=getStudentBal(stuId);
  if(bal<item.price||item.stock<=0){alert(tl("Xarid amalga oshmadi!","Покупка не удалась!","Purchase failed!"));return;}

  setStudentBal(stuId,bal-item.price);
  item.stock=Math.max(0,item.stock-1);
  saveShop(items);

  var stu=(window.D&&window.D.students||[]).find(function(s){return s.id===stuId;});
  var purchases=getPurchases();
  purchases.push({
    id:'buy_'+Date.now(),studentId:stuId,studentName:stu?stu.name:'—',
    itemId:item.id,itemName:item.name,itemImage:item.image||null,
    coinPrice:item.price,date:new Date().toISOString(),approved:false
  });
  savePurchases(purchases);

  var m=document.getElementById('cs-buy-modal');if(m)m.remove();
  toast('🎉 "'+item.name+'" '+tl('sotib olindi! −'+item.price+' coin','куплено! −'+item.price+' монет','purchased! −'+item.price+' coins'),'#0d9488');
  updateMentorCoinTopbar();
  renderStudentCoinShop();
};

// ===================================================
// INIT — rolga qarab ko'rsatish
// ===================================================
function updateMentorCoinTopbar(){
  var cu=window.getCurrentUser?window.getCurrentUser():{};
  var mBar=document.getElementById('mentor-coin-topbar');
  var sBar=document.getElementById('student-coin-topbar');
  var amtEl=document.getElementById('mentor-coin-amount');
  var sAmtEl=document.getElementById('student-coin-amount');
  var mLbl=document.getElementById('mentor-coin-label');
  var sLbl=document.getElementById('student-coin-label');

  // Hide both first
  if(mBar)mBar.style.display='none';
  if(sBar)sBar.style.display='none';

  if(cu.role==='Mentor'){
    // Mentor coin topbar navbar dan olib tashlandi — hech narsa ko'rsatmaymiz
    if(mBar)mBar.style.display='none';
  } else if(cu.role==='Talaba'){
    var stuId=cu.studentId?parseInt(cu.studentId):null;
    var sBal=getStudentBal(stuId);
    if(sAmtEl)sAmtEl.textContent=sBal;
    if(sLbl)sLbl.textContent=tl('Talaba','Студент','Student');
    if(sBar)sBar.style.display='flex';
  }
  // Admin uchun hech qaysi topbar ko'rinmaydi
}
window.updateMentorCoinTopbar=updateMentorCoinTopbar;

function init(){
  var cu=window.getCurrentUser?window.getCurrentUser():{};
  var navAdmin=document.getElementById('nav-coin-shop');
  var navStu=document.getElementById('nav-student-coin-shop');

  if(cu.role==='Talaba'){
    // Faqat talaba coin shop ko'rinadi
    if(navAdmin)navAdmin.style.display='none';
    if(navStu)navStu.style.display='flex';
  } else if(cu.role==='Mentor'){
    if(navAdmin)navAdmin.style.display='none';
    if(navStu)navStu.style.display='none';
  } else {
    // Admin
    if(navAdmin)navAdmin.style.display='flex';
    if(navStu)navStu.style.display='none';
  }

  // Backend dan yuklash, keyin render
  loadFromBackend(function(){
    updateMentorCoinTopbar();
    if(window.currentTab==='coin-shop')renderAdminCoinShop();
    if(window.currentTab==='student-coin-shop')renderStudentCoinShop();
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){setTimeout(init,900);});
}else{setTimeout(init,900);}

// Login/logout da qayta ishlash
var _origShowApp=window.showApp;
if(typeof _origShowApp==='function'){
  window.showApp=function(){
    _origShowApp.apply(this,arguments);
    setTimeout(init,400);
  };
}


// ===================================================
// COIN BERISH — DAVOMAT JADVALIDAN
// ===================================================
window.csGiveCoin = function(studentId, mentorName) {
  var inp = document.getElementById('sc-inp-' + studentId);
  var amt = parseInt(inp ? inp.value : 0) || 0;
  if (amt <= 0) {
    toast(tl("Miqdor kiriting!", "Введите количество!", "Enter amount!"), '#ef4444');
    return;
  }
  var stu2 = (window.D && window.D.students || []).find(function(s){ return s.id === studentId; });
  var groupId = stu2 ? stu2.groupId : null;
  // DOIM backend dan yangi balansni olamiz
  loadFromBackend(function() {
    var freshBal = groupId ? getMentorGroupBal(mentorName, groupId) : getMentorBal(mentorName);
    if (freshBal <= 0) {
      toast(tl("❌ Guruh balansida coin yo'q! Admin coin bermagan.", "❌ Монет нет! Попросите у администратора.", "❌ No coins! Ask admin."), '#ef4444');
      return;
    }
    _doGiveCoin2(studentId, mentorName, groupId, amt, freshBal, inp);
  });
};

function _doGiveCoin2(studentId, mentorName, groupId, amt, mBal, inp) {
  if (amt > mBal) {
    toast(tl("Coin yetarli emas! Sizda: 🪙" + mBal, "Монет не хватает! У вас: 🪙" + mBal, "Not enough! You have: 🪙" + mBal), '#ef4444');
    return;
  }
  var stuBal = getStudentBal(studentId);
  if (groupId) { setMentorGroupBal(mentorName, groupId, mBal - amt); }
  else { setMentorBal(mentorName, mBal - amt); }
  setStudentBal(studentId, stuBal + amt);
  if (inp) inp.value = '';

  var balEl = document.getElementById('sc-bal-' + studentId);
  if (balEl) balEl.textContent = '🪙 ' + getStudentBal(studentId);

  var hdrGB = (groupId ? getMentorGroupBal(mentorName, groupId) : getMentorBal(mentorName));
  document.querySelectorAll('[id^="sc-bal-mentor"]').forEach(function(el) {
    el.textContent = 'Guruh: ' + hdrGB;
  });
  var hdrBal0 = document.getElementById('att-mentor-bal-hdr');
  if(hdrBal0) hdrBal0.textContent = hdrGB;

  // Detail panel ham yangilaymiz
  var dMBal = document.getElementById('detail-mentor-bal-' + studentId);
  if(dMBal) dMBal.textContent = '🪙 ' + hdrGB;
  var dSBal = document.getElementById('detail-stu-bal-' + studentId);
  if(dSBal) dSBal.textContent = '🪙 ' + getStudentBal(studentId);

  var stu = (window.D && window.D.students || []).find(function(s) { return s.id === studentId; });
  toast('✅ ' + (stu ? stu.name : tl('Talaba', 'Студент', 'Student')) + ' ga 🪙' + amt + ' · ' + tl("Guruhda qoldi", "В группе осталось", "Group balance") + ': 🪙' + hdrGB, '#0d9488');
  updateMentorCoinTopbar();
}


// ===================================================
// COIN BERISH — DAVOMAT KATAGI TOOLTIP ICHIDAN
// ===================================================
window.csGiveCoinFromCell = function(studentId, mentorName, inputSuffix) {
  var inp = document.getElementById('sc-inp-' + inputSuffix);
  var amt = parseInt(inp ? inp.value : 0) || 0;
  if (amt <= 0) {
    toast(tl('Miqdor kiriting!', 'Введите количество!', 'Enter amount!'), '#ef4444');
    return;
  }
  var stu3 = (window.D && window.D.students || []).find(function(s){ return s.id === studentId; });
  var groupId2 = stu3 ? stu3.groupId : null;
  // DOIM backend dan yangi balansni olamiz
  loadFromBackend(function() {
    var freshBal = groupId2 ? getMentorGroupBal(mentorName, groupId2) : getMentorBal(mentorName);
    if (freshBal <= 0) {
      toast(tl('❌ Guruh balansida coin yo\'q! Admin coin bermagan.', '❌ Монет нет! Попросите у администратора.', '❌ No coins! Ask admin.'), '#ef4444');
      document.querySelectorAll('[id^="sc-bal-mentor"]').forEach(function(el){ el.textContent = 'Guruh: 0'; });
      var hdr = document.getElementById('att-mentor-bal-hdr');
      if(hdr) hdr.textContent = '0';
      return;
    }
    if (amt > freshBal) {
      toast(tl('Coin yetarli emas! Sizda: 🪙' + freshBal, 'Монет не хватает! У вас: 🪙' + freshBal, 'Not enough! You have: 🪙' + freshBal), '#ef4444');
      return;
    }
    _doCellGive(studentId, mentorName, groupId2, amt, freshBal, inp);
  });
};

function _doCellGive(studentId, mentorName, groupId2, amt, mBal, inp) {
  if (amt > mBal) {
    toast(tl('Coin yetarli emas! Sizda: 🪙' + mBal, 'Монет не хватает! У вас: 🪙' + mBal, 'Not enough! You have: 🪙' + mBal), '#ef4444');
    return;
  }
  var stuBal = getStudentBal(studentId);
  if (groupId2) { setMentorGroupBal(mentorName, groupId2, mBal - amt); }
  else { setMentorBal(mentorName, mBal - amt); }
  setStudentBal(studentId, stuBal + amt);
  if (inp) inp.value = '';

  var newSBal = getStudentBal(studentId);
  var newGBal = groupId2 ? getMentorGroupBal(mentorName, groupId2) : getMentorBal(mentorName);

  // Talaba coin balansini yangilaymiz (jadval katagidagi)
  var sBal = document.getElementById('sc-bal-' + studentId);
  if (sBal) sBal.textContent = newSBal;

  // Mentor (guruh) balansini yangilaymiz
  document.querySelectorAll('[id^="sc-mbal-"]').forEach(function(el) {
    el.textContent = newGBal;
  });

  // Tooltip ichidagi inputlarni tozalaymiz
  document.querySelectorAll('[id^="sc-inp-' + studentId + '-"]').forEach(function(el) {
    el.value = '';
  });

  // Ustun sarlavhasidagi guruh balansini yangilaymiz
  document.querySelectorAll('[id^="sc-bal-mentor"]').forEach(function(el) {
    el.textContent = 'Guruh: ' + newGBal;
  });
  var hdrBal = document.getElementById('att-mentor-bal-hdr');
  if(hdrBal) hdrBal.textContent = newGBal;

  // Detail panel ichidagi balansni ham yangilaymiz (agar ochiq bo'lsa)
  var detailMBal = document.getElementById('detail-mentor-bal-' + studentId);
  if(detailMBal) detailMBal.textContent = '🪙 ' + newGBal;
  var detailSBal = document.getElementById('detail-stu-bal-' + studentId);
  if(detailSBal) detailSBal.textContent = '🪙 ' + newSBal;

  var stu = (window.D && window.D.students || []).find(function(s) { return s.id === studentId; });
  toast('✅ ' + (stu ? stu.name : tl('Talaba', 'Студент', 'Student')) + ' ga 🪙' + amt + ' · ' + tl('Guruhda qoldi', 'В группе осталось', 'Group balance') + ': 🪙' + newGBal, '#0d9488');
  updateMentorCoinTopbar();
}

window.coinShop={getShop:getShop,getCoins:getCoins,getMentorBal:getMentorBal,getMentorGroupBal:getMentorGroupBal,setMentorGroupBal:setMentorGroupBal,getStudentBal:getStudentBal,setStudentBal:setStudentBal};
})();
