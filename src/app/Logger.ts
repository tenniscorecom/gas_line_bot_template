// =============================================================
// src/app/Logger.ts
// アプリケーションロガー（GAS の Logger + Spreadsheet ログ）
// =============================================================

class AppLogger {
  private static sheetName = SHEET_NAMES.LOGS;

  static info(message: string, context?: Record<string, unknown>): void {
    this.log("INFO", message, context);
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    this.log("WARN", message, context);
  }

  static error(message: string, context?: Record<string, unknown>): void {
    this.log("ERROR", message, context);
  }

  private static log(
    level: "INFO" | "WARN" | "ERROR",
    message: string,
    context?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : "";
    const logLine = `[${timestamp}] [${level}] ${message} ${contextStr}`.trim();

    // GAS の組み込みロガー
    Logger.log(logLine);

    // エラーのみスプレッドシートにも書き込む
    if (level === "ERROR") {
      try {
        this.writeToSheet(timestamp, level, message, contextStr);
      } catch (_e) {
        // ログ書き込み失敗は握りつぶす（無限ループ防止）
      }
    }
  }

  private static writeToSheet(
    timestamp: string,
    level: string,
    message: string,
    context: string
  ): void {
    const config = Config.get();
    const ss = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = ss.getSheetByName(this.sheetName);
    if (!sheet) return;
    sheet.appendRow([timestamp, level, message, context]);
  }
}
