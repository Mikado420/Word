/* ---------- 自動更新 ----------
 * version.json を定期的に確認し、起動時と値が変わっていたら新しい版を読み込み直す。
 * 復習の途中や付箋の編集中は中断させず、上部バナーで知らせて安全なタイミングで反映する。
 */
const Updater=(()=>{
  const INTERVAL=5*60*1000;
  let current=null, pending=false, reg=null;

  async function fetchVersion(){
    try{
      const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});
      if(!r.ok) return null;
      return (await r.json()).version||null;
    }catch(e){return null;}
  }
  function busy(){
    const inReview=typeof sess!=="undefined"&&sess&&sess.q&&sess.q.length>0;
    const editing=document.getElementById("layer").innerHTML.trim()!=="";
    return inReview||editing;
  }
  async function reload(){
    try{ if(reg) await reg.update(); }catch(e){}
    location.reload();
  }
  function banner(){
    if(document.getElementById("upd")) return;
    const b=document.createElement("button");
    b.id="upd"; b.className="upd";
    b.textContent="新しいバージョンがあります — タップで更新";
    b.onclick=reload;
    document.body.appendChild(b);
  }
  function apply(){
    if(!pending) return;
    if(busy()) banner(); else reload();
  }
  async function check(){
    const v=await fetchVersion();
    if(!v) return;
    if(current===null){ current=v; return; }
    if(v!==current){ pending=true; apply(); }
  }
  function start(){
    if("serviceWorker" in navigator && location.protocol.startsWith("http")){
      navigator.serviceWorker.register("sw.js").then(r=>reg=r).catch(()=>{});
    }
    check();
    setInterval(check,INTERVAL);
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") check(); });
    window.addEventListener("online",check);
  }
  return {start, apply, get version(){return current;}};
})();
