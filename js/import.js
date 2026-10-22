/* ---------- 単語データの読み込み ----------
 * 単語帳を書き起こしたテキストを読み取り、アプリのデータに変換する。データはこの端末のブラウザ内だけに保存。
 *
 * 読み取る書式
 *   1行目        タイトル（「動詞」などを含むと品詞として使う）
 *   No.番号 / 英語：… / 日本語：…       … フレーズ。【赤字：…】が赤字（見出し語・訳の強調）
 *   番号. 見出し語（例：1. borrow）      … 見出し語ブロックの始まり
 *   【発音】[…]  【意味】  【名詞の意味】  【活用】  【例文】  【関連表現】  【関連語】
 *   【補足】  【問題】  【答え】  【訳】
 *   ◆ 表現 ＝ 訳   ◇ 派生語（名）＝ 訳   ⇔ 反意語 ＝ 訳   （次の行に続く場合はつなげる）
 */
function parseBook(text){
  const lines=text.replace(/\r/g,"").split("\n");
  const title=(lines.find(s=>s.trim())||"").trim();
  const pos=/形容詞/.test(title)?"形":/副詞/.test(title)?"副":/名詞/.test(title)?"名":/動詞/.test(title)?"動":"";
  const red=s=>s.replace(/【赤字[：:]([^】]*)】/g,"*$1*");
  const phrases={},entries={},order=[];
  let phr=null,cur=null,field=null,m;
  for(const raw of lines){
    const s=raw.trim();
    if(!s){ if(cur&&field&&field!=="items") (cur.f[field]=cur.f[field]||[]).push(""); if(field==="items") field="_"; continue; }
    if((m=s.match(/^No\.?\s*(\d+)$/i))){phr={};phrases[+m[1]]=phr;cur=null;continue;}
    if(phr&&(m=s.match(/^英語[：:]\s*(.*)$/))){phr.en=red(m[1]).trim();continue;}
    if(phr&&(m=s.match(/^日本語[：:]\s*(.*)$/))){phr.ja=red(m[1]).trim();continue;}
    if((m=s.match(/^(\d+)[.．]\s*([A-Za-z][A-Za-z' \-]*)$/))){cur={n:+m[1],w:m[2].trim(),f:{},items:[]};entries[cur.n]=cur;order.push(cur.n);field="_";phr=null;continue;}
    if(/^\d+[.．]\s/.test(s)){cur=null;continue;}          // 章の見出し（「3. 写真内の…」など）で区切る
    if(!cur) continue;
    if((m=s.match(/^【([^】]+)】\s*(.*)$/))){field=m[1];cur.f[field]=cur.f[field]||[];if(m[2])cur.f[field].push(m[2]);continue;}
    if(/^[◆◇⇔]/.test(s)){cur.items.push(s);field="items";continue;}
    if(field==="items"){cur.items[cur.items.length-1]+=" "+s;continue;}
    (cur.f[field]=cur.f[field]||[]).push(s);
  }

  const nonEmpty=a=>(a||[]).filter(x=>x!=="");
  const redify=line=>{
    let pre="";const mm=line.match(/^([①-⑳])\s*/);if(mm){pre=mm[1];line=line.slice(mm[0].length);}
    return pre+line.split(/(（[^）]*）|\([^)]*\)|[、；，,]\s*)/).map(t=>{
      if(!t||/^(（|\()/.test(t)||/^[、；，,]/.test(t)) return t;
      return t.trim()?`*${t.trim()}*`:t;
    }).join("");
  };
  const item=s=>{
    const k=s[0];let body=s.slice(1).trim(),p="";
    body=body.replace(/（(名|形|副|前|接|動)）/,(x,q)=>{p=q;return "";}).replace(/\s+/g," ").trim();
    const i=body.indexOf("＝");let en=body,ja="";
    if(i>=0){en=body.slice(0,i).trim();ja=body.slice(i+1).trim();}
    if(k==="◇") return `◇ ${en}${(p||ja)?" ":""}${p?`[${p}]`:""}${ja}`;
    return `${k} ${en}${p?` [${p}]`:""}${ja?` 「${ja}」`:""}`;
  };
  const pairs=arr=>{ // 「英 ＝ 和」または「英（複数行）」→「＝ 和」をまとめる
    const out=[];let buf=[];
    const flush=()=>{if(buf.length){out.push({en:buf.join(" / "),ja:""});buf=[];}};
    for(const s of arr||[]){
      if(s===""){flush();continue;}
      if(/^[＝=]\s*/.test(s)){out.push({en:buf.join(" / "),ja:s.replace(/^[＝=]\s*/,"")});buf=[];continue;}
      const i=s.indexOf("＝");
      if(i>=0){flush();out.push({en:s.slice(0,i).trim(),ja:s.slice(i+1).trim()});continue;}
      buf.push(s);
    }
    flush();return out;
  };

  const words=[],warn=[];
  order.sort((a,b)=>a-b).forEach((n,idx)=>{
    const e=entries[n],f=e.f,p=phrases[n];
    const mean=nonEmpty(f["意味"]),noun=nonEmpty(f["名詞の意味"]);
    let d=mean.map(redify).join("　");
    if(noun.length) d+=(d?"　":"")+"[名]"+noun.join("；");
    const m=(mean.length?mean:noun).map(s=>s.replace(/^[①-⑳]\s*/,"")).join("；")||e.w;
    const l=e.items.map(item);
    nonEmpty(f["活用"]).forEach(s=>l.push(`★ 活用：${s}`));
    nonEmpty(f["補足"]).forEach(s=>l.push(`★ ${s}`));
    const ex=pairs(f["例文"]);
    ex.concat(pairs(f["関連表現"]),pairs(f["関連語"])).forEach(x=>l.push(`▷ ${x.en}${x.ja?` 「${x.ja}」`:""}`));
    const qs=nonEmpty(f["問題"]);
    const ans=nonEmpty(f["答え"]).join(" / ")+(nonEmpty(f["訳"]).length?`（訳：${nonEmpty(f["訳"]).join(" ")}）`:"");
    const sent=ex.find(x=>/\s/.test(x.en)&&/[.!?]$/.test(x.en))||ex[0];
    const tags=[];
    if(mean.some(s=>/^[①-⑳]/.test(s)))tags.push("多義");
    if(l.some(s=>s.startsWith("＝")))tags.push("同?");
    if(l.some(s=>s.startsWith("⇔")))tags.push("反?");
    if(!p) warn.push(`No.${n} ${e.w}：フレーズがありません`);
    if(!mean.length&&!noun.length) warn.push(`No.${n} ${e.w}：意味がありません`);
    words.push({id:idx+1,no:n,w:e.w,pos,m,d,l,q:qs.length?[qs.join(" "),ans]:null,
      ipa:(nonEmpty(f["発音"])[0]||"").replace(/^\[|\]$/g,""),mark:"",tags,
      ph:p&&p.en?p.en:`*${e.w}*`,phj:p&&p.ja?p.ja:`*${m}*`,
      en:sent?sent.en:"",ja:sent?sent.ja:""});
  });
  Object.keys(phrases).forEach(n=>{if(!entries[n])warn.push(`No.${n}：フレーズだけで見出し語ブロックがありません`);});
  return {title,words,warn,stats:{phrases:Object.keys(phrases).length,questions:words.filter(w=>w.q).length}};
}

/* サンプル（書式の確認用。内容はアプリ用に書いたもの） */
const SAMPLE=`サンプル（動詞）

No.1
英語：【赤字：borrow】 a book 【赤字：from】 the library
日本語：図書館から本を【赤字：借りる】

No.2
英語：【赤字：explain】 the rules
日本語：ルールを【赤字：説明する】

No.3
英語：【赤字：arrive】 【赤字：at】 the station
日本語：駅に【赤字：着く】

1. borrow
【発音】[bárou]
【意味】
〜を借りる
⇔ lend ＝ 〜を貸す
◆ borrow A from B ＝ BからAを借りる
【補足】
お金を払って借りるときは rent を使う。

2. explain
【発音】[ikspléin]
【意味】
〜を説明する
◇ explanation（名）＝ 説明
【問題】
Explain me the rules. の誤りは？
【答え】
explain は人を目的語にとらない。Explain the rules to me. が正しい。

3. arrive
【発音】[əráiv]
【意味】
①着く、到着する
②（結論などに）達する
◆ arrive at [in] A ＝ Aに着く
◇ arrival（名）＝ 到着
`;

/* 解析済みデータを保存して起動し直す（学習記録・付箋はリセット） */
function applyBook(parsed){
  try{localStorage.setItem(DATA_KEY,JSON.stringify({title:parsed.title,words:parsed.words,at:Date.now()}));}catch(e){return false;}
  const nos=parsed.words.map(w=>w.no);
  Object.assign(S,{cards:{},notes:{},read:{},checks:{},pos:0,page:0,newLog:null,mode:"in"});
  S.cfg=Object.assign(S.cfg||{},{from:Math.min(...nos),to:Math.max(...nos),scope:"read"});
  save();location.reload();return true;
}

/* data/ に登録された単語データを取得して解析 */
async function fetchBook(b){
  const r=await fetch(b.file,{cache:"no-cache"});
  if(!r.ok) throw new Error(r.status);
  return await r.text();
}

/* 単語が未登録の端末では、登録済みの先頭データを自動で読み込む（失敗したら読み込み画面） */
async function autoLoad(){
  if(!BOOKS.length) return renderImport();
  $("#view").innerHTML=`<div class="dash"><p class="hint" style="text-align:center">単語データを読み込んでいます…</p></div>`;
  try{const p=parseBook(await fetchBook(BOOKS[0]));if(p.words.length&&applyBook(p))return;}catch(e){}
  renderImport();
}

/* 読み込み画面 */
function renderImport(back){
  RedSheet.unmount();
  const has=WORDS.length>0;
  let parsed=null;
  const draw=()=>{
    $("#view").innerHTML=`<div class="dash">
      <div class="vhead"><h1>単語データ</h1></div>
      ${parsed?`
      <section class="panel">
        <span class="lbl">読み込み結果</span>
        <h2 class="imtitle">${esc(parsed.title)}</h2>
        <div class="stats">
          <div class="stat"><b>${parsed.words.length}</b><span>見出し語</span></div>
          <div class="stat"><b>${parsed.stats.phrases}</b><span>フレーズ</span></div>
          <div class="stat"><b>${parsed.stats.questions}</b><span>Q&amp;A</span></div>
        </div>
        ${parsed.words.length?`<p class="hint">${parsed.words.slice(0,8).map(w=>esc(w.w)).join("、")}${parsed.words.length>8?" ほか":""}</p>`:""}
        ${parsed.warn.length?`<div class="warn"><b>確認してください（${parsed.warn.length}件）</b>${parsed.warn.slice(0,6).map(s=>`<span>${esc(s)}</span>`).join("")}${parsed.warn.length>6?`<span>ほか${parsed.warn.length-6}件</span>`:""}</div>`:""}
        ${parsed.words.length?`<button class="btn pri" id="apply">${has?"この内容に置き換える":"この内容で始める"}</button>
        ${has?`<p class="hint">今の単語と学習記録・付箋・チェックは消えます。</p>`:""}`:`<p class="hint">見出し語（「1. follow」のような行）が見つかりませんでした。書式を確認してください。</p>`}
        <button class="btn ghost" id="redo">選び直す</button>
      </section>`:`
      <section class="panel">
        <p class="imintro">単語帳を書き起こしたテキストファイルを選ぶか、下に貼り付けてください。データはこの端末のブラウザ内だけに保存され、どこにも送信されません。</p>
        <label class="btn pri filebtn">テキストファイルを選ぶ<input id="file" type="file" accept=".txt,text/plain"></label>
        <textarea id="paste" placeholder="ここに貼り付けることもできます"></textarea>
        <button class="btn ghost" id="read">貼り付けた内容を読み込む</button>
      </section>
      ${BOOKS.length?`<section class="panel">
        <span class="lbl">登録済みの単語データ</span>
        ${BOOKS.map((b,i)=>`<button class="btn pri" data-book="${i}">${esc(b.title)}</button>`).join("")}
      </section>`:""}
      <section class="panel">
        <span class="lbl">書式</span>
        <pre class="fmt">No.1
英語：【赤字：borrow】 a book 【赤字：from】 the library
日本語：図書館から本を【赤字：借りる】

1. borrow
【発音】[bárou]
【意味】
〜を借りる
◆ borrow A from B ＝ BからAを借りる
⇔ lend ＝ 〜を貸す
【問題】 …   【答え】 …</pre>
        <button class="btn ghost" id="sample">サンプル（3語）で試す</button>
      </section>
      ${has||back?`<button class="btn warn" id="cancel" style="align-self:center;width:auto">戻る</button>`:""}`}
    </div>`;
    const go=t=>{parsed=parseBook(t);draw();};
    const fi=$("#file");if(fi)fi.onchange=()=>{const f=fi.files[0];if(!f)return;const r=new FileReader();r.onload=()=>go(String(r.result));r.readAsText(f,"utf-8");};
    const rd=$("#read");if(rd)rd.onclick=()=>{const t=$("#paste").value;if(t.trim())go(t);};
    const sm=$("#sample");if(sm)sm.onclick=()=>go(SAMPLE);
    const cc=$("#cancel");if(cc)cc.onclick=()=>render();
    const rr=$("#redo");if(rr)rr.onclick=()=>{parsed=null;draw();};
    const ap=$("#apply");if(ap)ap.onclick=()=>{if(!applyBook(parsed))ap.textContent="保存できませんでした（ブラウザの保存領域を確認してください）";};
    document.querySelectorAll("[data-book]").forEach(b=>b.onclick=async()=>{
      const t=b.textContent;b.disabled=true;b.textContent="読み込み中…";
      try{go(await fetchBook(BOOKS[+b.dataset.book]));}catch(e){b.disabled=false;b.textContent=t+"（読み込めませんでした）";}
    });
  };
  draw();
}
