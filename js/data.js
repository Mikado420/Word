/* ---------- 単語データ ----------
 * 単語データは data/ に登録したもの（BOOKS）か、利用者が自分で読み込んだもの。どちらもこの端末のブラウザ内に保存して使う。
 * 読み込み・変換は js/import.js。ここでは保存済みのデータを取り出すだけ。
 */
const DATA_KEY="akasheet-data-v1";
let DATA=null;
try{DATA=JSON.parse(localStorage.getItem(DATA_KEY)||"null");}catch(e){}
const WORDS=(DATA&&Array.isArray(DATA.words))?DATA.words:[];
const MAX_PER=5; // 1ページの最大語数（画面に収まる数だけ載せる）
const STAGE=100; // 100語ごとに1ステージ
/* リポジトリに登録済みの単語データ（data/ 内のテキスト。書式は js/import.js を参照）。
 * まだ単語を読み込んでいない端末では先頭のものを自動で読み込む。 */
const BOOKS=[
  {file:"data/verbs-stage1.txt",title:"動詞 Stage 1"}
];
const COLORS={yellow:"苦手",pink:"要注意",green:"例文",blue:"派生"};
