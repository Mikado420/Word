/* ---------- 自動更新 ----------
 * 公開中のファイル（index.html と、そこから読み込む CSS・JS）の中身を定期的に取得して指紋を作り、
 * 起動時と変わっていたら新しい版を読み込み直す。GitHub Pages の公開方式や版番号の付け忘れに左右されない。
 * 復習の途中や付箋の編集中は中断させず、画面下のバナーで知らせて、区切りのよいところで反映する。
 */
const Updater=(()=>{
  const INTERVAL=3*60*1000;
  let current=null, pending=false, reg=null, checking=false;

  // 文字列の指紋（FNV-1a 32bit）。暗号用途ではなく変更検知用
  function hash(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,"0");}
  async function get(path){
    const r=await fetch(path+(path.includes("?")?"&":"?")+"t="+Date.now(),{cache:"no-store"});
    if(!r.ok) throw new Error(path+" "+r.status);
    return r.text();
  }
  async function fingerprint(){
    try{
      const html=await get("index.html");
      // index.html が読み込んでいる自前の CSS・JS をすべて対象にする（ファイルを増やしても自動で追従）
      const files=[...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)"/g)].map(m=>m[1]);
      files.push("manifest.json");
      const bodies=await Promise.all(files.map(f=>get(f).catch(()=>"")));
      return hash(html+"\n"+bodies.join("\n"));
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
    if(checking||!navigator.onLine) return;
    checking=true;
    const v=await fingerprint();
    checking=false;
    if(!v) return;
    if(current===null){ current=v; return; }
    if(v!==current){ pending=true; apply(); }
  }
  function start(){
    if(!location.protocol.startsWith("http")) return; // ファイルを直接開いたときは何もしない
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("sw.js").then(r=>reg=r).catch(()=>{});
    }
    check();
    setInterval(check,INTERVAL);
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") check(); });
    window.addEventListener("focus",check);
    window.addEventListener("online",check);
  }
  return {start, apply, check, get version(){return current;}};
})();
