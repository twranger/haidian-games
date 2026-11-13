/* 海佃課堂小遊戲・全班即時連線共用程式
   同時連兩個公開服務（EMQX、HiveMQ），訊息用 id 去重複；學生和老師都不用登入。 */
(function(){
var BROKERS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'];
var MQTT_SRC='https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';
var L=window.LIVE={};
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
L.ls=ls;
L.key=(function(){try{var k=new URLSearchParams(location.search).get('k');return k&&/^[a-z0-9]{3,16}$/.test(k)?k:null}catch(e){return null}})();
L.uid=function(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4)};
L.cid=function(){var c=ls('hd-cid');if(!c){c=L.uid();ls('hd-cid',c)}return c};
L.esc=function(s){return String(s==null?'':s).replace(/[<>&"]/g,'')};
function loadMqtt(cb){if(window.mqtt)return cb();var s=document.createElement('script');s.src=MQTT_SRC;s.onload=function(){cb()};s.onerror=function(){cb()};document.head.appendChild(s)}
/* 連線：subs 要訂閱的主題；onmsg(topic,obj)；onstat(ok) */
L.connect=function(subs,onmsg,onstat){
 var CL=[],UP={},SEEN={},api={ok:function(){return Object.keys(UP).some(function(k){return UP[k]})}};
 api.pub=function(t,obj,retain){obj.id=L.uid();var s=JSON.stringify(obj);CL.forEach(function(c){if(c.connected)c.publish(t,s,{qos:0,retain:!!retain})})};
 api.sub=function(t){subs.push(t);CL.forEach(function(c){if(c.connected)c.subscribe(t)})};
 loadMqtt(function(){if(!window.mqtt){onstat&&onstat(false);return}
  BROKERS.forEach(function(u,i){var c;try{c=mqtt.connect(u,{connectTimeout:10000,reconnectPeriod:3000,clientId:'hd_'+L.uid()})}catch(e){return}
   CL.push(c);
   c.on('connect',function(){UP[i]=1;subs.forEach(function(t){c.subscribe(t)});onstat&&onstat(true)});
   c.on('close',function(){UP[i]=0;onstat&&onstat(api.ok())});
   c.on('message',function(t,m){var d;try{d=JSON.parse(m.toString())}catch(e){return}
    if(d&&d.id){if(SEEN[d.id])return;SEEN[d.id]=1}onmsg(t,d)})})});
 return api};

/* ===== 學生端：遊戲做完以後，把結果送到老師的大螢幕（全班統計看板） =====
   用法：容器.appendChild(LIVE.box('cookiejar',{g:'red',rows:[true,false,...]})) */
var CSS='.hdbox{background:#F0F7F6;border:2px solid #CFE3E0;border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;font-family:inherit}'+
 '.hdbox b.t{font-size:20px;color:#2A6F68}.hdbox .r{display:flex;gap:8px;flex-wrap:wrap;align-items:center}'+
 '.hdbox input{font:inherit;font-size:28px;font-weight:900;letter-spacing:6px;width:150px;text-align:center;border:3px solid #E3DED7;border-radius:12px;padding:4px}'+
 '.hdbox button{font:inherit;font-size:20px;font-weight:900;border:0;border-radius:12px;padding:10px 16px;background:#2A6F68;color:#fff;cursor:pointer}'+
 '.hdbox .s{font-size:17px;color:#475569}.hdbox .s.ok{color:#2A6F68;font-weight:900}.hdbox .s.bad{color:#D95D39;font-weight:900}';
L.box=function(game,payload){
 if(!document.getElementById('hdboxcss')){var st=document.createElement('style');st.id='hdboxcss';st.textContent=CSS;document.head.appendChild(st)}
 if(L.key){/* 從簡報的連結進來：自動送出，不用房號 */
  var a=document.createElement('p');a.className='hdbox s';a.style.cssText='font-size:17px;color:#475569;margin:0';a.textContent='（正在把結果送到老師的大螢幕……）';
  var cid0=L.cid(),done=false,cn=L.connect(['hdboard/'+L.key+'/ack'],function(t,m){if(m.cid===cid0&&m.game===game&&!done){done=true;a.style.color='#2A6F68';a.style.fontWeight='900';a.textContent='✓ 結果已經送到老師的大螢幕'}},
   function(ok){if(ok&&!done)cn.pub('hdboard/'+L.key+'/in',{t:'res',ep:+(ls('hd-epoch')||0),game:game,cid:cid0,g:payload.g||null,rows:payload.rows||[],v:payload.v==null?null:payload.v})});
  setTimeout(function(){if(!done)a.textContent='（老師這次沒有開統計大螢幕也沒關係，等一下照老師說的舉手。）'},9000);
  return a}
 var d=document.createElement('div');d.className='hdbox';
 var room=ls('hd-room')||'';
 d.innerHTML='<b class="t">把結果送到老師的大螢幕</b><p class="s">老師有開「全班統計」的話，輸入大螢幕上的 4 位數房號，再按送出。沒有的話，這一格不用管。</p>'+
  '<div class="r"><input inputmode="numeric" maxlength="4" placeholder="房號" value="'+L.esc(room)+'"><button type="button">送出結果</button></div><p class="s" aria-live="polite"></p>';
 var inp=d.querySelector('input'),btn=d.querySelector('button'),msg=d.querySelectorAll('p.s')[1],conn=null,cur=null,cid=L.cid(),timer=null;
 function say(t,c){msg.textContent=t;msg.className='s'+(c?' '+c:'')}
 btn.onclick=function(){var v=(inp.value||'').replace(/\D/g,'');if(v.length!==4){say('房號是 4 個數字','bad');return}
  ls('hd-room',v);say('送出中……');
  var send=function(){conn.pub('hdboard/'+v+'/in',{t:'res',game:game,cid:cid,g:payload.g||null,rows:payload.rows||[],v:payload.v==null?null:payload.v})};
  if(conn&&cur===v){send()}else{cur=v;conn=L.connect(['hdboard/'+v+'/ack'],function(t,m){if(m.cid===cid&&m.game===game){clearTimeout(timer);say('✓ 大螢幕收到了！','ok')}},function(ok){if(ok)send()})}
  clearTimeout(timer);timer=setTimeout(function(){say('大螢幕還沒有回應。請確認房號，或請老師看看大螢幕有沒有打開。','bad')},9000)};
 return d};
})();
