// =============================================================
// src/repository/TicketRepository.ts
// tickets シートのみを担当する Repository
//
// tickets シート列構成（A〜F）:
//   A: ticket_id | B: user_id | C: ticket_type
//   D: remaining_count | E: expire_date | F: created_at
// =============================================================

class TicketRepository extends BaseRepository {

  private static readonly COL_TICKET_ID       = 1;
  private static readonly COL_USER_ID         = 2;
  private static readonly COL_TICKET_TYPE     = 3;
  private static readonly COL_REMAINING_COUNT = 4;
  private static readonly COL_EXPIRE_DATE     = 5;
  private static readonly COL_CREATED_AT      = 6;

  constructor() {
    super(SHEET_NAMES.TICKETS);
  }

  // ----------------------------------------------------------
  // 検索
  // ----------------------------------------------------------

  findByUserId(userId: string): TicketEntity[] {
    return this.findAllRowsByColumn(TicketRepository.COL_USER_ID, userId)
      .map((r) => this.rowToEntity(r));
  }

  /**
   * userId の有効チケットを1件返す（使用時に使う）
   * 有効 = remaining_count > 0 かつ expire_date が未来
   * 複数ある場合は期限が近い順で先頭
   */
  findActiveTicket(userId: string): TicketEntity | null {
    const now = new Date();
    const active = this.findByUserId(userId)
      .filter((t) => t.remainingCount > 0 && new Date(t.expireDate) > now)
      .sort((a, b) => a.expireDate.localeCompare(b.expireDate));
    return active[0] ?? null;
  }

  findByTicketId(ticketId: string): TicketEntity | null {
    const rowIndex = this.findRowIndex(TicketRepository.COL_TICKET_ID, ticketId);
    if (rowIndex === -1) return null;
    const row = this.sheet.getRange(rowIndex, 1, 1, 6).getValues()[0] as SheetRow;
    return this.rowToEntity(row);
  }

  // ----------------------------------------------------------
  // 書き込み
  // ----------------------------------------------------------

  createTicket(userId: string, type: TicketTypeKey): TicketEntity {
    const plan    = TicketTypes[type];
    const entity: TicketEntity = {
      ticketId:       this.generateId(),
      userId,
      ticketType:     type,
      remainingCount: plan.count,
      expireDate:     this.addDays(plan.expireDays),
      createdAt:      this.now(),
    };
    this.appendRow(this.entityToRow(entity));
    return entity;
  }

  /**
   * remaining_count を更新する
   * 必ず TicketService 経由で呼ぶこと（ログとのセット更新を保証するため）
   */
  updateRemaining(ticketId: string, remaining: number): void {
    const rowIndex = this.findRowIndex(TicketRepository.COL_TICKET_ID, ticketId);
    if (rowIndex === -1) {
      throw new Error(`[TicketRepository] ticketId "${ticketId}" が見つかりません`);
    }
    this.sheet
      .getRange(rowIndex, TicketRepository.COL_REMAINING_COUNT)
      .setValue(remaining);
  }

  // ----------------------------------------------------------
  // 変換
  // ----------------------------------------------------------

  private rowToEntity(row: SheetRow): TicketEntity {
    return {
      ticketId:       String(row[0]),
      userId:         String(row[1]),
      ticketType:     String(row[2]) as TicketTypeKey,
      remainingCount: Number(row[3]),
      expireDate:     String(row[4]),
      createdAt:      String(row[5]),
    };
  }

  private entityToRow(e: TicketEntity): SheetRow {
    return [
      e.ticketId,
      e.userId,
      e.ticketType,
      e.remainingCount,
      e.expireDate,
      e.createdAt,
    ];
  }
}
