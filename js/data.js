/* ---------- 単語データ ----------
 * 単語データはリポジトリには含めず、利用者が自分で読み込んだもの（この端末のブラウザ内に保存）を使う。
 * 読み込み・変換は js/import.js。ここでは保存済みのデータを取り出すだけ。
 */
const DATA_KEY="akasheet-data-v1";
let DATA=null;
try{DATA=JSON.parse(localStorage.getItem(DATA_KEY)||"null");}catch(e){}
const WORDS=(DATA&&Array.isArray(DATA.words))?DATA.words:[];
const MAX_PER=5; // 1ページの最大語数（画面に収まる数だけ載せる）
const STAGE=100; // 100語ごとに1ステージ
const COLORS={yellow:"苦手",pink:"要注意",green:"例文",blue:"派生"};
