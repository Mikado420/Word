/* ---------- OUTPUT: 出題設定 ----------
 * 出し方は4種類。英→和の2種（rec）と和→英の2種（pro）はそれぞれ別の記憶として別々にスケジュールする。
 * 同じ向きで複数の出し方を選んだときは、毎回どちらかをランダムに使う（同じ形ばかりで覚えたつもりになるのを防ぐ）。
 */
const FORMS={
  ej:{label:"英 → 和",sub:"見出し語から意味",skill:"rec"},
  pj:{label:"フレーズ → 和",sub:"ミニマルフレーズから意味",skill:"rec"},
  je:{label:"和 → 英",sub:"意味から英単語（頭文字ヒント）",skill:"pro"},
  jp:{label:"和フレーズ → 英",sub:"フレーズの訳から英単語",skill:"pro"}
};
const SCOPES={read:"読んだ単語",notes:"付箋",all:"すべて",range:"番号で指定"};
const TARGETS={due:"復習が必要な語",all:"範囲をすべて"};
const ORDERS={smart:"忘れかけ順",number:"番号順",random:"ランダム",weak:"苦手順"};
S.cfg=Object.assign({forms:["pj"],scope:S.filter||"read",from:1,to:WORDS.length,colors:[],target:"due",order:"smart",exam:"",newMode:"auto",newN:15},S.cfg||{});

const keyOf=(skill,id)=>skill==="rec"?id:"p"+id;
const today=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();};
function newToday(){return S.newLog&&S.newLog.d===today()?S.newLog.n:0;}

function scopeWords(){
  const c=S.cfg;
  return WORDS.filter(w=>{
    if(c.scope==="read") return S.read[w.id];
    if(c.scope==="notes"){const n=S.notes[w.id];return n&&(!c.colors.length||c.colors.includes(n.color));}
    if(c.scope==="range") return w.id>=Math.min(c.from,c.to)&&w.id<=Math.max(c.from,c.to);
    return true;
  });
}
function skills(){return [...new Set(S.cfg.forms.map(f=>FORMS[f].skill))];}
function items(){const sk=skills();return scopeWords().flatMap(w=>sk.map(s=>({id:w.id,skill:s,key:keyOf(s,w.id)})));}

/* 1日の新出語数：試験日があれば「試験の2週間前までに全語を一巡」できる数を自動で計算。復習が溜まっている日は控えめに */
function newLimit(now,unseen,dueN){
  let n;
  if(S.cfg.newMode==="manual") n=Math.max(0,+S.cfg.newN||0);
  else{
    const ex=examInfo(now);
    n=ex?Math.ceil(unseen/Math.max(1,ex.days-14)):15;
    n=Math.min(60,Math.max(5,n));
    if(dueN>120) n=Math.min(n,5);
  }
  return n;
}
function counts(now){
  const all=items();
  const due=all.filter(it=>{const c=S.cards[it.key];return c&&c.reps&&c.due<=now;});
  const unseen=all.filter(it=>!(S.cards[it.key]&&S.cards[it.key].reps));
  const limit=newLimit(now,unseen.length,due.length);
  const left=Math.max(0,limit-newToday());
  return {all,due,unseen,fresh:unseen.slice().sort((a,b)=>(S.read[b.id]?1:0)-(S.read[a.id]?1:0)||a.id-b.id).slice(0,left),limit};
}
const R_=(it,now)=>{const c=S.cards[it.key];return c&&c.reps?retr(Math.max(0,(now-c.last)/DAY),c.s):1;};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
function sortItems(list,now){
  const o=S.cfg.order;
  if(o==="number") return list.sort((a,b)=>a.id-b.id||(a.skill<b.skill?-1:1));
  if(o==="random") return shuffle(list);
  if(o==="weak") return list.sort((a,b)=>{const ca=S.cards[a.key]||{},cb=S.cards[b.key]||{};return (cb.lapses||0)-(ca.lapses||0)||(cb.d||0)-(ca.d||0)||R_(a,now)-R_(b,now);});
  return list.sort((a,b)=>R_(a,now)-R_(b,now)); // smart：思い出せる確率が低い順
}
function buildQueue(now){
  const {all,due,fresh}=counts(now);
  if(S.cfg.target==="all"){
    const seen=sortItems(all.filter(it=>S.cards[it.key]&&S.cards[it.key].reps),now);
    const un=all.filter(it=>!(S.cards[it.key]&&S.cards[it.key].reps));
    return S.cfg.order==="smart"||S.cfg.order==="weak"?seen.concat(un):sortItems(all,now);
  }
  if(S.cfg.order!=="smart") return sortItems(due.concat(fresh),now);
  const d=sortItems(due,now),q=[];let i=0,j=0;   // 復習2枚ごとに新出1枚を混ぜる
  while(i<d.length||j<fresh.length){if(i<d.length)q.push(d[i++]);if(i<d.length)q.push(d[i++]);if(j<fresh.length)q.push(fresh[j++]);}
  return q;
}
/* 同じ単語の英→和と和→英が続くと片方の答えがもう片方のヒントになるので、4枚以上離す */
function spread(q,gap=4){
  const out=[],wait=[];
  const ok=it=>!out.slice(-gap).some(o=>o.id===it.id);
  for(const it of q){
    const k=wait.findIndex(ok); if(k>=0) out.push(wait.splice(k,1)[0]);
    if(ok(it)) out.push(it); else wait.push(it);
  }
  while(wait.length){const k=wait.findIndex(ok);out.push(wait.splice(k>=0?k:0,1)[0]);}
  return out;
}
function cfgSummary(){
  const c=S.cfg;
  const sc=c.scope==="range"?`No.${Math.min(c.from,c.to)}–${Math.max(c.from,c.to)}`:SCOPES[c.scope];
  return [c.forms.map(f=>FORMS[f].label).join("・"),sc,TARGETS[c.target],ORDERS[c.order]];
}

/* ---------- OUTPUT: dashboard ---------- */
function renderDash(){
  setTimeout(()=>Updater.apply(),0);
  const now=Date.now(),{due,fresh,unseen,limit}=counts(now),ex=examInfo(now);
  const qn=S.cfg.target==="all"?items().length:due.length+fresh.length;
  const learned=Object.keys(S.cards).filter(k=>S.cards[k].reps);
  const mature=WORDS.filter(w=>S.cards[w.id]&&S.cards[w.id].s>=21).length;
  const avgR=learned.length?learned.reduce((a,k)=>{const c=S.cards[k];return a+retr(Math.max(0,(now-c.last)/DAY),c.s)},0)/learned.length:0;
  const t0=new Date();t0.setHours(0,0,0,0);
  const fc=[...Array(7)].map((_,i)=>{const a=t0.getTime()+i*DAY,b=a+DAY;return learned.filter(k=>{const d=S.cards[k].due;return i===0?d<b:d>=a&&d<b}).length});
  const mx=Math.max(1,...fc),wd="日月火水木金土";
  $("#view").innerHTML=`
  <div class="dash">
  <div class="vhead"><h1>今日の復習</h1></div>
  ${ex?`<section class="exam"><div><b>${ex.days}</b><span>日</span></div><p>入試まで。いまの目標記憶率 <b>${Math.round(targetR()*100)}%</b>、新しい単語は1日 <b>${limit}</b>語のペースです。</p></section>`:""}
  <section class="panel">
    <div class="stats">
      <div class="stat due"><b>${due.length}</b><span>復習</span></div>
      <div class="stat"><b>${fresh.length}<small>/${limit}</small></b><span>今日の新出</span></div>
      <div class="stat"><b>${mature}<small>/${WORDS.length}</small></b><span>定着した単語</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;justify-content:space-between"><span class="lbl">いまの記憶保持率（推定）</span><span style="font-size:13px;font-variant-numeric:tabular-nums">${learned.length?Math.round(avgR*100)+"%":"—"}</span></div>
      <div class="retbar"><i style="width:${Math.round(avgR*100)}%"></i></div>
    </div>
    <button class="cfgline" id="cfg"><span class="lbl">出題設定</span><span class="chips">${cfgSummary().map(t=>`<span>${esc(t)}</span>`).join("")}</span><span class="chev" aria-hidden="true">›</span></button>
    <button class="btn pri start" id="go" ${qn?"":"disabled"}>${qn?`はじめる（${qn}枚）`:(unseen.length||S.cfg.scope!=="read"?"今日の分は完了":"まず単語帳で読んだ単語が出題されます")}</button>
  </section>
  <section class="panel">
    <span class="lbl">これから7日間の復習予定</span>
    <div class="fc">${fc.map((n,i)=>`<div class="fcb"><em>${n||""}</em><i class="${n?"":"z"}" style="height:${Math.round(n/mx*56)}px"></i><span>${i===0?"今日":wd[(t0.getDay()+i)%7]}</span></div>`).join("")}</div>
    <p class="hint">忘れかける直前に出題されるよう、1枚ずつ次回の日付を計算しています。${ex?"試験日の前日までに全語がもう一度出るように調整します。":""}</p>
  </section>
  <button class="btn warn" id="reset" style="align-self:center;width:auto">学習記録をリセット</button>
  </div>`;
  $("#go").onclick=startSession;
  $("#cfg").onclick=openSettings;
  $("#reset").onclick=e=>{const b=e.currentTarget;if(b.dataset.c){S.cards={};S.newLog=null;save();renderDash();}else{b.dataset.c=1;b.textContent="もう一度押すとリセットします";}};
}

/* ---------- OUTPUT: 設定シート ---------- */
function openSettings(){
  const c=S.cfg;
  const seg=(name,map,cur)=>`<div class="seg" role="group">${Object.entries(map).map(([k,v])=>`<button data-${name}="${k}" aria-pressed="${cur===k}">${v}</button>`).join("")}</div>`;
  const draw=()=>{
    const ex=examInfo(Date.now());
    $("#layer").innerHTML=`<div class="scrim" id="scrim"></div>
    <div class="sheetpanel tall" role="dialog" aria-label="出題設定"><div class="sheetin">
      <div class="shead"><h3>出題設定</h3><button class="btn pri" id="done" style="flex:none;padding:8px 16px">完了</button></div>

      <div class="fset"><span class="lbl">出し方（複数選べます）</span>
        <div class="forms">${Object.entries(FORMS).map(([k,f])=>`<button class="form" data-form="${k}" aria-pressed="${c.forms.includes(k)}"><b>${f.label}</b><small>${f.sub}</small></button>`).join("")}</div>
        <p class="hint">英→和と和→英は別々に記録・スケジュールされます。同じ向きを2つ選ぶと毎回どちらかの形で出ます。</p>
      </div>

      <div class="fset"><span class="lbl">出題範囲</span>${seg("scope",SCOPES,c.scope)}
        ${c.scope==="notes"?`<div class="colors">${Object.entries(COLORS).map(([k,v])=>`<button class="cchip c-${k}" data-color="${k}" aria-pressed="${c.colors.includes(k)}">${v}</button>`).join("")}</div><p class="hint">色を選ばなければ、すべての付箋が対象です。</p>`:""}
        ${c.scope==="range"?`<div class="range"><label>No.<input id="from" type="number" inputmode="numeric" min="1" max="${WORDS.length}" value="${c.from}"></label><span>〜</span><label>No.<input id="to" type="number" inputmode="numeric" min="1" max="${WORDS.length}" value="${c.to}"></label></div>`:""}
      </div>

      <div class="fset"><span class="lbl">出題する語</span>${seg("target",TARGETS,c.target)}
        <p class="hint">${c.target==="due"?"忘れかけた語と今日の新出だけを出します（普段の学習向け）。":"期限に関係なく範囲内を全部出します（テスト前の総ざらい向け）。結果は通常の記録にも反映されます。"}</p>
      </div>

      <div class="fset"><span class="lbl">順番</span>${seg("order",ORDERS,c.order)}</div>

      <div class="fset"><span class="lbl">試験日</span>
        <div class="range"><input id="exam" type="date" value="${esc(c.exam)}">${c.exam?`<button class="btn ghost" id="noexam" style="flex:none;padding:8px 12px">クリア</button>`:""}</div>
        <p class="hint">${ex?`入試まで${ex.days}日。目標記憶率は${Math.round(targetR()*100)}%です（60日前まで90%→30日前92%→7日前95%→直前97%）。`:"設定すると、直前期ほど記憶率の目標を上げ、試験の前日までに全語がもう一度出るよう調整します。"}</p>
      </div>

      <div class="fset"><span class="lbl">1日の新しい単語</span>${seg("newmode",{auto:"自動",manual:"手動"},c.newMode)}
        ${c.newMode==="manual"?`<div class="range"><input id="newn" type="number" inputmode="numeric" min="0" max="200" value="${c.newN}"><span>語 / 日</span></div>`:`<p class="hint">${ex?"試験の2週間前までに範囲を一巡できる数を毎日計算します。":"1日15語。"}復習が溜まっている日は自動で減らします。</p>`}
      </div>
    </div></div>`;
    const set=(k,v)=>{c[k]=v;save();draw();};
    $("#scrim").onclick=close;$("#done").onclick=close;
    document.querySelectorAll("[data-form]").forEach(b=>b.onclick=()=>{const k=b.dataset.form;const f=c.forms.includes(k)?c.forms.filter(x=>x!==k):c.forms.concat(k);if(f.length)set("forms",f);});
    document.querySelectorAll("[data-scope]").forEach(b=>b.onclick=()=>set("scope",b.dataset.scope));
    document.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>{const k=b.dataset.color;set("colors",c.colors.includes(k)?c.colors.filter(x=>x!==k):c.colors.concat(k));});
    document.querySelectorAll("[data-target]").forEach(b=>b.onclick=()=>set("target",b.dataset.target));
    document.querySelectorAll("[data-order]").forEach(b=>b.onclick=()=>set("order",b.dataset.order));
    document.querySelectorAll("[data-newmode]").forEach(b=>b.onclick=()=>set("newMode",b.dataset.newmode));
    const num=(id,k,lo,hi)=>{const e=$("#"+id);if(e)e.onchange=()=>{const v=Math.round(+e.value);c[k]=Math.min(hi,Math.max(lo,isNaN(v)?lo:v));save();e.value=c[k];};};
    num("from","from",1,WORDS.length);num("to","to",1,WORDS.length);num("newn","newN",0,200);
    const ed=$("#exam");ed.onchange=()=>set("exam",ed.value||"");
    const ne=$("#noexam");if(ne)ne.onclick=()=>set("exam","");
  };
  const close=()=>{$("#layer").innerHTML="";renderDash();};
  draw();
}

/* ---------- OUTPUT: session ---------- */
let sess=null;
function startSession(){
  const now=Date.now();
  const q=spread(buildQueue(now)).map(it=>{const fs=S.cfg.forms.filter(f=>FORMS[f].skill===it.skill);return Object.assign({},it,{form:fs[Math.random()*fs.length|0]});});
  sess={q,total:q.length,done:0,shown:false,tally:[0,0,0,0],first:{},t0:Date.now()};
  renderCard();
}
const blankWord=ph=>esc(ph).replace(/\*(.+?)\*/,(m,g)=>`<b class="blank">${g[0]}${"＿".repeat(Math.max(1,g.length-1))}</b>`).replace(/\*/g,"");
function front(it,w){
  if(it.form==="ej") return `<div class="w">${esc(w.w)}</div>`;
  if(it.form==="pj") return `<div class="w">${esc(w.w)}</div><div class="cph">${mk(w.ph)}</div>`;
  if(it.form==="je") return `<div class="jm"><span class="pbox">${esc(w.pos)}</span>${esc(w.m)}</div><div class="hint1">${esc(w.w[0])} ${"＿ ".repeat(w.w.length-1)}<small>${w.w.length}文字</small></div>`;
  return `<div class="cphj big">${mk(w.phj)}</div><div class="cph">${blankWord(w.ph)}</div>`;
}
function answer(it,w,n){
  const memo=n&&n.memo?`<div class="memo c-${n.color}">${esc(n.memo)}</div>`:"";
  const ex=`<div class="ex"><span class="en">${hl(w.en,w.w)}</span><span class="ja">${esc(w.ja)}</span></div>`;
  const ipa=`<div class="cipa">${markTag(w.mark)}<span class="ipa">[${esc(w.ipa)}]</span></div>`;
  if(FORMS[it.form].skill==="rec") return `<div class="ans">
    ${it.form==="ej"?`<div class="cph">${mk(w.ph)}</div>`:""}
    <div class="cphj">${mk(w.phj)}</div>
    <div class="cmn"><span class="m def">${fmtDef(w.d)}</span></div>${ipa}${ex}${memo}</div>`;
  return `<div class="ans"><div class="w">${esc(w.w)}</div>${ipa}
    <div class="cph">${mk(w.ph)}</div>
    <div class="cmn"><span class="m def">${fmtDef(w.d)}</span></div>${ex}${memo}</div>`;
}
function renderCard(){
  if(!sess.q.length) return renderDone();
  const it=sess.q[0],w=WORDS[it.id-1],c=S.cards[it.key],n=S.notes[it.id],now=Date.now();
  const pv=previews(c,now), isNew=!(c&&c.reps), rec=FORMS[it.form].skill==="rec";
  $("#view").innerHTML=`
  <div class="rv">
    <div class="prog"><div class="track"><i style="width:${sess.total?sess.done/sess.total*100:0}%"></i></div><span>${sess.done} / ${sess.total}</span></div>
    <section class="card" id="card" aria-live="polite">
      <span class="tagline">${FORMS[it.form].label} · ${isNew?"NEW":"REVIEW"} · No.${pad(it.id)}</span>
      ${n?`<span class="badge c-${n.color}"></span>`:""}
      ${front(it,w)}
      ${sess.shown?answer(it,w,n):`<div class="tap">${rec?"意味を思い浮かべてからタップ":"英語を思い浮かべてからタップ"}</div>`}
    </section>
    ${sess.shown?`<div class="grades">
      ${["もう一度","難しい","できた","簡単"].map((l,i)=>`<button class="g g${i+1}" data-g="${i+1}">${l}<small>${fmt(pv[i].ivl)}</small></button>`).join("")}
    </div><div class="kbd">キー 1〜4 でも採点できます</div>`
    :`<button class="btn pri reveal" id="show">答えを見る</button><div class="kbd">スペースキーでも答えを表示</div>`}
  </div>`;
  if(!sess.shown){$("#card").onclick=reveal;$("#show").onclick=reveal;}
  else document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>grade(+b.dataset.g));
}
function reveal(){sess.shown=true;renderCard();}
function grade(g){
  const it=sess.q.shift(),now=Date.now(),old=S.cards[it.key],pv=previews(old,now)[g-1];
  if(!(old&&old.reps)){const t=today();S.newLog=S.newLog&&S.newLog.d===t?{d:t,n:S.newLog.n+1}:{d:t,n:1};}
  S.cards[it.key]={s:pv.s,d:pv.d,due:pv.due,last:pv.last,reps:pv.reps,lapses:pv.lapses};save();
  sess.tally[g-1]++;
  const fk=it.key+"";if(!(fk in sess.first))sess.first[fk]=g;
  if(g===1){sess.q.splice(Math.min(3,sess.q.length),0,it);} else sess.done++;
  sess.shown=false;renderCard();
}
function renderDone(){
  const t=sess.tally,min=Math.max(1,Math.round((Date.now()-sess.t0)/6e4));
  const f=Object.values(sess.first),acc=f.length?Math.round(f.filter(g=>g>1).length/f.length*100):0;
  $("#view").innerHTML=`<div class="dash"><div class="vhead"></div><section class="panel done">
    <h2>おつかれさま</h2>
    <p>${sess.total}枚を約${min}分で復習しました。初回正答率 ${acc}%</p>
    <div class="stats" style="width:100%">
      <div class="stat"><b style="color:var(--again)">${t[0]}</b><span>もう一度</span></div>
      <div class="stat"><b style="color:var(--good)">${t[2]+t[1]}</b><span>できた・難しい</span></div>
      <div class="stat"><b style="color:var(--easy)">${t[3]}</b><span>簡単</span></div>
    </div>
    <button class="btn pri" id="back" style="width:100%">ダッシュボードへ</button>
  </section></div>`;
  $("#back").onclick=()=>{sess=null;renderDash();};
}
