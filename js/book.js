/* ---------- INPUT: book ----------
 * 1ページ = フレーズ一覧（上）＋ 見出し語ブロック（下）
 * 左列＝英語、右列＝日本語。赤シートは右列にかかり、赤字だけが消える
 */
function renderBook(){
  S.checks=S.checks||{};
  if(typeof S.pos!=="number") S.pos=(S.page||0)*5;
  // まず枠だけ描いて紙面の高さを測り、収まる語数でページ割りする
  $("#view").innerHTML=shell(S.page||0,PAGES||1,"");
  pages=paginate($("#page"));PAGES=pages.length;
  let p=pages.findIndex(([a,b])=>S.pos>=a&&S.pos<b); if(p<0)p=0;
  S.page=p; S.pos=pages[p][0];
  const list=WORDS.slice(pages[p][0],pages[p][1]), stage=Math.floor(pages[p][0]/STAGE)+1;
  list.forEach(w=>S.read[w.id]=1); save();
  const phrases=list.map(phraseRow).join("");
  const entries=list.map(entryBlock).join("");
  $("#view").innerHTML=shell(p,PAGES,pageInner(stage,list,phrases,entries));
  if($("#page").scrollHeight>$("#page").clientHeight+2)$("#page").classList.add("tall");
  bindBook();
  RedSheet.mount();
}
function phraseRow(w){return `
      <div class="mprow" data-peek>
        <div class="lc"><button class="ck" data-ck="${w.id}" aria-pressed="${!!S.checks[w.id]}" aria-label="${esc(w.w)} を覚えた"></button><span class="mpen">${mk(w.ph)}</span></div>
        <div class="rc mpja">${mk(w.phj).replace(/<b>(.+?)<\/b>/g,'<em class="r hl">$1</em>')}</div>
      </div>`;}
function entryBlock(w){const n=S.notes[w.id],lv=level(w.id);return `
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
      </article>`;}
function pageInner(stage,list,phrases,entries){
  return `<div class="pghead"><h2>Phrases</h2><span>STAGE ${stage} · ${list.length?list[0].id+"–"+list[list.length-1].id:""}</span></div>
      <div class="mp">${phrases}</div>
      <div class="ents">${entries}</div>
      <div class="pgfoot"><button class="pgnav" data-go="-1" aria-label="前のページ" ${S.page<=0?"disabled":""}>‹</button><span>${S.page+1} / ${PAGES||1}</span><button class="pgnav" data-go="1" aria-label="次のページ" ${S.page>=PAGES-1?"disabled":""}>›</button></div>`;
}
function shell(p,total,inner){
  return `<section class="page" id="page">${inner}</section>`;
}
function toggleSheet(){RedSheet.toggle();}
function jumpTo(id){S.pos=id-1;save();renderBook();const e=$("#e"+id);if(e){e.scrollIntoView({block:"nearest"});e.classList.add("flash");setTimeout(()=>e.classList.remove("flash"),900);}}
/* 全単語を紙面と同じ幅で測り、上から詰めて1画面に収まるページ割りを作る */
let pages=[],PAGES=0;
function paginate(real){
  const H=real.clientHeight, m=document.createElement("section");
  m.className="page measure";m.style.width=real.offsetWidth+"px";
  m.innerHTML=pageInner(1,WORDS,WORDS.map(phraseRow).join(""),WORDS.map(entryBlock).join(""));
  document.body.appendChild(m);
  const rows=[...m.querySelectorAll(".mprow")].map(e=>e.offsetHeight);
  const ents=[...m.querySelectorAll(".ent")].map(e=>e.offsetHeight);
  const over=m.offsetHeight-rows.reduce((a,b)=>a+b,0)-ents.reduce((a,b)=>a+b,0)+20; // 20px は折り返しの誤差に備えた余白
  m.remove();
  const out=[];let i=0;
  while(i<WORDS.length){let h=over,j=i;
    while(j<WORDS.length&&j-i<MAX_PER&&(j===i||h+rows[j]+ents[j]<=H)){h+=rows[j]+ents[j];j++;}
    out.push([i,j]);i=j;}
  return out;
}
function bindBook(){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(+b.dataset.go));
  document.querySelectorAll("[data-peek]").forEach(el=>el.onclick=e=>{if(S.sheet&&!e.target.closest("button")){el.classList.toggle("peek");RedSheet.sync();}});
  document.querySelectorAll("[data-ck]").forEach(el=>el.onclick=()=>{const id=+el.dataset.ck;if(S.checks[id])delete S.checks[id];else S.checks[id]=1;save();el.setAttribute("aria-pressed",!!S.checks[id]);RedSheet.sync();});
  document.querySelectorAll("[data-tag]").forEach(el=>el.onclick=()=>openNote(+el.dataset.tag));
  const pg=$("#page");let x0=null,y0=0;
  pg.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  pg.addEventListener("touchend",e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);x0=null;},{passive:true});
}
function go(d){const n=S.page+d;if(n<0||n>=PAGES)return;S.pos=pages[n][0];save();renderBook();}
let _rz;window.addEventListener("resize",()=>{clearTimeout(_rz);_rz=setTimeout(()=>{if(S.mode==="in"&&!$("#layer").innerHTML.trim()){const o=menuOpen();renderBook();if(o)openMenu();}},150);});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(S.mode==="in")renderBook();});

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

