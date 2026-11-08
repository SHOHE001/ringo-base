# キホンのキ

基本情報技術者試験を、パス型レッスンで学ぶ個人用 Web アプリです。GitHub Pages で公開し、スマホのホーム画面に入れて使います。
Vite + React + TypeScript で作られていて、進捗はブラウザの localStorage（キー `kihon-no-ki:v1`）に保存されます。サーバーは使いません。

## 起動方法

```bash
npm install
npm run dev      # 開発サーバー（表示された URL をブラウザで開く）
npm run build    # 型チェック + 本番ビルド（dist/ に出力）
npm run preview  # ビルド結果の確認
npm test         # Vitest（src/lib などの純粋ロジックとコンテンツ検証）
```

## スマホで使う（PWA）

本番ビルド（`dist/`）はホーム画面に追加でき、一度開けばオフラインでも動きます。

1. `main` に push すると GitHub Actions がビルドして GitHub Pages（https://shohe001.github.io/ringo-base/）に公開します。初回だけ、リポジトリの Settings → Pages → Source を「GitHub Actions」にしてください。
2. スマホのブラウザで開き、iPhone は Safari の共有メニュー →「ホーム画面に追加」、Android は Chrome のメニュー →「ホーム画面に追加」。

進捗は端末ごとの localStorage に保存されるため、PC とスマホで記録は共有されません。
アイコンの元画像は `public/icons/icon.svg` です。

## 学習リマインド通知

毎日 20 時（日本時間）に、GitHub Actions（`.github/workflows/reminder.yml`）がスマホへプッシュ通知を送ります。サーバーは不要です。

初回だけ次の設定をします。

1. PC で `npx web-push generate-vapid-keys` を実行して鍵ペアを作り、リポジトリの Settings → Secrets and variables → Actions で、公開鍵を Variables の `VAPID_PUBLIC_KEY`、秘密鍵を Secrets の `VAPID_PRIVATE_KEY` に登録する。その後 Actions の「Deploy to GitHub Pages」を Run workflow で実行し直す（公開鍵をアプリに埋め込むため）。
2. スマホでアプリを開き（iPhone はホーム画面に追加したアイコンから。iOS 16.4 以降）、記録画面の「通知をオンにする」を押す。
3. 表示された「登録コード」をコピーし、シークレット `PUSH_SUBSCRIPTIONS` に貼る。複数端末なら 1 行に 1 つずつ並べる。
4. Actions タブの「Study reminder」→「Run workflow」で、すぐに通知が届くか試せる。

時刻を変えるときは `reminder.yml` の `cron`（UTC）を書き換えます。公開リポジトリでは 60 日間コミットがないと定期実行が止まるので、そのときは Actions タブから有効化し直してください。

## 問題の足し方

問題は `src/content/units/*.json` に置きます。ファイルを足すだけで、学ぶ画面に自動で並びます（コードの変更は不要）。

- ファイル名が `_` で始まるものは読み込まれません。`_template.json` をコピーして使うと楽です。
- ユニットは `order` の昇順に並びます。
- 問題の ID は、レッスンの `id` と `prompt` から自動で作られます。JSON に ID を書く必要はありません。
  同じレッスン内で `prompt` を重複させないでください。また、`prompt` を書き換えると、その問題の復習リストの記録は外れます。
- レッスンの `id` は進捗の保存に使われます。学習を始めた後に変更しないでください（完了記録が外れます）。
- 形式が不正な問題やファイルは、その部分だけ除外され、学ぶ画面の上部に赤い警告バナー（ファイル名と理由）が出ます。アプリは止まりません。

### ユニットとレッスン

```json
{
  "id": "unit-id",
  "order": 99,
  "title": "ユニット名",
  "description": "ユニットの説明（省略可）",
  "color": "orange",
  "lessons": [
    { "id": "lesson-id", "title": "レッスン名", "questions": [] }
  ]
}
```

`color` は省略可で、`green` / `blue` / `purple` / `orange` / `red` / `gold` から選びます（省略時は順に割り当て）。

### 4 つの問題形式

どの形式も `prompt`（問題文）が必須で、`code`（コードブロック表示）と `explanation`（解説）は省略できます。

**choice（選択式）** `answer` は `choices` のいずれかと一致させます。表示時にシャッフルされます。

```json
{
  "type": "choice",
  "prompt": "2進数 1010 を10進数で表したものはどれか。",
  "code": "任意: 疑似言語などのコード",
  "choices": ["8", "10", "12", "14"],
  "answer": "10",
  "explanation": "8 + 2 = 10 です。"
}
```

**truefalse（正誤）** 「正しい / 誤り」の2択です。`answer` は `true` / `false`。

```json
{
  "type": "truefalse",
  "prompt": "キャッシュメモリは、主記憶より高速である。",
  "answer": true
}
```

**order（並べ替え）** `answer` を正しい順に書きます。表示時はシャッフルされます。`distractors` にダミーのチップを足せます（省略可）。

```json
{
  "type": "order",
  "prompt": "プログラム実行の流れを順に並べよう。",
  "answer": ["命令の取り出し", "解読", "実行"],
  "distractors": ["印刷"]
}
```

**match（組み合わせ）** `pairs` に `[左, 右]` を2組以上書きます。左右とも重複させないでください。間違えた問題の復習リストには保存されません。

```json
{
  "type": "match",
  "prompt": "用語と説明を組み合わせよう。",
  "pairs": [
    ["CPU", "演算と制御を行う装置"],
    ["RAM", "読み書きできる主記憶"]
  ]
}
```

## 調整値の場所

`src/config.ts` に集約しています。

| 名前 | 内容 | 既定値 |
|---|---|---|
| `appName` / `mascotName` | アプリ名 / キャラ名 | キホンのキ / チップ |
| `maxHearts` | ハートの上限 | 5 |
| `heartRegenMinutes` | ハートが 1 つ回復する分数 | 30 |
| `xpLesson` | レッスン初回完了の XP | 10 |
| `xpPerfectBonus` | 初回で誤答 0 のときの加算 XP | 5 |
| `xpReplay` | 再挑戦の XP | 5 |
| `xpReview` | 復習完了の XP | 5 |
| `dailyGoalXp` | 1 日の目標 XP | 20 |
| `reviewSessionSize` | 復習 1 回あたりの最大問題数 | 10 |
| `storageKey` | localStorage のキー | `kihon-no-ki:v1` |

配色は `src/styles.css` の先頭にある CSS 変数（`:root`）で変更できます。

## 画面の概要

- **学ぶ**: ユニットごとのバナーとレッスンのパス。最初の未完了レッスンが「現在」、それより後はロックされます。
- **復習**: レッスンでまちがえた問題（match を除く）を最大 `reviewSessionSize` 問まで出題します。ハートは減らず、正解した問題はリストから消えます。
- **記録**: 合計 XP、連続日数、完了レッスン数、直近 7 日の XP、ユニット別の進捗。「進捗をリセット」で保存データを消せます。

レッスン中のキーボード操作: 数字キー 1〜9 で選択、Enter でチェック / つづける、Esc で中断の確認。
