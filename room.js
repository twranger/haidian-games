/* 海佃課堂・全班連線遊戲共用框架（需要先載入 live.js）
   老師端：網址加 #host；學生端：不加。網址有 ?k= 時免房號。
   用法：
   ROOM.start({
     key:'pond', title:'大家的魚塭', kick:'第 4 課・全班連線', studentUrl:'pondshare.html', minPlayers:1,
     init:function(H){...遊戲狀態放在 H.g...},          // 開新房間、同一班重玩時呼叫
     pub:function(H){return {...給學生看的狀態...}},      // 預設會帶 ph、seats
     onMsg:function(H,d,seat){...學生送來的訊息...; return true 表示要存檔重畫},
     tick:function(H){...每 250 毫秒；回傳 true 表示要存檔重畫},
     hostView:function(H){return html},                    // 大廳以外的畫面
     startLabel:'開始', onStart:function(H){...},
     bar:function(H){return html 或 ''},                   // 固定在下方的老師控制列（按鈕用 data-act）
     act:{名稱:function(H,arg){...}},                      // 老師按鈕：data-act="名稱" data-arg="..."
     studentView:function(ST,me,api){return html},         // api.send(obj)、api.local（學生自己的暫存）
     sact:{名稱:function(ST,me,api,arg){...}}              // 學生按鈕
   }) */
(function(){
var R=window.ROOM={},L=window.LIVE,esc=L.esc,ls=L.ls,K=L.key;
var CSS=':root{--bg:#FAF7F2;--ink:#1E242B;--co:#D95D39;--te:#2A6F68;--mu:#475569;--ln:#E3DED7;--or:#F2A65A;--col:#FFF5F2;--tel:#F0F7F6}'+
'*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;font-size:19px;line-height:1.55}p{margin:0}'+
'.wrap{max-width:820px;margin:0 auto;padding:18px 16px 110px;display:flex;flex-direction:column;gap:14px}.host{max-width:none;padding:18px 28px 120px}'+
'h1{font-size:clamp(28px,5vw,44px);font-weight:900;margin:0;line-height:1.25}h2{font-size:clamp(22px,3.4vw,30px);font-weight:900;margin:0;line-height:1.4}'+
'.kick{font-size:18px;font-weight:700;color:var(--co);letter-spacing:2px}.lead{font-size:clamp(19px,2.6vw,23px);color:var(--mu)}'+
'.card{background:#fff;border:2px solid var(--ln);border-radius:20px;box-shadow:0 4px 24px rgba(30,36,43,.06);padding:clamp(14px,3vw,22px);display:flex;flex-direction:column;gap:10px}'+
'.card.dark{background:#1E242B;border:0;color:#FAF7F2}.card.warm{background:var(--col);border-color:#F3D9CF}.card.cool{background:var(--tel);border-color:#CFE3E0}'+
'.btn{font:inherit;font-size:clamp(20px,2.8vw,26px);font-weight:900;border:0;border-radius:16px;padding:14px 18px;background:var(--co);color:#fff;cursor:pointer;line-height:1.4;touch-action:manipulation}'+
'.btn.te{background:var(--te)}.btn.gh{background:#fff;color:var(--ink);border:3px solid var(--ln)}.btn.sm{font-size:16px;padding:6px 12px}.btn.on{outline:5px solid var(--or)}.btn[disabled]{opacity:.35;cursor:default}'+
'.net{font-size:15px;color:var(--mu)}.net b{color:var(--te)}.net.off b{color:var(--co)}'+
'input.code{font:inherit;font-size:44px;font-weight:900;letter-spacing:12px;text-align:center;width:100%;border:3px solid var(--ln);border-radius:16px;padding:8px}'+
'.seats{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}.seat{font:inherit;font-size:24px;font-weight:900;border:3px solid var(--ln);background:#fff;border-radius:14px;padding:10px 0;cursor:pointer}.seat.taken{background:#EEE;color:#AAA;cursor:default}'+
'.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}.roomcode{font-size:64px;font-weight:900;letter-spacing:10px;color:var(--te);line-height:1}'+
'.crowd{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.av{width:88px;display:flex;flex-direction:column;align-items:center;gap:2px}.av svg{width:66px;height:84px}.av .tag{font-weight:900;font-size:17px;border-radius:999px;padding:0 10px;min-height:26px}'+
'.big{font-size:clamp(56px,12vw,110px);font-weight:900;line-height:1;text-align:center}.stat{font-size:30px;font-weight:900}'+
'.bar{position:fixed;left:0;right:0;bottom:0;z-index:9;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:12px;background:rgba(30,36,43,.94)}'+
'table{border-collapse:collapse;width:100%;font-size:22px}th,td{border-bottom:2px solid var(--ln);padding:8px 12px;text-align:left}th{background:#F3EEE7}';
R.person=function(fill,num,mark){return '<svg viewBox="0 0 58 74" aria-hidden="true"><circle cx="29" cy="18" r="13" fill="'+fill+'"/><path d="M6 72 Q6 36 29 36 Q52 36 52 72 Z" fill="'+fill+'"/><text x="29" y="64" text-anchor="middle" font-size="18" font-weight="900" fill="#fff" font-family="Noto Sans TC,sans-serif">'+num+'</text>'+(mark||'')+'</svg>'};
R.avatar=function(seat,fill,tag,act){return '<div class="av"'+(act?' data-act="'+act+'" data-arg="'+seat+'" style="cursor:pointer"':'')+'><span class="tag" style="'+(tag?'background:'+fill+';color:#fff':'')+'">'+(tag||'')+'</span>'+R.person(fill,seat)+'</div>'};
function net(ok){return '<p class="net'+(ok?'':' off')+'">連線：<b>'+(ok?'正常':'連線中…')+'</b></p>'}
R.start=function(cfg){
 var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
 var app=document.createElement('div');document.body.appendChild(app);
 var isHost=location.hash.indexOf('host')>=0;
 var hkey='hdr-'+cfg.key+'-host',mkey='hdr-'+cfg.key+'-me';
 if(isHost){
  var H=ls(hkey);
  function fresh(){var h={room:K||String(1000+Math.floor(Math.random()*9000)),ph:'lobby',seats:{},g:{}};cfg.init(h);return h}
  if(!H||location.hash.indexOf('new')>=0||(K&&H.room!==K)){H=fresh();ls(hkey,H);try{history.replaceState(null,'','#host')}catch(e){}}
  var T='hdr/'+cfg.key+'/'+H.room+'/',last='';
  var conn=L.connect([T+'in'],function(t,d){var seat=+d.seat;
   if(d.t==='join'){if(!(seat>=1&&seat<=35))return;var own=H.seats[seat];
    if(!own||own===d.cid){Object.keys(H.seats).forEach(function(k){if(H.seats[k]===d.cid&&+k!==seat)delete H.seats[k]});H.seats[seat]=d.cid;if(cfg.onJoin)cfg.onJoin(H,seat)}save();return}
   if(d.t==='hello'){bc(true);return}
   if(H.seats[seat]!==d.cid)return;
   if(cfg.onMsg(H,d,seat))save()},function(){draw()});
  function bc(force){var o=cfg.pub?cfg.pub(H):{};o.ph=H.ph;o.seats=H.seats;var s=JSON.stringify(o);if(!force&&s===last)return;last=s;o.ts=Date.now();conn.pub(T+'state',o,true)}
  function save(){ls(hkey,H);draw();bc()}
  R.save=save;
  setInterval(function(){if(cfg.tick&&cfg.tick(H))save();else{var e=document.getElementById('hdtick');if(e&&cfg.tickText)e.innerHTML=cfg.tickText(H);drawBar()}},250);
  setInterval(function(){bc(true)},3000);
  var bar=document.createElement('div');bar.className='bar';bar.style.display='none';document.body.appendChild(bar);var lastBar='';
  function drawBar(){var b=H.ph==='lobby'?'':(cfg.bar?cfg.bar(H):'');if(b!==lastBar){lastBar=b;bar.innerHTML=b;bar.style.display=b?'flex':'none'}}
  var ACT={
   startGame:function(){if(cfg.onStart)cfg.onStart(H);save()},
   release:function(s){if(H.ph==='lobby'&&confirm('要把 '+s+' 號空出來，讓別台平板重新選嗎？')){delete H.seats[s];save()}},
   replay:function(){if(confirm('同一班重玩：從頭開始，已經進場的座號會保留。')){var s=H.seats;H.g={};H.ph='lobby';cfg.init(H);H.seats=s;save()}},
   newRoom:function(){if(confirm(K?'換下一班：要清空這一班的紀錄嗎？學生的平板會自動回到選座號。':'要全部重置、開新房號嗎？（換下一班時用）')){
    conn.pub(T+'state',{ph:'closed',seats:{},ts:Date.now()},true);if(K)conn.pub('hdboard/'+K+'/epoch',{ts:Date.now()},true);setTimeout(function(){if(K){ls(hkey,null);location.hash='#host'}else location.hash='#host-new';location.reload()},400)}}
  };
  function onAct(e){var el=e.target.closest('[data-act]');if(!el||el.disabled)return;e.preventDefault();var a=el.getAttribute('data-act'),arg=el.getAttribute('data-arg');
   if(ACT[a])ACT[a](arg);else if(cfg.act&&cfg.act[a]){if(cfg.act[a](H,arg)!==false)save()}}
  document.addEventListener('pointerdown',onAct);
  document.addEventListener('keydown',function(e){if(cfg.keys&&cfg.keys[(e.key||'').toLowerCase()]){var a=cfg.keys[e.key.toLowerCase()];if(cfg.act[a](H)!==false)save()}});
  function draw(){var n=Object.keys(H.seats).length,h='<div class="wrap host"><div class="top"><div><p class="kick">'+cfg.kick+'</p><h1>'+cfg.title+'</h1>'+
   '<p class="lead">'+(K?'學生用簡報上的「全班連線版」連結進來，按自己的座號就能進場。':'學生網址：games.twranger.com/'+cfg.studentUrl+'　輸入房號 →')+'</p></div>'+
   '<div style="text-align:right">'+(K?'<p class="lead">免房號</p>':'<p class="lead">房號</p><p class="roomcode">'+H.room+'</p>')+net(conn.ok())+
   '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="btn gh sm" data-act="replay">同一班重玩</button><button class="btn gh sm" data-act="newRoom">換下一班</button></div></div></div>';
   if(H.ph==='lobby'){h+='<div class="card"><h2>已經進場：'+n+' 人</h2><div class="crowd">'+(Object.keys(H.seats).map(Number).sort(function(a,b){return a-b}).map(function(s){return R.avatar(s,'#94A3B8','','release')}).join('')||'<p class="lead">還沒有人進場。</p>')+
    '</div><p class="net">選錯座號的同學：點他的小人，就能把座號空出來。</p></div>'+(cfg.rules?'<div class="card">'+cfg.rules+'</div>':'')+
    '<button class="btn te" '+(n>=(cfg.minPlayers||1)?'':'disabled')+' data-act="startGame">'+(cfg.startLabel||'大家都進場了，開始')+'</button>'}
   else h+=cfg.hostView(H);
   app.innerHTML=h+'</div>';drawBar()}
  draw();
 } else {
  var S=ls(mkey)||{room:'',seat:null},CID=L.cid(),ST=null,conn2=null,lastS='',api={local:ls(mkey+'-loc')||{}};
  var m=location.hash.match(/room=(\d{4})/);if(m)S.room=m[1];if(K)S.room=K;
  function TT(){return 'hdr/'+cfg.key+'/'+S.room+'/'}
  api.send=function(o){o.cid=CID;o.seat=S.seat;conn2&&conn2.pub(TT()+'in',o)};
  api.save=function(){ls(mkey+'-loc',api.local);draw()};
  function join(){conn2=L.connect([TT()+'state'],function(t,d){
    if(d.ph==='closed'){try{if(d.ts&&sessionStorage.getItem('hdclosed')==String(d.ts))return;sessionStorage.setItem('hdclosed',String(d.ts))}catch(e){}
     if(!K)S.room='';S.seat=null;ls(mkey,S);api.local={};ls(mkey+'-loc',{});location.reload();return}
    var s=JSON.stringify(d,function(k,v){return k==='id'||k==='ts'?undefined:v});if(s===lastS)return;lastS=s;
    if(ST&&cfg.onState)cfg.onState(ST,d,api);ST=d;draw()},function(ok){if(ok)api.send({t:'hello'});draw()})}
  var SACT={
   enter:function(){var v=(document.getElementById('code').value||'').replace(/\D/g,'');if(v.length!==4){alert('房號是 4 個數字');return}S.room=v;ls(mkey,S);join();draw()},
   pick:function(s){S.seat=+s;ls(mkey,S);api.send({t:'join'});draw()},
   again:function(){localStorage.removeItem(mkey);location.reload()}
  };
  document.addEventListener('click',function(e){var el=e.target.closest('[data-act]');if(!el||el.disabled)return;var a=el.getAttribute('data-act'),arg=el.getAttribute('data-arg');
   if(SACT[a])SACT[a](arg);else if(cfg.sact&&cfg.sact[a])cfg.sact[a](ST,S.seat,api,arg)});
  function draw(){var mine=ST&&S.seat&&ST.seats[S.seat]===CID,h='<div class="wrap"><p class="kick">'+cfg.title+'・全班連線'+(mine?'　｜　我是 '+S.seat+' 號':'')+'</p>';
   if(!S.room||!conn2)h+='<h1>輸入房號</h1><p class="lead">看大螢幕右上角的 4 個數字。</p><input id="code" class="code" inputmode="numeric" maxlength="4" value="'+esc(S.room)+'"><button class="btn te" data-act="enter">進入</button>';
   else if(!ST)h+='<h2>正在連線……</h2><p class="lead">如果一直停在這裡，請確認老師已經打開大螢幕。</p>'+(K?'':'<button class="btn gh" data-act="again">重新輸入房號</button>');
   else if(!mine){h+='<h1>按下你的座號</h1><p class="lead">灰色的座號已經有人選了。按錯了請舉手告訴老師。</p><div class="seats">';
    for(var i=1;i<=35;i++){var tk=ST.seats[i]&&ST.seats[i]!==CID;h+='<button class="seat'+(tk?' taken':'')+'" '+(tk?'disabled':'')+' data-act="pick" data-arg="'+i+'">'+i+'</button>'}h+='</div>'+(S.seat?'<p class="lead">正在進場……</p>':'')}
   else if(ST.ph==='lobby')h+='<div class="card" style="align-items:center">'+R.person('#2A6F68',S.seat)+'<h2>你已經進場了！</h2><p class="lead">看看大螢幕，你的小人出現了嗎？等老師開始。</p></div>';
   else h+=cfg.studentView(ST,S.seat,api);
   app.innerHTML=h+(conn2?net(conn2.ok()):'')+'</div>'}
  R.redraw=draw;
  if(S.room)join();draw();
 }
};
})();
