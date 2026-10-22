/* ---------- INPUT: book ----------
 * 1ページ = フレーズ一覧（上）＋ 見出し語ブロック（下）
 * 左列＝英語、右列＝日本語。赤シートは右列にかかり、赤字だけが消える
 */
function renderBook(){
  if(S.page>=PAGES)S.page=PAGES-1;
  S.checks=S.checks||{};
  const p=S.page, stage=Math.floor(p*PER/STAGE)+1, list=WORDS.slice(p*PER,p*PER+PER);
  list.forEach(w=>S.read[w.id]=1); save();
  const tabs=Object.keys(S.notes).map(Number).sort((a,b)=>a-b).map(id=>{const n=S.notes[id],w=WORDS[id-1];return `<button class="tab c-${n.color}" data-jump="${id}">${esc(w.w)}</button>`}).join("");
  const phrases=list.map(w=>`
      <div class="mprow" data-peek>
        <div class="lc"><button class="ck" data-ck="${w.id}" aria-pressed="${!!S.checks[w.id]}" aria-label="${esc(w.w)} を覚えた"></button><span class="mpen">${mk(w.ph)}</span></div>
        <div class="rc mpja">${mk(w.phj).replace(/<b>(.+?)<\/b>/g,'<em class="r hl">$1</em>')}</div>
      </div>`).join("");
  const entries=list.map(w=>{const n=S.notes[w.id],lv=level(w.id);return `
      <article class="ent" id="e${w.id}" data-peek>
        <div class="lc hwc">
          <div class="hn"><span class="num">${w.id}</span><span class="lvdot l${lv}" title="${["未学習","学習中","定着"][lv]}"></span></div>
          <div class="hword">${esc(w.w)}</div>
          <div class="hipa">[${esc(w.ipa)}]</div>
          ${w.tags.length?`<div class="qtags">${w.tags.map(t=>`<span class="qt">${t}</span>`).join("")}</div>`:""}
          <button class="tagbtn" data-tag="${w.id}" aria-label="${esc(w.w)} に付箋">${tagIcon}</button>
        </div>
        <div class="rc defc">
          <div class="def">${fmtDef(w.d)}</div>
          ${w.l.map(fmtLine).join("")}
        </div>
        ${w.q?`<div class="lc qc"><span class="qa">Q</span><span>${esc(w.q[0])}</span></div><div class="rc ac"><span class="qa">A</span><span class="hid">${esc(w.q[1])}</span></div>`:""}
        ${n&&n.memo?`<div class="memo c-${n.color}">${esc(n.memo)}</div>`:""}
        ${n?`<button class="sticky c-${n.color}" data-tag="${w.id}" aria-label="付箋を編集">${COLORS[n.color]}</button>`:""}
      </article>`}).join("");
  $("#view").innerHTML=`
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="bar">
      <button class="chip" id="sheetbtn" aria-pressed="${S.sheet}">赤シート ${S.sheet?"ON":"OFF"}</button>
      <div class="pager"><button id="prev" aria-label="前のページ" ${p===0?"disabled":""}>‹</button>p.${p+1} / ${PAGES}<button id="next" aria-label="次のページ" ${p===PAGES-1?"disabled":""}>›</button></div>
    </div>
    <div class="tabs" aria-label="付箋一覧">${tabs}</div>
    <section class="page ${S.sheet?"sheet-on":""}" id="page">
      <div class="pghead"><h2>Phrases</h2><span>STAGE ${stage} · ${p*PER+1}–${p*PER+list.length}</span></div>
      <div class="mp">${phrases}</div>
      <div class="ents">${entries}</div>
      <div class="pgfoot">${p+1}</div>
    </section>
    <p class="hint">□ は覚えたフレーズのチェック欄。赤シートONで赤字とQの答えが消え、行をタップするとその部分だけ透けます。左右スワイプでページ移動。</p>
  </div>`;
  $("#sheetbtn").onclick=()=>{S.sheet=!S.sheet;save();renderBook();};
  $("#prev").onclick=()=>go(-1); $("#next").onclick=()=>go(1);
  document.querySelectorAll("[data-peek]").forEach(el=>el.onclick=e=>{if(S.sheet&&!e.target.closest("button"))el.classList.toggle("peek");});
  document.querySelectorAll("[data-ck]").forEach(el=>el.onclick=()=>{const id=+el.dataset.ck;if(S.checks[id])delete S.checks[id];else S.checks[id]=1;save();el.setAttribute("aria-pressed",!!S.checks[id]);});
  document.querySelectorAll("[data-tag]").forEach(el=>el.onclick=()=>openNote(+el.dataset.tag));
  document.querySelectorAll("[data-jump]").forEach(el=>el.onclick=()=>{const id=+el.dataset.jump;S.page=Math.floor((id-1)/PER);renderBook();const e=$("#e"+id);if(e){e.scrollIntoView({block:"center",behavior:"smooth"});e.classList.add("flash");setTimeout(()=>e.classList.remove("flash"),900);}});
  const pg=$("#page");let x0=null,y0=0;
  pg.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  pg.addEventListener("touchend",e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);x0=null;},{passive:true});
}
function go(d){const n=S.page+d;if(n<0||n>=PAGES)return;S.page=n;save();renderBook();window.scrollTo({top:0});}

function openNote(id){
  const w=WORDS[id-1],n=S.notes[id]||{color:"yellow",memo:""};let color=n.color;
  $("#layer").innerHTML=`<div class="scrim" id="scrim"></div>
  <div class="sheetpanel" role="dialog" aria-label="付箋"><div class="sheetin">
    <h3>${esc(w.w)} <span style="font-family:var(--f-body);font-size:13px;color:var(--muted)">に付箋を貼る</span></h3>
    <div class="swatches">${Object.entries(COLORS).map(([k,v])=>`<div><button class="sw c-${k}" data-c="${k}" aria-pressed="${k===color}" aria-label="${v}"></button><div class="swl">${v}</div></div>`).join("")}</div>
    <textarea id="memo" placeholder="メモ（例：considerate と混同）">${esc(n.memo||"")}</textarea>
    <div class="row">${S.notes[id]?`<button class="btn warn" id="peel">はがす</button>`:""}<button class="btn ghost" id="cancel">閉じる</button><button class="btn pri" id="stick">貼る</button></div>
  </div></div>`;
  const close=()=>$("#layer").innerHTML="";
  $("#scrim").onclick=close;$("#cancel").onclick=close;
  document.querySelectorAll(".sw").forEach(b=>b.onclick=()=>{color=b.dataset.c;document.querySelectorAll(".sw").forEach(x=>x.setAttribute("aria-pressed",x===b));});
  $("#stick").onclick=()=>{S.notes[id]={color,memo:$("#memo").value.trim()};save();close();render();};
  const pe=$("#peel");if(pe)pe.onclick=()=>{delete S.notes[id];save();close();render();};
}

