// =============================================================
// src/app/Main.ts
// GAS エントリーポイント
//
// コマンド追加手順:
//   1. src/command/commands/XxxCommand.ts を作成
//   2. initCommands() に new XxxCommand() を1行追加
// =============================================================

function initCommands(): void {
  CommandRegistry.registerAll([
    new HelpCommand(),    // /help
    new TicketCommand(),  // /ticket use | check | add
    new UserCommand(),    // /user summary | admin  ※管理者専用
    // new XxxCommand(), ← 新コマンドはここに追加
  ]);
}

// ----------------------------------------------------------
// Webhook エントリーポイント
// ----------------------------------------------------------

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    initCommands();

    const body = JSON.parse(e.postData.contents) as LineWebhookBody;

    // LINEの疎通確認（events が空）
    if (!body.events || body.events.length === 0) {
      return jsonResponse({ status: "ok" });
    }

    EventRouter.route(body.events);
    return jsonResponse({ status: "ok" });

  } catch (err) {
    AppLogger.error("[Main] 致命的エラー", { error: String(err) });
    return jsonResponse({ status: "error", message: String(err) });
  }
}

function doGet(): GoogleAppsScript.Content.TextOutput {
  initCommands();
  const commands = CommandRegistry.getAll().map((c) => c.name);
  return jsonResponse({ status: "LINE BOT is running 🎾", commands });
}

function jsonResponse(data: Record<string, unknown>): GoogleAppsScript.Content.TextOutput {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------
// 初期セットアップ（GASエディタから手動で一度だけ実行）
// ----------------------------------------------------------

/**
 * スプレッドシートにシートとヘッダーを作成する
 */
function setupSpreadsheet(): void {
  const config = Config.get();
  const ss     = SpreadsheetApp.openById(config.spreadsheetId);

  const sheets: Array<{ name: string; headers: string[] }> = [
    {
      name: SHEET_NAMES.USERS,
      headers: ["user_id", "display_name", "short_id", "followed_at", "is_admin", "memo"],
    },
    {
      name: SHEET_NAMES.TICKETS,
      headers: ["ticket_id", "user_id", "ticket_type", "remaining_count", "expire_date", "created_at"],
    },
    {
      name: SHEET_NAMES.TICKET_LOGS,
      headers: ["log_id", "user_id", "ticket_id", "action", "count", "remaining_after", "created_at", "note"],
    },
    {
      name: SHEET_NAMES.LOGS,
      headers: ["timestamp", "level", "message", "context"],
    },
  ];

  sheets.forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log(`シート "${name}" を作成しました`);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }
  });

  Logger.log("✅ セットアップ完了");
}
