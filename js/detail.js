/* ---------- 見出し語ブロックの表示 ----------
 * d : 語義。*…* は赤字（赤シートで消える部分）、[名][動][形][副][前][接] は品詞の囲み
 * l : 補足行。先頭の記号で種類が決まる
 *     ◆ 熟語・構文  ◇ 派生語  ＝ 同意語  ⇔ 反意語  ★ 注意  ▷ 例・関連表現
 *     「…」で囲んだ部分は右寄せの訳として表示
 * q : [問い, 答え]（答えは赤シートで消える。答えが無ければ問いだけ表示）
 */
const posBox=s=>s.replace(/\[(名|動|形|副|前|接)\]/g,'<span class="pbox">$1</span>');
const fmtDef=d=>posBox(esc(d).replace(/\*(.+?)\*/g,'<em class="r">$1</em>').replace(/([①-⑳])/g,'<span class="cn">$1</span>'));
function fmtLine(s){
  const m=s.match(/^(◆|◇|＝|⇔|★|▷)\s*(.*?)\s*(「.*」)?$/);
  if(!m) return `<div class="ln"><span></span><span>${esc(s)}</span></div>`;
  const k={"◆":"id","◇":"dv","＝":"sy","⇔":"an","★":"nt","▷":"eg"}[m[1]];
  return `<div class="ln ${k}"><span class="lm">${m[1]}</span><span class="lt">${posBox(esc(m[2]))}</span>${m[3]?`<span class="lj">${esc(m[3])}</span>`:""}</div>`;
}
