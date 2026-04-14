// =============================================================
// src/app/Main.ts
// GAS エントリーポイント
// Webhook リクエストを受け取り EventRouter に渡す
//
// ★ 新しいコマンドを追加するときは initCommands() に
//    new XxxCommand() を1行追加するだけ。
//    それ以外のファイルは一切変更不要。
// =============================================================

/**
 * コマンドをレジストリに登録する初期化関数
 * doPost の先頭で毎回呼ばれる（GAS はリクエストごとにスコープがリセットされる）
 *
 * ────────────────────────────────────────────────
 *  新コマンド追加手順:
 *   1. src/command/commands/ に XxxCommand.ts を作成
 *   2. BaseCommand を継承し name / description / execute を実装
 *   3. ↓ここに new XxxCommand() を1行追加する
 * ────────────────────────────────────────────────
 */
function initCommands(): void {
  CommandRegistry.registerAll([
    new HelpCommand(),    // /help
    new TicketCommand(),  // /ticket
    new AdminCommand(),   // /admin
    new ShopCommand(),    // /shop  ← 追加サンプル。不要なら削除してください
    // new XxxCommand(), ← ここに追加するだけ！
  ]);
}

/**
 * LINE Webhook のエントリーポイント
 * GAS の Web アプリとして公開し、Webhook URL に設定する
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    // コマンドを初期化（GAS はリクエストごとにスコープがリセットされるため毎回実行）
    initCommands();

    AppLogger.info("[Main] Webhook 受信");

    // リクエストボディをパース
    const body = JSON.parse(e.postData.contents) as LineWebhookBody;

    AppLogger.info("[Main] イベント数", { count: body.events.length });

    // イベントが空の場合（LINE の疎通確認リクエスト）
    if (!body.events || body.events.length === 0) {
      AppLogger.info("[Main] 疎通確認リクエスト");
      return ContentService.createTextOutput(
        JSON.stringify({ status: "ok" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // イベントルーティング
    EventRouter.route(body.events);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    AppLogger.error("[Main] 致命的エラー", { error: String(err) });

    // LINE には常に 200 を返す（再送防止）
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 動作確認用（ブラウザから GET アクセスして疎通確認）
 */
function doGet(): GoogleAppsScript.Content.TextOutput {
  initCommands();
  const commands = CommandRegistry.getAll().map((c) => c.name);
  return ContentService.createTextOutput(
    JSON.stringify({ status: "LINE BOT is running 🚀", commands })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * スクリプトプロパティの初期設定ヘルパー
 * GAS エディタから手動で一度だけ実行する
 */
function setupProperties(): void {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    [CONFIG_KEYS.CHANNEL_ACCESS_TOKEN]: "YOUR_CHANNEL_ACCESS_TOKEN",
    [CONFIG_KEYS.CHANNEL_SECRET]: "YOUR_CHANNEL_SECRET",
    [CONFIG_KEYS.SPREADSHEET_ID]: "YOUR_SPREADSHEET_ID",
    [CONFIG_KEYS.ADMIN_USER_IDS]: "U1234567890,U0987654321",
  });
  Logger.log("スクリプトプロパティを設定しました。実際の値に書き換えてください。");
}

/**
 * スプレッドシートのシートとヘッダーを初期化する
 * GAS エディタから手動で一度だけ実行する
 */
function setupSpreadsheet(): void {
  const config = Config.get();
  const ss = SpreadsheetApp.openById(config.spreadsheetId);

  const sheetsConfig: Array<{ name: string; headers: string[] }> = [
    {
      name: SHEET_NAMES.USERS,
      headers: ["userId", "displayName", "followedAt", "isAdmin", "memo"],
    },
    {
      name: SHEET_NAMES.TICKETS,
      headers: ["ticketId", "userId", "status", "issuedAt", "usedAt"],
    },
    {
      name: SHEET_NAMES.LOGS,
      headers: ["timestamp", "level", "message", "context"],
    },
  ];

  sheetsConfig.forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log(`シート "${name}" を作成しました`);
    }
    // ヘッダー行がなければ書き込む
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      Logger.log(`シート "${name}" にヘッダーを設定しました`);
    }
  });

  Logger.log("スプレッドシートのセットアップが完了しました ✅");
}
