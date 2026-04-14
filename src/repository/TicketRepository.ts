// =============================================================
// src/repository/TicketRepository.ts
// チケット情報のスプレッドシート操作
//
// シート "tickets" の列構成:
//   A: ticketId | B: userId | C: status | D: issuedAt | E: usedAt
// =============================================================

class TicketRepository extends BaseRepository {
  // カラムインデックス（1-indexed）
  private static readonly COL_TICKET_ID = 1;
  private static readonly COL_USER_ID = 2;
  private static readonly COL_STATUS = 3;
  private static readonly COL_ISSUED_AT = 4;
  private static readonly COL_USED_AT = 5;

  constructor() {
    super(SHEET_NAMES.TICKETS);
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  /** ticketId でチケットを取得 */
  findByTicketId(ticketId: string): TicketEntity | null {
    const rowIndex = this.findRowIndexByColumn(
      TicketRepository.COL_TICKET_ID,
      ticketId
    );
    if (rowIndex === -1) return null;

    const row = this.sheet.getRange(rowIndex, 1, 1, 5).getValues()[0] as SheetRow;
    return this.rowToEntity(row);
  }

  /** userId で所持チケット一覧を取得 */
  findByUserId(userId: string): TicketEntity[] {
    return this.getAllRows()
      .map((row) => this.rowToEntity(row))
      .filter((t) => t.userId === userId);
  }

  /** userId の未使用チケットを取得 */
  findUnusedByUserId(userId: string): TicketEntity[] {
    return this.findByUserId(userId).filter((t) => t.status === "unused");
  }

  /** チケットを新規発行 */
  issue(userId: string): TicketEntity {
    const entity: TicketEntity = {
      ticketId: this.generateId(),
      userId,
      status: "unused",
      issuedAt: this.formatDate(),
      usedAt: "",
    };
    this.appendRow(this.entityToRow(entity));
    AppLogger.info("[TicketRepository] チケット発行", {
      ticketId: entity.ticketId,
      userId,
    });
    return entity;
  }

  /** チケットを使用済みにする */
  use(ticketId: string): boolean {
    const rowIndex = this.findRowIndexByColumn(
      TicketRepository.COL_TICKET_ID,
      ticketId
    );
    if (rowIndex === -1) return false;

    const row = this.sheet.getRange(rowIndex, 1, 1, 5).getValues()[0] as SheetRow;
    const entity = this.rowToEntity(row);

    if (entity.status !== "unused") {
      AppLogger.warn("[TicketRepository] 使用済み/期限切れチケット", {
        ticketId,
        status: entity.status,
      });
      return false;
    }

    entity.status = "used";
    entity.usedAt = this.formatDate();
    this.updateRow(rowIndex, this.entityToRow(entity));
    return true;
  }

  /** チケットステータスを更新 */
  updateStatus(
    ticketId: string,
    status: TicketEntity["status"]
  ): boolean {
    const rowIndex = this.findRowIndexByColumn(
      TicketRepository.COL_TICKET_ID,
      ticketId
    );
    if (rowIndex === -1) return false;

    const row = this.sheet.getRange(rowIndex, 1, 1, 5).getValues()[0] as SheetRow;
    const entity = this.rowToEntity(row);
    entity.status = status;
    this.updateRow(rowIndex, this.entityToRow(entity));
    return true;
  }

  // ----------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------

  private rowToEntity(row: SheetRow): TicketEntity {
    return {
      ticketId: String(row[0]),
      userId: String(row[1]),
      status: String(row[2]) as TicketEntity["status"],
      issuedAt: String(row[3]),
      usedAt: String(row[4] ?? ""),
    };
  }

  private entityToRow(entity: TicketEntity): SheetRow {
    return [
      entity.ticketId,
      entity.userId,
      entity.status,
      entity.issuedAt,
      entity.usedAt,
    ];
  }
}
