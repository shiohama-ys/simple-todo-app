# simple-todo-app

A simple todo list web app that works on iPhone and desktop.

## 構成

- **バックエンド**: Node.js + Express
- **フロントエンド**: HTML / CSS / JavaScript（レスポンシブ対応）
- **データベース**: SQLite（`better-sqlite3`）

## 必要なもの

- Node.js 18 以上

## セットアップと起動

```bash
npm install
npm start
```

起動すると `http://localhost:3000` でアクセスできます。
ポートは環境変数 `PORT` で変更できます（例: `PORT=8080 npm start`）。

データベースファイルは `data/todo.sqlite` に自動で作成されます。

### iPhone からアクセスする

サーバーを動かしているパソコンと iPhone を同じ Wi-Fi に接続し、
iPhone のブラウザで `http://<パソコンのIPアドレス>:3000` を開いてください。

## 機能

- タスクの追加
- 完了 / 未完了の切り替え
- タスクの削除
- タスク一覧の表示

## API

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/tasks` | タスク一覧を取得 |
| POST | `/api/tasks` | タスクを追加（body: `{ "title": "..." }`） |
| PATCH | `/api/tasks/:id` | 完了状態を更新（body 省略時はトグル、`{ "completed": true }`） |
| DELETE | `/api/tasks/:id` | タスクを削除 |

## テスト

```bash
npm test
```
