// =============================================================
// src/repository/BaseRepository.ts
// スプレッドシート操作の基底クラス
// =============================================================

abstract class BaseRepository {
  protected sheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor(sheetName: string) {
    const config = Config.get();
    const ss = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(
        `[BaseRepository] シート "${sheetName}" が見つかりません。` +
          "スプレッドシートにシートを作成してください。"
      );
    }

    this.sheet = sheet;
  }

  // ----------------------------------------------------------
  // 共通 CRUD ヘルパー
  // ----------------------------------------------------------

  /** 全行を取得（ヘッダー行を除く） */
  protected getAllRows(): SheetRow[] {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return []; // ヘッダーのみ or 空

    const data = this.sheet
      .getRange(2, 1, lastRow - 1, this.sheet.getLastColumn())
      .getValues();

    return data as SheetRow[];
  }

  /** 行を追加 */
  protected appendRow(row: SheetRow): void {
    this.sheet.appendRow(row);
  }

  /** 指定行番号（1-indexed、ヘッダー込み）を更新 */
  protected updateRow(rowIndex: number, row: SheetRow): void {
    this.sheet
      .getRange(rowIndex, 1, 1, row.length)
      .setValues([row]);
  }

  /** 指定行番号（1-indexed）を削除 */
  protected deleteRow(rowIndex: number): void {
    this.sheet.deleteRow(rowIndex);
  }

  /**
   * 特定カラム（1-indexed）でキー検索し、最初にマッチした行番号を返す
   * @returns ヒットした行番号（ヘッダー込み 1-indexed）。未ヒットは -1
   */
  protected findRowIndexByColumn(columnIndex: number, value: string): number {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return -1;

    const values = this.sheet
      .getRange(2, columnIndex, lastRow - 1, 1)
      .getValues();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]) === value) {
        return i + 2; // +2 = ヘッダー行分のオフセット
      }
    }

    return -1;
  }

  /** 日付を "YYYY-MM-DD HH:mm:ss" 形式の文字列に変換 */
  protected formatDate(date: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }

  /** UUID 風のユニークIDを生成 */
  protected generateId(): string {
    return Utilities.getUuid();
  }
}
