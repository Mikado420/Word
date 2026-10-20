/* ---------- OUTPUT: dashboard ---------- */
const NEW_LIMIT=10;
function pool(){
  return WORDS.filter(w=>S.filter==="notes"?S.notes[w.id]:S.filter==="read"?S.read[w.id]:true);
}
function counts(now){
  const pl=pool();
  const due=pl.filter(w=>{const c=S.cards[w.id];return c&&c.reps&&c.due<=now});
  const fresh=pl.filter(w=>!(S.cards[w.id]&&S.cards[w.id].reps));
  fresh.sort((a,b)=>(S.read[b.id]?1:0)-(S.read[a.id]?1:0)||a.id-b.id);
  return {due,fresh:fresh.slice(0,NEW_LIMIT),freshAll:fresh.length};
}
function renderDash(){
  const now=Date.now(),{due,fresh}=counts(now);
  const learned=WORDS.filter(w=>S.cards[w.id]&&S.cards[w.id].reps);
  const mature=learned.filter(w=>S.cards[w.id].s>=21).length;
  const avgR=learned.length?learned.reduce((a,w)=>{const c=S.cards[w.id];return a+retr(Math.max(0,(now-c.last)/DAY),c.s)},0)/learned.length:0;
  const today=new Date();today.setHours(0,0,0,0);
  const fc=[...Array(7)].map((_,i)=>{const a=today.getTime()+i*DAY,b=a+DAY;return learned.filter(w=>{const d=S.cards[w.id].due;return i===0?d<b:d>=a&&d<b}).length});
  const mx=Math.max(1,...fc),wd="日月火水木金土";
  $("#view").innerHTML=`
  <div style="display:flex;flex-direction:column;gap:12px">
  <section class="panel">
    <div class="stats">
      <div class="stat due"><b>${due.length}</b><span>今日の復習</span></div>
      <div class="stat"><b>${fresh.length}</b><span>新しい単語</span></div>
      <div class="stat"><b>${mature}<small style="font-size:14px;color:var(--muted)">/${WORDS.length}</small></b><span>定着した単語</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;justify-content:space-between"><span class="lbl">いまの記憶保持率（推定）</span><span style="font-size:13px;font-variant-numeric:tabular-nums">${learned.length?Math.round(avgR*100)+"%":"—"}</span></div>
      <div class="retbar"><i style="width:${Math.round(avgR*100)}%"></i></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span class="lbl">出題範囲</span>
      <div class="seg" role="group">
        ${[["read","読んだ単語"],["notes","付箋だけ"],["all","すべて"]].map(([k,v])=>`<button data-f="${k}" aria-pressed="${S.filter===k}">${v}</button>`).join("")}
      </div>
    </div>
    <button class="btn pri start" id="go" ${due.length+fresh.length?"":"disabled"}>${due.length+fresh.length?`復習をはじめる（${due.length+fresh.length}枚）`:"今日の分は完了"}</button>
  </section>
  <section class="panel">
    <span class="lbl">これから7日間の復習予定</span>
    <div class="fc">${fc.map((n,i)=>`<div class="fcb"><em>${n||""}</em><i class="${n?"":"z"}" style="height:${Math.round(n/mx*56)}px"></i><span>${i===0?"今日":wd[(today.getDay()+i)%7]}</span></div>`).join("")}</div>
    <p class="hint">忘れかける直前（想起率90%の地点）に出題されるよう、1枚ずつ次回の日付を計算しています。</p>
  </section>
  <button class="btn warn" id="reset" style="align-self:center">学習記録をリセット</button>
  </div>`;
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{S.filter=b.dataset.f;save();renderDash();});
  $("#go").onclick=startSession;
  $("#reset").onclick=e=>{const b=e.currentTarget;if(b.dataset.c){S.cards={};save();renderDash();}else{b.dataset.c=1;b.textContent="もう一度押すとリセットします";}};
}

/* ---------- OUTPUT: session ---------- */
let sess=null;
function startSession(){
  const now=Date.now(),{due,fresh}=counts(now);
  due.sort((a,b)=>{const ca=S.cards[a.id],cb=S.cards[b.id];return retr((now-ca.last)/DAY,ca.s)-retr((now-cb.last)/DAY,cb.s)});
  const q=[];let i=0,j=0;
  while(i<due.length||j<fresh.length){ if(i<due.length)q.push(due[i++].id); if(i<due.length)q.push(due[i++].id); if(j<fresh.length)q.push(fresh[j++].id); }
  sess={q,total:q.length,done:0,shown:false,tally:[0,0,0,0],t0:Date.now()};
  renderCard();
}
function renderCard(){
  if(!sess.q.length) return renderDone();
  const id=sess.q[0],w=WORDS[id-1],c=S.cards[id],n=S.notes[id],now=Date.now();
  const pv=previews(c,now);
  const isNew=!(c&&c.reps);
  $("#view").innerHTML=`
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="prog"><button id="quit">✕ 終了</button><div class="track"><i style="width:${sess.done/sess.total*100}%"></i></div><span>${sess.done} / ${sess.total}</span></div>
    <section class="card" id="card" aria-live="polite">
      <span class="tagline">${isNew?"NEW":"REVIEW"} · No.${pad(id)}</span>
      ${n?`<span class="badge c-${n.color}"></span>`:""}
      <div class="w">${esc(w.w)}</div>
      ${sess.shown?`<div class="ans">
        <span class="pos">${w.pos}</span>
        <div class="m">${esc(w.m)}</div>
        <div class="ex"><span class="en">${hl(w.en,w.w)}</span><span class="ja">${esc(w.ja)}</span></div>
        ${n&&n.memo?`<div class="memo c-${n.color}">${esc(n.memo)}</div>`:""}
      </div>`:`<div class="tap">意味を思い浮かべてからタップ</div>`}
    </section>
    ${sess.shown?`<div class="grades">
      ${["もう一度","難しい","できた","簡単"].map((l,i)=>`<button class="g g${i+1}" data-g="${i+1}">${l}<small>${fmt(pv[i].ivl)}</small></button>`).join("")}
    </div><div class="kbd">キー 1〜4 でも採点できます</div>`
    :`<button class="btn pri reveal" id="show">答えを見る</button><div class="kbd">スペースキーでも答えを表示</div>`}
  </div>`;
  $("#quit").onclick=()=>{sess=null;renderDash();};
  if(!sess.shown){$("#card").onclick=reveal;$("#show").onclick=reveal;}
  else document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>grade(+b.dataset.g));
}
function reveal(){sess.shown=true;renderCard();}
function grade(g){
  const id=sess.q.shift(),now=Date.now(),pv=previews(S.cards[id],now)[g-1];
  S.cards[id]={s:pv.s,d:pv.d,due:pv.due,last:pv.last,reps:pv.reps,lapses:pv.lapses};save();
  sess.tally[g-1]++;
  if(g===1){sess.q.splice(Math.min(3,sess.q.length),0,id);} else sess.done++;
  sess.shown=false;renderCard();
}
function renderDone(){
  const t=sess.tally,min=Math.max(1,Math.round((Date.now()-sess.t0)/6e4)),acc=sess.total?Math.round((t[1]+t[2]+t[3])/(t[0]+t[1]+t[2]+t[3])*100):0;
  $("#view").innerHTML=`<section class="panel done">
    <h2>おつかれさま</h2>
    <p>${sess.total}語を約${min}分で復習しました。初回正答率 ${acc}%</p>
    <div class="stats" style="width:100%">
      <div class="stat"><b style="color:var(--again)">${t[0]}</b><span>もう一度</span></div>
      <div class="stat"><b style="color:var(--good)">${t[2]+t[1]}</b><span>できた・難しい</span></div>
      <div class="stat"><b style="color:var(--easy)">${t[3]}</b><span>簡単</span></div>
    </div>
    <button class="btn pri" id="back" style="width:100%">ダッシュボードへ</button>
  </section>`;
  $("#back").onclick=()=>{sess=null;renderDash();};
}

