/* 海佃課堂小遊戲・換班自動清除（平板是好幾班共用的）
   1. 這台平板超過 15 分鐘沒有人玩（沒有存過進度），打開任何遊戲時，先清掉上一位同學的進度。
   2. 老師在全班統計大螢幕按「換下一班」或「清空這個遊戲」時，送出一個「換班訊號」；
      平板上 3 分鐘以上沒動過的進度，收到訊號就清掉、重新開始。正在玩的同學不受影響。 */
(function(){
var IDLE=15*60*1000,MARGIN=3*60*1000,LS;
try{LS=window.localStorage;LS.getItem('x')}catch(e){return}
var KEEP=/^(hd-cid|hd-room|hd-touch|hd-epoch|hdboard-v1)$/;
function keys(){var a=[];for(var i=0;i<LS.length;i++){var k=LS.key(i);if(k&&!KEEP.test(k))a.push(k)}return a}
function wipe(){var a=keys();a.forEach(function(k){LS.removeItem(k)});try{sessionStorage.clear()}catch(e){}return a.length}
var touch=+LS.getItem('hd-touch')||0;
if(touch&&Date.now()-touch>IDLE){wipe();LS.removeItem('hd-touch');touch=0}
var orig=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){orig.call(this,k,v);if(this===LS&&!KEEP.test(k))orig.call(this,'hd-touch',String(Date.now()))};
var K=null;try{K=new URLSearchParams(location.search).get('k')}catch(e){}
if(!K||!/^[a-z0-9]{3,16}$/.test(K)||location.hash.indexOf('host')>=0)return;
function listen(){if(!window.LIVE||!LIVE.connect)return;
 LIVE.connect(['hdboard/'+K+'/epoch'],function(t,d){var ts=+d.ts||0,seen=+LS.getItem('hd-epoch')||0;if(!ts||ts<=seen)return;
  orig.call(LS,'hd-epoch',String(ts));var tc=+LS.getItem('hd-touch')||0;
  if(tc&&tc<ts-MARGIN&&wipe()){location.replace(location.pathname+location.search)}})}
function boot(){if(window.LIVE)return listen();var s=document.createElement('script');s.src='live.js';s.onload=listen;document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,0)});else boot();
})();
