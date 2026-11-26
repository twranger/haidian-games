/* 海佃小遊戲共用圖示（同一套線條粗細的 SVG，取代 emoji 和符號字元）。
   用法：ICON('star') 回傳一段 SVG 字串；ICON('star',{size:28,color:'#B67A12'})。
   預設跟著文字大小（1em）和文字顏色。名稱：star heart gem check x undo backspace up down left right leftright
   線條型的圖示：stroke 2.25、圓角端點；star／heart 是實心。 */
(function(){
 var P={
  star:['<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/>',1],
  heart:['<path d="M12 20.5l-7.4-7.3A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 7.4 6.6z"/>',1],
  gem:['<path d="M6 3.5h12l3.5 5.5L12 20.5 2.5 9z"/><path d="M2.5 9h19"/><path d="M10 3.5 8 9l4 11.5L16 9l-2-5.5"/>',0],
  check:['<path d="M20 6.5 9.5 17 4 11.5"/>',0],
  x:['<path d="M18 6 6 18M6 6l12 12"/>',0],
  undo:['<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',0],
  backspace:['<path d="M10 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-7-7z"/><path d="m12 9 6 6M18 9l-6 6"/>',0],
  up:['<path d="M12 19V5M5 12l7-7 7 7"/>',0],
  down:['<path d="M12 5v14M19 12l-7 7-7-7"/>',0],
  left:['<path d="M19 12H5M12 19l-7-7 7-7"/>',0],
  right:['<path d="M5 12h14M12 5l7 7-7 7"/>',0],
  leftright:['<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',0]
 };
 window.ICON=function(n,o){o=o||{};var p=P[n];if(!p)return '';var s=o.size?o.size+'px':'1em',c=o.color||'currentColor';
  return '<svg class="ic" viewBox="0 0 24 24" width="'+s+'" height="'+s+'" aria-hidden="true" focusable="false" fill="'+(p[1]?c:'none')+'" stroke="'+c+'" stroke-width="'+(p[1]?1.5:2.25)+'" stroke-linecap="round" stroke-linejoin="round">'+p[0]+'</svg>'};
 window.STARS=function(k,o){var h='';for(var i=0;i<(k||5);i++)h+=ICON('star',o);return '<span class="stars" role="img" aria-label="'+(k||5)+' 顆星">'+h+'</span>'};
 try{var st=document.createElement('style');st.textContent='.ic{display:inline-block;vertical-align:-.14em;flex:none}.stars{display:inline-flex;gap:2px;vertical-align:-.14em}';document.head.appendChild(st)}catch(e){}
})();
