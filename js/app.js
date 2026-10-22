/* ---------- mode ---------- */
function setMode(m){S.mode=m;save();sess=null;render();}
function render(){S.mode==="in"?renderBook():(sess?renderCard():renderDash());}

/* 拡大縮小を防ぐ：ピンチ（iOSのgesture系）とダブルタップ（CSSの touch-action）を無効化 */
["gesturestart","gesturechange","gestureend"].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener("touchmove",e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
document.addEventListener("dblclick",e=>e.preventDefault());


document.addEventListener("keydown",e=>{
  if(e.target.tagName==="TEXTAREA")return;
  if(e.key==="Escape"){closeMenu();return;}
  if(S.mode==="in"){if(e.key==="ArrowRight")go(1);if(e.key==="ArrowLeft")go(-1);if(e.key==="s"||e.key==="r")toggleSheet();return;}
  if(!sess||!sess.q.length)return;
  if(!sess.shown&&(e.key===" "||e.key==="Enter")){e.preventDefault();reveal();}
  else if(sess.shown&&"1234".includes(e.key))grade(+e.key);
});

setMode(S.mode||"in");
Updater.start();
