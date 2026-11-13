/* 海佃課堂小遊戲・清空紀錄、換新班級（平板是好幾班共用的）
   老師在「老師頁面」（全班統計大螢幕、全班連線遊戲的老師大螢幕，或任何遊戲網址後面加 #teacher）
   按「清空紀錄・換新班級」：每一台學生平板（包括已經點進來、正在玩的）都會被退出、清掉進度、
   回到遊戲開頭；按鈕之前的結果，大螢幕不再計入。
   另外：平板超過 15 分鐘沒人玩，打開時也會先清掉上一位的進度。 */
(function(){
var IDLE=15*60*1000,LS;
try{LS=window.localStorage;LS.getItem('x')}catch(e){return}
var KEEP=/^(hd-cid|hd-room|hd-touch|hd-epoch|hdboard-v1)$/;
function keys(){var a=[];for(var i=0;i<LS.length;i++){var k=LS.key(i);if(k&&!KEEP.test(k))a.push(k)}return a}
function wipe(){keys().forEach(function(k){LS.removeItem(k)});LS.removeItem('hd-touch')}
var touch=+LS.getItem('hd-touch')||0;
if(touch&&Date.now()-touch>IDLE){wipe();touch=0}
var orig=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){orig.call(this,k,v);if(this===LS&&!KEEP.test(k))orig.call(this,'hd-touch',String(Date.now()))};
var setW=Storage.prototype.setItem;
/* 按錯了可以回上一步：只用在「點選答案」的題目型遊戲，按下去 10 秒內可以回上一步改；超過就確定。 */
var UNDO=/^(glasses|cookiejar|label|rewrite|coinstall|forkraft|souvenir|pondwall|pursepig|robotlens|tidefield|notice|passball|mathbreak)\.html$/,SEC=10;
var page=(location.pathname.split('/').pop()||'');
if(UNDO.test(page)&&location.hash.indexOf('host')<0&&location.hash.indexOf('teacher')<0){
 var lastTap=0,snap=null,snapTap=-1,ub=null,uT=null,uEnd=0;
 document.addEventListener('pointerdown',function(){lastTap=Date.now()},true);
 document.addEventListener('click',function(){lastTap=Date.now()},true);
 function all(){var o={};keys().forEach(function(k){o[k]=LS.getItem(k)});return o}
 function hideU(){if(ub){ub.remove();ub=null}clearInterval(uT)}
 function showU(s){hideU();uEnd=Date.now()+SEC*1000;ub=document.createElement('button');ub.type='button';
  ub.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99998;font:900 20px/1.3 "Noto Sans TC",sans-serif;border:3px solid #D95D39;background:#FFF5F2;color:#D95D39;border-radius:999px;padding:10px 22px;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer';
  function lab(){var n=Math.ceil((uEnd-Date.now())/1000);if(n<=0){hideU();return}ub.textContent='↩ 按錯了？回上一步（'+n+' 秒）'}
  ub.onclick=function(e){e.stopPropagation();hideU();keys().forEach(function(k){if(!(k in s))LS.removeItem(k)});Object.keys(s).forEach(function(k){orig.call(LS,k,s[k])});location.reload()};
  lab();uT=setInterval(lab,250);(document.body||document.documentElement).appendChild(ub)}
 var before=orig;
 Storage.prototype.setItem=function(k,v){
  if(this===LS&&!KEEP.test(k)){var now=Date.now();
   if(now-lastTap<1500&&lastTap!==snapTap&&!(window.HDundoOK&&!window.HDundoOK())){snapTap=lastTap;snap=all();var s0=snap;setTimeout(function(){showU(s0)},0)}}
  return setW.call(this,k,v)};
}
var K=null;try{K=new URLSearchParams(location.search).get('k')}catch(e){}
if(!K||!/^[a-z0-9]{3,16}$/.test(K))return;
var H=location.hash,isHost=H.indexOf('host')>=0,isTeacher=H.indexOf('teacher')>=0,T='hdboard/'+K+'/epoch';
function need(cb){if(window.LIVE&&LIVE.connect)return cb();var s=document.createElement('script');s.src='live.js';s.onload=cb;document.head.appendChild(s)}
function toast(t){var d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99999;background:#1E242B;color:#fff;font:900 20px/1.4 "Noto Sans TC",sans-serif;padding:12px 22px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.3)';document.body.appendChild(d);setTimeout(function(){d.remove()},5000)}
/* 老師：網址加 #teacher，出現清空按鈕 */
window.HDnewClass=function(conn){var ts=Date.now();(conn||HDc).pub(T,{ts:ts},true);orig.call(LS,'hd-epoch',String(ts));return ts};
var HDc=null;
function teacherUI(){need(function(){HDc=LIVE.connect([],function(){});
 var b=document.createElement('div');b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-family:"Noto Sans TC",sans-serif';
 b.innerHTML='<button type="button" style="font:inherit;font-size:22px;font-weight:900;border:0;border-radius:14px;padding:14px 22px;background:#D95D39;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)">老師：清空紀錄・換新班級</button><span style="font-size:15px;color:#475569;background:#fff;border-radius:8px;padding:2px 8px"></span>';
 var s=b.querySelector('span');b.querySelector('button').onclick=function(){if(!confirm('清空紀錄、換新班級？\n所有學生平板（包括已經進來的）都會被退出、回到開頭，之前的紀錄不再計入。'))return;HDnewClass();s.textContent='✓ 已送出：學生平板會自動回到開頭'};
 document.body.appendChild(b)})}
/* 學生：收到換班訊號，就退出、清掉進度、回到開頭 */
function listen(){need(function(){LIVE.connect([T],function(t,d){var ts=+d.ts||0,seen=+LS.getItem('hd-epoch')||0;if(!ts||ts<=seen)return;
  orig.call(LS,'hd-epoch',String(ts));var tc=+LS.getItem('hd-touch')||0;
  if(tc&&tc<ts){wipe();try{sessionStorage.setItem('hd-kicked','1')}catch(e){}location.replace(location.pathname+location.search)}})})}
function boot(){
 try{if(sessionStorage.getItem('hd-kicked')){sessionStorage.removeItem('hd-kicked');toast('老師換新班級了，請從頭開始。')}}catch(e){}
 if(isTeacher)teacherUI();else if(!isHost)listen()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,0)});else boot();
})();
