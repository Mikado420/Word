# 赤シート単語帳

受験生向けの英単語帳Webアプリ（単一HTML）。

- **インプットモード**：紙の単語帳風ページ。赤シートで意味を隠し、タップでめくる。色つき付箋とメモを貼れる。
- **アウトプットモード**：1枚ずつのカード復習。4段階の自己採点からFSRSで次回出題日を計算。読んだページ・付箋だけに絞って出題可能。

学習記録はブラウザの localStorage に保存されます。`index.html` をブラウザで開くだけで動きます。

## ファイル構成

```
index.html        画面の骨組み（viewport設定を含む）
css/style.css     デザイン・テーマ（ライト/ダーク）
js/data.js        単語データ（ここに追加すれば単語が増える）
js/storage.js     学習記録の保存（localStorage）
js/fsrs.js        復習間隔の計算（FSRS）
js/utils.js       共通ヘルパー
js/book.js        インプットモード（単語帳ページ・赤シート・付箋）
js/review.js      アウトプットモード（ダッシュボード・復習カード）
js/updater.js     自動更新（version.json の監視）
js/app.js         モード切替・キー操作・起動
sw.js             Service Worker（オフライン対応・最新優先）
manifest.json     ホーム画面に追加するための設定
version.json      版番号（公開時に自動で書き換え）
```

ES Modules を使っていないので、`index.html` をダブルクリックで開いても動きます。

## 自動更新のしくみ

1. `main` にプッシュすると GitHub Actions が `version.json` にコミットIDを書き込んで Pages に公開します。
2. アプリは起動時・画面に戻ったとき・5分ごとに `version.json` を確認します。
3. 版が変わっていたら自動で再読み込みします。復習の途中や付箋の編集中は中断せず、画面下のバナーで知らせて、ダッシュボードに戻った時点で反映します。

学習記録（localStorage）は更新しても消えません。

**初回のみ**：リポジトリの Settings → Pages → Build and deployment の Source を「GitHub Actions」にしてください。

## 単語データの書き方

- `js/data.js`：見出し語・品詞・意味・例文（`RAW`）と、フレーズ・発音記号・注意マーク（`EXTRA`）
- `js/detail.js`：見出し語ブロックの中身（`DETAIL`）
  - `d` 語義。`*…*` が赤字（赤シートで消える）、`[名]` などは品詞の囲み
  - `l` 補足行。先頭が `◆`熟語 `◇`派生語 `＝`同意語 `⇔`反意語 `★`注意。「…」は訳として右寄せ
  - `q` Q&A（答えは赤シートで消える）
