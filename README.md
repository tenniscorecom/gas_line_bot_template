# LINE BOT - Google Apps Script + TypeScript テンプレート

LINE Messaging API を使った Webhook BOT のテンプレートです。  
Google Apps Script (GAS) + TypeScript + clasp 構成で、拡張しやすいレイヤー設計になっています。

---

## アーキテクチャ

```
Webhook (doPost)
  └─ EventRouter          # イベント種別ルーティング (message / follow / postback)
       ├─ MessageRouter   # メッセージタイプルーティング (text / image / sticker)
       │    └─ TextController  # /コマンド → CommandMap → 各Controller へ
       ├─ FollowController
       └─ PostbackController
            └─ Controller → Service → Repository (Spreadsheet)
```

### CommandMap によるコマンドルーティング

`switch` 文ではなく `CommandMap` (オブジェクト) でコマンドを管理します。  
新コマンドは `TextController.commandMap` にキーと関数を追加するだけで動きます。

```typescript
private static readonly commandMap: CommandMap = {
  help:   (event, _args) => TextController.handleHelp(event),
  ticket: (event, args)  => TicketController.handle(event, args),
  admin:  (event, args)  => AdminController.handle(event, args),
  // ← ここに追加するだけ！
};
```

---

## フォルダ構成

```
line-bot/
├── src/
│   ├── app/
│   │   ├── Main.ts           # doPost エントリーポイント + セットアップ関数
│   │   ├── Config.ts         # スクリプトプロパティ読み込み
│   │   └── Logger.ts         # ロガー (GAS Logger + Spreadsheet)
│   ├── router/
│   │   ├── EventRouter.ts    # イベント種別ルーティング
│   │   └── MessageRouter.ts  # メッセージタイプルーティング
│   ├── controller/
│   │   ├── TextController.ts    # テキスト / CommandMap
│   │   ├── TicketController.ts  # /ticket サブコマンド
│   │   ├── AdminController.ts   # /admin サブコマンド
│   │   └── FollowController.ts  # follow / unfollow + postback
│   ├── service/
│   │   ├── ReplyService.ts   # LINE Reply API ラッパー
│   │   ├── UserService.ts    # ユーザーのビジネスロジック
│   │   └── TicketService.ts  # チケットのビジネスロジック
│   ├── repository/
│   │   ├── BaseRepository.ts   # スプレッドシート操作の基底クラス
│   │   ├── UserRepository.ts   # users シート操作
│   │   └── TicketRepository.ts # tickets シート操作
│   ├── types/
│   │   ├── line.ts  # LINE Webhook 型定義
│   │   └── app.ts   # アプリ共通型定義・定数
│   └── appsscript.json
├── .clasp.json
├── tsconfig.json
├── package.json
└── .gitignore
```

---

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. clasp ログイン & プロジェクト作成

```bash
npx clasp login
npx clasp create --title "LINE BOT" --type webapp
```

作成後、`.clasp.json` の `scriptId` が自動設定されます。

### 3. スクリプトプロパティの設定

GAS エディタ → 「プロジェクトの設定」→「スクリプト プロパティ」に以下を登録：

| キー | 値 |
|---|---|
| `CHANNEL_ACCESS_TOKEN` | LINE チャンネルアクセストークン |
| `CHANNEL_SECRET` | LINE チャンネルシークレット |
| `SPREADSHEET_ID` | Google スプレッドシートの ID |
| `ADMIN_USER_IDS` | 管理者の LINE userId（カンマ区切り） |

または `setupProperties()` 関数を GAS エディタから実行して雛形を作成後、実際の値に書き換えます。

### 4. スプレッドシートの初期化

GAS エディタで `setupSpreadsheet()` 関数を実行すると、  
`users` / `tickets` / `logs` シートとヘッダーが自動作成されます。

### 5. ビルド & デプロイ

```bash
npm run push       # ビルド + clasp push
npx clasp deploy   # Web アプリとしてデプロイ
```

デプロイ後に表示される URL を LINE Developers の Webhook URL に設定します。

---

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `/help` | コマンド一覧を表示 |
| `/ticket use <ID>` | チケットを使用する |
| `/ticket check` | 保有チケットを確認する |
| `/ticket issue` | チケットを発行する（管理者のみ） |
| `/admin user <userId>` | 管理者権限をトグルする（管理者のみ） |
| `/admin summary` | ユーザーサマリーを表示する（管理者のみ） |

---

## 新しいコマンドの追加方法

### 例: `/shop` コマンドを追加する

**1. `ShopController.ts` を作成**

```typescript
class ShopController {
  static handle(event: LineMessageEvent, args: string[]): void {
    ReplyService.replyText(event.replyToken, "ショップ機能は準備中です 🛍️");
  }
}
```

**2. `TextController.ts` の `commandMap` に追加**

```typescript
private static readonly commandMap: CommandMap = {
  help:   (event, _args) => TextController.handleHelp(event),
  ticket: (event, args)  => TicketController.handle(event, args),
  admin:  (event, args)  => AdminController.handle(event, args),
  shop:   (event, args)  => ShopController.handle(event, args),  // ← 追加
};
```

これだけで `/shop` コマンドが動作します。

---

## スプレッドシート シート構成

### users シート

| userId | displayName | followedAt | isAdmin | memo |
|---|---|---|---|---|
| Uxxxxxxxx | 山田太郎 | 2024-01-01 10:00:00 | false | |

### tickets シート

| ticketId | userId | status | issuedAt | usedAt |
|---|---|---|---|---|
| uuid | Uxxxxxxxx | unused / used / expired | 2024-01-01 | |

### logs シート

| timestamp | level | message | context |
|---|---|---|---|
| 2024-01-01T10:00:00Z | ERROR | エラーメッセージ | {"key":"value"} |
