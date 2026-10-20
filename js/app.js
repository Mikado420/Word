/* ---------- mode ---------- */
function setMode(m){S.mode=m;save();$("#m-in").setAttribute("aria-pressed",m==="in");$("#m-out").setAttribute("aria-pressed",m==="out");sess=null;render();}
$("#m-in").onclick=()=>setMode("in"); $("#m-out").onclick=()=>setMode("out");
function render(){S.mode==="in"?renderBook():(sess?renderCard():renderDash());window.scrollTo({top:0});}


document.addEventListener("keydown",e=>{
  if(e.target.tagName==="TEXTAREA")return;
  if(S.mode==="in"){if(e.key==="ArrowRight")go(1);if(e.key==="ArrowLeft")go(-1);return;}
  if(!sess||!sess.q.length)return;
  if(!sess.shown&&(e.key===" "||e.key==="Enter")){e.preventDefault();reveal();}
  else if(sess.shown&&"1234".includes(e.key))grade(+e.key);
});

setMode(S.mode||"in");
