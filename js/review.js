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
const NO_MIN=WORDS.length?Math.min(...WORDS.map(w=>w.no||w.id)):1, NO_MAX=WORDS.length?Math.max(...WORDS.map(w=>w.no||w.id)):1;
S.cfg=Object.assign({forms:["pj"],scope:S.filter||"read",from:NO_MIN,to:NO_MAX,colors:[],target:"due",order:"smart",exam:"",newMode:"auto",newN:15},S.cfg||{});

const keyOf=(skill,id)=>skill==="rec"?id:"p"+id;
const today=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();};
function newToday(){return S.newLog&&S.newLog.d===today()?S.newLog.n:0;}

function scopeWords(){
  const c=S.cfg;
  return WORDS.filter(w=>{
    if(c.scope==="read") return S.read[w.id];
    if(c.scope==="notes"){const n=S.notes[w.id];return n&&(!c.colors.length||c.colors.includes(n.color));}
    if(c.scope==="range"){const n=w.no||w.id;return n>=Math.min(c.from,c.to)&&n<=Math.max(c.from,c.to);}
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
  return [c.target==="all"?"総ざらい":"毎日の復習",c.forms.length>1?`${FORMS[c.forms[0]].label} ほか${c.forms.length-1}`:FORMS[c.forms[0]].label,sc,ORDERS[c.order]];
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

/* ---------- OUTPUT: 設定シート ----------
 * 最初は「いまの設定」を一覧で見せるだけにし、項目をタップしたときだけ選択肢の画面を開く（スマホの設定アプリ型）。
 * 変更はその場で保存され、ダッシュボードにもすぐ反映される。
 */
const SCOPE_SUB={read:"単語帳で開いたページの単語",notes:"付箋を貼った単語",all:"収録されている全単語",range:"番号で範囲を決める"};
const ORDER_SUB={smart:"思い出せる確率が低い語から（おすすめ）",number:"単語帳の番号どおり",random:"毎回ばらばらに",weak:"よく間違える語から"};
const fmtDate=e=>{const d=new Date(e+"T00:00:00");return `${d.getMonth()+1}月${d.getDate()}日`;};
function openSettings(){
  const c=S.cfg;let view="main";
  const check='<svg class="ck2" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3L15 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const row=(k,label,val)=>`<button class="srow" data-go="${k}"><span class="sl">${label}</span><span class="sv">${val}</span><span class="chev" aria-hidden="true">›</span></button>`;
  const opt=(attr,k,label,sub,on)=>`<button class="sopt" data-${attr}="${k}" aria-pressed="${on}"><span><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span>${check}</button>`;
  const stepper=(id,val,lo,hi)=>`<div class="stepper"><button data-step="${id}" data-d="-1" aria-label="減らす">−</button><input id="${id}" type="number" inputmode="numeric" min="${lo}" max="${hi}" value="${val}"><button data-step="${id}" data-d="1" aria-label="増やす">＋</button></div>`;

  function main(){
    const ex=examInfo(Date.now()), lim=counts(Date.now()).limit;
    const forms=c.forms.map(f=>FORMS[f].label);
    const scope=c.scope==="range"?`No.${Math.min(c.from,c.to)}–${Math.max(c.from,c.to)}`:c.scope==="notes"&&c.colors.length?`付箋（${c.colors.map(k=>COLORS[k]).join("・")}）`:SCOPES[c.scope];
    return `
      <div class="smodes">
        ${[["due","毎日の復習","忘れかけた語と今日の新しい単語"],["all","総ざらい","範囲の単語を期限に関係なく全部"]].map(([k,t,d])=>`<button class="smode" data-target="${k}" aria-pressed="${c.target===k}"><b>${t}</b><small>${d}</small></button>`).join("")}
      </div>
      <div class="sgroup">
        ${row("forms","出し方",forms.length>1?`${forms[0]} ほか${forms.length-1}`:forms[0])}
        ${row("scope","範囲",esc(scope))}
        ${row("order","順番",ORDERS[c.order])}
      </div>
      <div class="sgroup">
        ${row("exam","試験日",ex?`${fmtDate(c.exam)}（あと${ex.days}日）`:"未設定")}
        ${row("newn","新しい単語",(c.newMode==="auto"?"自動・":"")+`1日${lim}語`)}
      </div>
      ${ex?`<p class="snote">目標記憶率 ${Math.round(targetR()*100)}%。試験の前日までに全語がもう一度出るよう調整しています。</p>`:""}`;
  }
  const pages={
    forms:["出し方",()=>`
      <p class="snote">複数選べます。英→和と和→英は別々に記録されます。</p>
      <div class="sgroup">${Object.entries(FORMS).map(([k,f])=>opt("form",k,f.label,f.sub,c.forms.includes(k))).join("")}</div>`],
    scope:["範囲",()=>`
      <div class="sgroup">${Object.entries(SCOPES).map(([k,v])=>opt("scope",k,v,SCOPE_SUB[k],c.scope===k)).join("")}</div>
      ${c.scope==="notes"?`<p class="slabel">付箋の色（選ばなければすべて）</p><div class="colors">${Object.entries(COLORS).map(([k,v])=>`<button class="cchip c-${k}" data-color="${k}" aria-pressed="${c.colors.includes(k)}">${v}</button>`).join("")}</div>`:""}
      ${c.scope==="range"?`<p class="slabel">番号</p><div class="srange">${stepper("from",c.from,NO_MIN,NO_MAX)}<span>〜</span>${stepper("to",c.to,NO_MIN,NO_MAX)}</div>`:""}`],
    order:["順番",()=>`<div class="sgroup">${Object.entries(ORDERS).map(([k,v])=>opt("order",k,v,ORDER_SUB[k],c.order===k)).join("")}</div>`],
    exam:["試験日",()=>{const ex=examInfo(Date.now());return `
      <div class="sgroup spad"><input id="exam" class="sdate" type="date" value="${esc(c.exam)}"></div>
      ${c.exam?`<button class="slink" id="noexam">試験日を消す</button>`:""}
      <p class="snote">試験が近づくほど記憶率の目標を上げ、前日までに全語がもう一度出るように間隔を調整します。</p>
      <ol class="rlist">${[["60日より前",90],["60〜31日前",92],["30〜8日前",95],["7日前から",97]].map(([t,r])=>{const on=ex&&Math.round(targetR()*100)===r;return `<li${on?' class="on"':""}><span>${t}</span><b>${r}%</b></li>`}).join("")}</ol>`;}],
    newn:["新しい単語",()=>{const lim=counts(Date.now()).limit;return `
      <div class="sgroup">
        ${opt("newmode","auto","自動",examInfo(Date.now())?"試験の2週間前までに範囲を一巡できるペース":"1日15語。復習が多い日は減らす",c.newMode==="auto")}
        ${opt("newmode","manual","自分で決める","",c.newMode==="manual")}
      </div>
      ${c.newMode==="manual"?`<p class="slabel">1日の語数</p><div class="srange">${stepper("newn",c.newN,0,200)}<span>語</span></div>`:`<p class="snote">今日は${lim}語です。</p>`}`;}]
  };

  function draw(dir){
    const sub=pages[view];
    $("#layer").innerHTML=`<div class="scrim" id="scrim"></div>
    <div class="sheetpanel tall" role="dialog" aria-label="出題設定"><div class="sheetin">
      <div class="shead">
        ${sub?`<button class="sback" id="back" aria-label="設定に戻る">‹ 設定</button>`:"<span></span>"}
        <h3>${sub?sub[0]:"出題設定"}</h3>
        <button class="sdone" id="done">完了</button>
      </div>
      <div class="sbody ${dir||""}">${sub?sub[1]():main()}</div>
    </div></div>`;
    bind();
  }
  const set=(k,v)=>{c[k]=v;save();draw();};
  function bind(){
    $("#scrim").onclick=close;$("#done").onclick=close;
    const bk=$("#back");if(bk)bk.onclick=()=>{view="main";draw("fromleft");};
    document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{view=b.dataset.go;draw("fromright");});
    document.querySelectorAll("[data-target]").forEach(b=>b.onclick=()=>set("target",b.dataset.target));
    document.querySelectorAll("[data-form]").forEach(b=>b.onclick=()=>{const k=b.dataset.form;const f=c.forms.includes(k)?c.forms.filter(x=>x!==k):c.forms.concat(k);if(f.length)set("forms",f);});
    document.querySelectorAll("[data-scope]").forEach(b=>b.onclick=()=>set("scope",b.dataset.scope));
    document.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>{const k=b.dataset.color;set("colors",c.colors.includes(k)?c.colors.filter(x=>x!==k):c.colors.concat(k));});
    document.querySelectorAll("[data-order]").forEach(b=>b.onclick=()=>set("order",b.dataset.order));
    document.querySelectorAll("[data-newmode]").forEach(b=>b.onclick=()=>set("newMode",b.dataset.newmode));
    const key={from:"from",to:"to",newn:"newN"},lim={from:[NO_MIN,NO_MAX],to:[NO_MIN,NO_MAX],newn:[0,200]};
    const put=(id,v)=>{const [lo,hi]=lim[id];v=Math.round(+v);c[key[id]]=Math.min(hi,Math.max(lo,isNaN(v)?lo:v));save();const e=$("#"+id);if(e)e.value=c[key[id]];};
    Object.keys(key).forEach(id=>{const e=$("#"+id);if(e)e.onchange=()=>put(id,e.value);});
    document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{const id=b.dataset.step;put(id,c[key[id]]+(+b.dataset.d));});
    const ed=$("#exam");if(ed)ed.onchange=()=>set("exam",ed.value||"");
    const ne=$("#noexam");if(ne)ne.onclick=()=>set("exam","");
  }
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
  if(it.form==="je") return `<div class="jm">${w.pos?`<span class="pbox">${esc(w.pos)}</span>`:""}${esc(w.m)}</div><div class="hint1">${esc(w.w[0])} ${"＿ ".repeat(w.w.length-1)}<small>${w.w.length}文字</small></div>`;
  return `<div class="cphj big">${mk(w.phj)}</div><div class="cph">${blankWord(w.ph)}</div>`;
}
function answer(it,w,n){
  const memo=n&&n.memo?`<div class="memo c-${n.color}">${esc(n.memo)}</div>`:"";
  const ex=w.en?`<div class="ex"><span class="en">${hl(w.en,w.w)}</span><span class="ja">${esc(w.ja)}</span></div>`:"";
  const ipa=w.ipa||w.mark?`<div class="cipa">${markTag(w.mark)}${w.ipa?`<span class="ipa">[${esc(w.ipa)}]</span>`:""}</div>`:"";
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
      <span class="tagline">${FORMS[it.form].label} · ${isNew?"NEW":"REVIEW"} · No.${w.no||it.id}</span>
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
