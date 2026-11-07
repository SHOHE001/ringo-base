# ringo-base（キホンのキ）

基本情報技術者試験を学ぶ Duolingo 風の学習アプリ。Vite + React + TypeScript。問題は `src/content/units/*.json` に置く（書き方は README と `_template.json`）。

## 検証コマンド

- `npm ci`
- `npm run build`（`tsc --noEmit` による型チェックを含む）
- `npm test`（Vitest）
- lint は未設定

## GitHub 運用

- main へ直接 push しない。`feature/` `fix/` `refactor/` `chore/` の作業 branch → PR → CI（`build-and-test`）成功 → merge。
- 目的・経緯は Issue、変更と検証は PR、確定した設計は `docs/` に残す。
- 同じ未解決問題で意味のある試行が3回失敗したら、Blocker Issue を作って `blocked` label を付ける。
- 秘密情報・個人情報を commit・Issue・PR に載せない。
- 詳細は [docs/development-workflow.md](docs/development-workflow.md)。
