// =============================================================
// src/repository/BaseRepository.ts
// スプレッドシート操作の基底クラス
// =============================================================

abstract class BaseRepository {
  protected sheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor(sheetName: string) {
    const config = Config.get();
    const ss     = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet  = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(
        `[BaseRepository] シート "${sheetName}" が見つかりません。` +
        "setupSpreadsheet() を実行してシートを作成してください。"
      );
    }
    this.sheet = sheet;
  }

  // ----------------------------------------------------------
  // 読み取り
  // ----------------------------------------------------------

  /** ヘッダー行を除いた全行を返す */
  protected getAllRows(): SheetRow[] {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return [];
    return this.sheet
      .getRange(2, 1, lastRow - 1, this.sheet.getLastColumn())
      .getValues() as SheetRow[];
  }

  /**
   * 指定カラム（1-indexed）の値で行を検索し、
   * 最初にマッチした行番号（ヘッダー込み 1-indexed）を返す。
   * 見つからない場合は -1。
   */
  protected findRowIndex(columnIndex: number, value: string): number {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return -1;

    const values = this.sheet
      .getRange(2, columnIndex, lastRow - 1, 1)
      .getValues();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]) === value) return i + 2;
    }
    return -1;
  }

  /** 指定カラムの値でマッチする全行を返す */
  protected findAllRowsByColumn(columnIndex: number, value: string): SheetRow[] {
    return this.getAllRows().filter(
      (row) => String(row[columnIndex - 1]) === value
    );
  }

  // ----------------------------------------------------------
  // 書き込み
  // ----------------------------------------------------------

  protected appendRow(row: SheetRow): void {
    this.sheet.appendRow(row);
  }

  protected updateRow(rowIndex: number, row: SheetRow): void {
    this.sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  }

  // ----------------------------------------------------------
  // ユーティリティ
  // ----------------------------------------------------------

  /** 現在の最終行番号を返す（ログID生成に使用） */
  protected getLastRow(): number {
    return this.sheet.getLastRow();
  }

  /**
   * 現在日時を "yyyy-MM-dd HH:mm:ss" 形式（Asia/Tokyo）で返す
   */
  protected now(): string {
    return Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy-MM-dd HH:mm:ss"
    );
  }

  /**
   * n日後の日時を "yyyy-MM-dd HH:mm:ss" 形式（Asia/Tokyo）で返す
   */
  protected addDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return Utilities.formatDate(d, "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss");
  }

  /** UUID を生成する */
  protected generateId(): string {
    return Utilities.getUuid();
  }
}
