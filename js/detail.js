/* ---------- 詳細データ（見出し語ブロック） ----------
 * d : 語義。*…* は赤字（赤シートで消える部分）、[名][動][形][副] は品詞の囲み
 * l : 補足行。先頭の記号で種類が決まる
 *     ◆ 熟語・構文  ◇ 派生語  ＝ 同意語  ⇔ 反意語  ★ 注意
 *     「…」で囲んだ部分は右寄せの訳として表示
 * q : [問い, 答え]（答えは赤シートで隠れる）
 */
const DETAIL={
abandon:{d:"〜を*捨てる*，*見捨てる*；(計画など)を*断念する*",l:["＝ give up","◇ abandonment [名]放棄"]},
acquire:{d:"〜を*獲得する*；(知識・技能)を*習得する*",l:["◇ acquisition [名]獲得，習得","◆ an acquired taste 「だんだん好きになるもの」"]},
adequate:{d:"(目的に)*十分な*，*適切な*",l:["＝ sufficient, enough","⇔ inadequate 「不十分な」","◆ be adequate for A 「Aに十分である」"]},
anticipate:{d:"〜を*予期する*，*予想する*",l:["＝ expect","◇ anticipation [名]予想，期待","★ 後ろに動詞を続けるときは doing の形"]},
apparent:{d:"①*明らかな* ②*見かけの*，外見上の",l:["◆ It is apparent that 〜 「〜は明らかだ」","◇ apparently [副]見たところ（〜らしい）"],q:["apparently の訳し方で注意する点は？","「明らかに」より「見たところ〜らしい」の意味が多い"]},
approach:{d:"[名]①*取り組み方*，方法 ②接近　[動]〜に*近づく*",l:["◆ an approach to A 「Aへの取り組み方」"],q:["We approached to the station. の誤りは？","approach は他動詞なので to は不要"]},
assume:{d:"①〜と*思い込む*，*仮定する* ②(責任など)を*引き受ける*",l:["◇ assumption [名]仮定，思い込み","◆ assuming that 〜 「〜と仮定すれば」"]},
attribute:{d:"[動]AをBの*せいにする*，Bの*おかげと考える*　[名]特性，属性",l:["◆ attribute A to B 「AをBのせいにする」","★ 動詞は後ろ，名詞は前にアクセント"]},
cease:{d:"*終わる*；〜を*やめる*",l:["◆ cease to V / cease Ving 「Vしなくなる」","◇ ceaseless [形]絶え間ない","★ -se は [s] と読む（[z] ではない）"]},
coherent:{d:"(話・考えが)*首尾一貫した*，筋の通った",l:["⇔ incoherent 「支離滅裂な」","◇ coherence [名]一貫性"]},
comprehend:{d:"〜を*理解する*",l:["＝ understand","◇ comprehension [名]理解","◇ comprehensive [形]包括的な"],q:["comprehensive と comprehensible の違いは？","comprehensive は「包括的な」，comprehensible は「理解できる」"]},
conceive:{d:"①〜を*思いつく*，*想像する* ②(子)を宿す",l:["◆ conceive of A 「Aを想像する」","◇ concept [名]概念","◇ conception [名]構想"]},
consequence:{d:"①*結果*，*影響* ②*重要性*",l:["◆ as a consequence 「結果として」","◆ of no consequence 「重要でない」","◇ consequently [副]その結果"]},
considerable:{d:"*かなりの*，相当な",l:["◇ considerably [副]かなり"],q:["considerate との違いは？","considerate は「思いやりのある」"]},
contradict:{d:"①〜と*矛盾する* ②〜に*反論する*",l:["◇ contradiction [名]矛盾","◇ contradictory [形]矛盾した"]},
convey:{d:"①〜を*伝える* ②〜を*運ぶ*",l:["◆ convey A to B 「AをBに伝える」"]},
crucial:{d:"*決定的に重要な*",l:["＝ vital, essential","◆ be crucial to A 「Aにとって極めて重要だ」"]},
decline:{d:"[動]①*減少する*，衰える ②〜を*断る*　[名]減少，衰退",l:["◆ decline to V 「Vすることを断る」","◆ be on the decline 「減少している」","＝ refuse （断る）"]},
deliberate:{d:"[形]①*意図的な*，故意の ②*慎重な*　[動]熟考する",l:["◇ deliberately [副]わざと","★ 形容詞は -rət，動詞は -rèɪt と語尾の発音が変わる"]},
derive:{d:"①〜を*引き出す*，*得る* ②*由来する*",l:["◆ derive A from B 「BからAを得る」","◆ derive from A 「Aに由来する」"]},
distinguish:{d:"〜を*区別する*，見分ける",l:["◆ distinguish A from B 「AとBを区別する」","◆ distinguish between A and B 「AとBを区別する」","◇ distinguished [形]著名な"]},
elaborate:{d:"[形]*精巧な*，手の込んだ　[動]*詳しく述べる*",l:["◆ elaborate on A 「Aについて詳しく述べる」","★ 形容詞は -rət，動詞は -rèɪt"]},
eliminate:{d:"〜を*取り除く*，*除去する*",l:["◆ eliminate A from B 「BからAを取り除く」","◇ elimination [名]除去"]},
emerge:{d:"*現れる*；(事実が)*明らかになる*",l:["◇ emergence [名]出現"],q:["emergence と emergency の違いは？","emergence は「出現」，emergency は「緊急事態」"]},
enhance:{d:"(質・価値など)を*高める*",l:["＝ improve","◇ enhancement [名]向上"]},
evaluate:{d:"〜を*評価する*",l:["＝ assess","◇ evaluation [名]評価"]},
evident:{d:"*明白な*，明らかな",l:["＝ obvious, clear","◆ It is evident that 〜 「〜は明白だ」","◇ evidence [名]証拠"]},
exaggerate:{d:"(〜を)*誇張する*，大げさに言う",l:["◇ exaggeration [名]誇張","★ 綴りは g が2つ，発音は [ɡz]"]},
feasible:{d:"*実行可能な*，実現できる",l:["◇ feasibility [名]実現可能性"]},
fundamental:{d:"*根本的な*，*基本的な*",l:["＝ basic","◆ be fundamental to A 「Aにとって不可欠だ」","◇ fundamentally [副]根本的に"]},
hypothesis:{d:"*仮説*",l:["★ 複数形は hypotheses","◇ hypothetical [形]仮定の"]},
imply:{d:"〜を*暗に意味する*，ほのめかす",l:["◇ implication [名]含意，影響"],q:["imply と infer の違いは？","imply は話し手が「ほのめかす」，infer は聞き手が「推論する」"]},
indispensable:{d:"*不可欠な*",l:["＝ essential, vital","⇔ dispensable 「なくてもすむ」","◆ be indispensable to A 「Aに不可欠だ」"]},
inevitable:{d:"*避けられない*，必然的な",l:["◇ inevitably [副]必然的に"]},
inherent:{d:"(性質が)*本来備わっている*，固有の",l:["◆ be inherent in A 「Aに本来備わっている」"]},
interpret:{d:"①〜を*解釈する* ②(〜を)*通訳する*",l:["◆ interpret A as B 「AをBと解釈する」","◇ interpretation [名]解釈","◇ interpreter [名]通訳者"]},
maintain:{d:"①〜を*維持する* ②〜と*主張する*",l:["◆ maintain that 〜 「〜と主張する」","◇ maintenance [名]維持，整備"],q:["maintenance の綴りの注意点は？","maintain の ai が maintenance では a になる"]},
neglect:{d:"〜を*怠る*，*無視する*　[名]怠慢，放置",l:["◆ neglect to V 「Vするのを怠る」","◇ negligence [名]怠慢，過失"]},
obtain:{d:"〜を*得る*，*手に入れる*",l:["＝ get, acquire"]},
perceive:{d:"①〜に*気づく*，〜を知覚する ②〜を(…と)*みなす*",l:["◆ perceive A as B 「AをBとみなす」","◇ perception [名]知覚，認識"]},
phenomenon:{d:"*現象*",l:["★ 複数形は phenomena","◇ phenomenal [形]驚異的な"]},
precise:{d:"*正確な*，精密な",l:["◇ precisely [副]正確に；まさにその通り","◇ precision [名]正確さ"]},
prevail:{d:"①*広まっている*，普及している ②(〜に)*勝る*",l:["◆ prevail over A 「Aに勝つ」","◇ prevalent [形]広まっている"]},
pursue:{d:"〜を*追求する*，*追いかける*",l:["◆ in pursuit of A 「Aを追い求めて」","◇ pursuit [名]追求"]},
reluctant:{d:"*気が進まない*，いやいやながらの",l:["◆ be reluctant to V 「Vしたがらない」","＝ unwilling","◇ reluctantly [副]しぶしぶ"]},
substantial:{d:"①*かなりの*，相当な ②*実質的な*",l:["＝ considerable","◇ substance [名]物質；実質"]},
sufficient:{d:"*十分な*",l:["＝ enough, adequate","⇔ insufficient 「不十分な」"]},
vague:{d:"*漠然とした*，*あいまいな*",l:["＝ ambiguous","★ -gue の ue は読まない"]}
};

/* 確認タグ（「発音?」など）は mark と補足行から自動で付ける */
WORDS.forEach(w=>{
  const x=DETAIL[w.w]||{d:"*"+w.m+"*",l:w.rel?[w.rel]:[]};
  w.d=x.d; w.l=x.l; w.q=x.q||null;
  const t=[];
  if(w.mark==="発")t.push("発音?");
  if(w.mark==="ア")t.push("アク?");
  if(w.mark==="多")t.push("多義");
  if(w.l.some(s=>s.startsWith("＝")))t.push("同?");
  if(w.l.some(s=>s.startsWith("⇔")))t.push("反?");
  w.tags=t;
});

/* 表示用 */
const posBox=s=>s.replace(/\[(名|動|形|副)\]/g,'<span class="pbox">$1</span>');
const fmtDef=d=>posBox(esc(d).replace(/\*(.+?)\*/g,'<em class="r">$1</em>').replace(/([①②③])/g,'<span class="cn">$1</span>'));
function fmtLine(s){
  const m=s.match(/^(◆|◇|＝|⇔|★)\s*(.*?)\s*(「.*」)?$/);
  if(!m) return `<div class="ln"><span></span><span>${esc(s)}</span></div>`;
  const k={"◆":"id","◇":"dv","＝":"sy","⇔":"an","★":"nt"}[m[1]];
  return `<div class="ln ${k}"><span class="lm">${m[1]}</span><span class="lt">${posBox(esc(m[2]))}</span>${m[3]?`<span class="lj">${esc(m[3])}</span>`:""}</div>`;
}
