// =============================================================
// src/repository/TicketLogRepository.ts
// ticket_logs シートのみを担当する Repository
//
// ticket_logs シート列構成（A〜H）:
//   A: log_id | B: user_id | C: ticket_id | D: action
//   E: count  | F: remaining_after | G: created_at | H: note
//
// 重要制約:
//   - ログは削除しない
//   - log_id は getLastRow() で採番（削除しない前提で連番が保証される）
// =============================================================

class TicketLogRepository extends BaseRepository {

  constructor() {
    super(SHEET_NAMES.TICKET_LOGS);
  }

  // ----------------------------------------------------------
  // 書き込み
  // ----------------------------------------------------------

  /**
   * ログを1行追記する
   * log_id = 現在の最終行番号（ヘッダー込み）= 実質的な連番
   */
  writeLog(
    userId:         string,
    ticketId:       string,
    action:         TicketLogAction,
    count:          number,
    remainingAfter: number,
    note:           string = ""
  ): TicketLogEntity {
    const entity: TicketLogEntity = {
      logId:          String(this.getLastRow()),
      userId,
      ticketId,
      action,
      count,
      remainingAfter,
      createdAt:      this.now(),
      note,
    };
    this.appendRow(this.entityToRow(entity));
    return entity;
  }

  // ----------------------------------------------------------
  // 読み取り（参照・集計用）
  // ----------------------------------------------------------

  /** ticketId に紐づく全ログを返す */
  findByTicketId(ticketId: string): TicketLogEntity[] {
    return this.findAllRowsByColumn(3, ticketId)
      .map((r) => this.rowToEntity(r));
  }

  /** userId に紐づく全ログを返す */
  findByUserId(userId: string): TicketLogEntity[] {
    return this.findAllRowsByColumn(2, userId)
      .map((r) => this.rowToEntity(r));
  }

  // ----------------------------------------------------------
  // 変換
  // ----------------------------------------------------------

  private rowToEntity(row: SheetRow): TicketLogEntity {
    return {
      logId:          String(row[0]),
      userId:         String(row[1]),
      ticketId:       String(row[2]),
      action:         String(row[3]) as TicketLogAction,
      count:          Number(row[4]),
      remainingAfter: Number(row[5]),
      createdAt:      String(row[6]),
      note:           String(row[7] ?? ""),
    };
  }

  private entityToRow(e: TicketLogEntity): SheetRow {
    return [
      e.logId,
      e.userId,
      e.ticketId,
      e.action,
      e.count,
      e.remainingAfter,
      e.createdAt,
      e.note,
    ];
  }
}
