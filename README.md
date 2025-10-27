# CRM NEW – Runbook (Step1)
正式なアプリは `crm-app/`。ルートの pnpm スクリプトは **すべて crm-app に委譲** します。

## 0) Postgres が無い人は最速で用意（任意）
```bash
docker run --name pg -e POSTGRES_PASSWORD=pass -p 5432:5432 -d postgres:16
```

## 1) 依存とビルド許可
```bash
pnpm install
pnpm approve-builds   # 画面が出たら a → Enter（全選択）で確定
```

## 2) .env を crm-app/.env に作る（.env.example を参考に実値で）
```
DATABASE_URL（例: postgresql://postgres:pass@localhost:5432/postgres?schema=public）
NEXTAUTH_SECRET（任意の長いランダム文字列）
SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
```

## 3) Prisma → Seed → 起動
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev             # → http://localhost:3000 （5173 は Vite なのでNG）
```

## 4) 動作チェック
- `/login` で seed した管理者でログイン → `/dashboard`
- `/admin/users` でユーザー作成/role変更/有効・無効
- 非adminで `/admin/users` が拒否される

## FAQ
- `DATABASE_URL not found` → `.env` は `crm-app/.env` に置く。角カッコや <...> は使わない。
- `seed で env 必須エラー` → `SEED_ADMIN_*` を `.env` に追加。保存後に `pnpm db:seed`。
- `JSON 解析エラー` → ルートの `package.json` がこの README 記載どおりか再確認（末尾カンマ不可）。
- `approve-builds` を飛ばした → `pnpm approve-builds` → `a` → `Enter`。

## （任意）**ルート** `.vscode/settings.json` – VSCodeの統合ターミナルを `crm-app` に
```json
{ "terminal.integrated.cwd": "${workspaceFolder}/crm-app" }
```

最後に：変更したファイル一覧（新規/上書き）と、実行手順（`pnpm install` → `pnpm approve-builds` → `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed` → `pnpm dev`）を箇条書きで出力してください。
これで root からのコマンドでも Next.js が 3000 番で起動し、db:* も root / crm-app 双方から実行できます。
## Git不要物のキャッシュ削除
追跡中に残ってしまった大容量アーティファクトは次でまとめて index から外せます（存在するものだけ除外されます）。

```powershell
git rm -r --cached -f node_modules .next crm-app/node_modules crm-app/.next .pnpm-store dist build out coverage
```

## 初回コミット & プッシュ手順（PowerShell）
```powershell
cd <repo-root>
# まだGit管理下でなければ初期化
git init
# ブランチを main に統一
git branch -M main

# ここまでの ignore を反映して全ファイル追加
git add -A
git commit -m "chore: bootstrap repo (.gitignore, attrs, clean)"

# リモートを設定（URLは置き換えてください）
# git remote add origin <YOUR_REMOTE>
# 既存 remote を差し替える場合は: git remote set-url origin <YOUR_REMOTE>

git push -u origin main
```
### ターミナルが開かないときのFAQ
- 症状: `開始ディレクトリ (cwd) "//crm-app" が存在しません`
- 対処: `.vscode/settings.json` の `terminal.integrated.cwd` を `${workspaceFolder}/crm-app` にするか、設定ごと削除。
- 代替: エクスプローラで `crm-app` を右クリック → 「統合ターミナルで開く」。
