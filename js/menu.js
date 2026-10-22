/* ---------- メニュー（左上のボタンから開くドロワー） ----------
 * モード切替・ページ移動・付箋一覧・復習の終了をここに集約し、
 * それ以外の画面はすべて紙面／カードに使う
 */
function openMenu(){
  const inBook=S.mode==="in";
  const tabs=Object.keys(S.notes).map(Number).sort((a,b)=>a-b).map(id=>{const n=S.notes[id],w=WORDS[id-1];return `<button class="tab c-${n.color}" data-jump="${id}">${esc(w.w)}</button>`}).join("");
  $("#drawer").innerHTML=`<div class="scrim" data-close></div>
  <nav class="drawer" aria-label="メニュー">
    <div class="dhead"><span class="brand"><i></i>赤シート単語帳</span><button class="dx" data-close aria-label="メニューを閉じる">✕</button></div>
    <div class="seg" role="group" aria-label="モード">
      <button data-mode="in" aria-pressed="${inBook}">インプット</button>
      <button data-mode="out" aria-pressed="${!inBook}">アウトプット</button>
    </div>
    ${inBook?`
    <div class="dsec"><span class="lbl">ページ</span>
      <div class="pgrid">${pages.map(([a],i)=>`<button data-pg="${i}" aria-current="${i===S.page?"page":"false"}" title="${esc(WORDS[a].w)}〜">${i+1}</button>`).join("")}</div>
    </div>
    <div class="dsec"><span class="lbl">付箋</span>
      <div class="dtabs">${tabs||'<p class="hint">まだ付箋はありません。単語の横の栞ボタンから貼れます。</p>'}</div>
    </div>`
    :(sess&&sess.q.length?`<button class="btn warn" id="dquit">復習を終了してダッシュボードへ</button>`:"")}
    ${WORDS.length?`<div class="dsec"><span class="lbl">単語データ</span><button class="ddata" id="ddata"><span>${esc(DATA&&DATA.title||"")}</span><small>${WORDS.length}語 · 読み込み直す</small></button></div>`:""}
    <div class="dsec"><span class="lbl">表示</span>
      <div class="seg" role="group" aria-label="表示テーマ">
        ${[["auto","自動"],["light","ライト"],["dark","ダーク"]].map(([k,t])=>`<button data-theme-set="${k}" aria-pressed="${(S.theme||"auto")===k}">${t}</button>`).join("")}
      </div>
    </div>
    <p class="hint dver">バージョン ${esc(Updater.version||"—")}</p>
  </nav>`;
  document.querySelectorAll("#drawer [data-close]").forEach(b=>b.onclick=closeMenu);
  document.querySelectorAll("#drawer [data-mode]").forEach(b=>b.onclick=()=>{closeMenu();if(b.dataset.mode!==S.mode)setMode(b.dataset.mode);});
  document.querySelectorAll("#drawer [data-pg]").forEach(b=>b.onclick=()=>{closeMenu();S.pos=pages[+b.dataset.pg][0];save();renderBook();});
  document.querySelectorAll("#drawer [data-jump]").forEach(b=>b.onclick=()=>{closeMenu();jumpTo(+b.dataset.jump);});
  document.querySelectorAll("#drawer [data-theme-set]").forEach(b=>b.onclick=()=>{S.theme=b.dataset.themeSet;save();applyTheme();
    document.querySelectorAll("#drawer [data-theme-set]").forEach(x=>x.setAttribute("aria-pressed",x===b));});
  const dd=$("#ddata");if(dd)dd.onclick=()=>{closeMenu();sess=null;renderImport(true);};
  const dq=$("#dquit");if(dq)dq.onclick=()=>{closeMenu();sess=null;renderDash();};
}
function closeMenu(){$("#drawer").innerHTML="";}
function menuOpen(){return $("#drawer").innerHTML.trim()!=="";}
$("#menubtn").onclick=()=>menuOpen()?closeMenu():openMenu();
