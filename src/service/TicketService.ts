// =============================================================
// src/service/TicketService.ts
// チケットのビジネスロジック
//
// セット更新の責務はここに集約する:
//   tickets の更新   → ticketRepo
//   ticket_logs の記録 → logRepo
//   この2つは必ずセットで呼ぶ
// =============================================================

class TicketService {
  private ticketRepo: TicketRepository;
  private logRepo:    TicketLogRepository;

  constructor() {
    this.ticketRepo = new TicketRepository();
    this.logRepo    = new TicketLogRepository();
  }

  // ----------------------------------------------------------
  // use: チケットを1回使用する
  // ----------------------------------------------------------

  /**
   * 有効チケットを1回消費する
   * @throws 有効チケットがない場合
   */
  use(userId: string): TicketUseResult {
    const ticket = this.ticketRepo.findActiveTicket(userId);

    if (!ticket) {
      throw new Error("有効なチケットがありません。");
    }

    if (ticket.remainingCount <= 0) {
      throw new Error("チケットの残数が0です。");
    }

    const remainingAfter = ticket.remainingCount - 1;

    // tickets と ticket_logs を必ずセットで更新
    this.ticketRepo.updateRemaining(ticket.ticketId, remainingAfter);
    this.logRepo.writeLog(
      userId,
      ticket.ticketId,
      "use",
      -1,
      remainingAfter,
      "チケット使用"
    );

    AppLogger.info("[TicketService] チケット使用", {
      userId, ticketId: ticket.ticketId, remainingAfter,
    });

    return { ticket, remainingAfter };
  }

  // ----------------------------------------------------------
  // add: チケットを付与する
  // ----------------------------------------------------------

  /**
   * ユーザーに指定種別のチケットを発行する
   * @throws 不正な ticket_type の場合
   */
  add(userId: string, type: TicketTypeKey): TicketEntity {
    if (!TicketTypes[type]) {
      throw new Error(
        `不正なチケット種別: "${type}"\n使用可能: ${Object.keys(TicketTypes).join(", ")}`
      );
    }

    // tickets と ticket_logs を必ずセットで更新
    const ticket = this.ticketRepo.createTicket(userId, type);
    this.logRepo.writeLog(
      userId,
      ticket.ticketId,
      "add",
      ticket.remainingCount,
      ticket.remainingCount,
      `チケット発行: ${TicketTypes[type].name}`
    );

    AppLogger.info("[TicketService] チケット発行", {
      userId, ticketId: ticket.ticketId, type,
    });

    return ticket;
  }

  // ----------------------------------------------------------
  // check: 保有状況を確認する
  // ----------------------------------------------------------

  check(userId: string): TicketCheckResult {
    const tickets = this.ticketRepo.findByUserId(userId);
    const now     = new Date();

    const activeTickets  = tickets.filter(
      (t) => t.remainingCount > 0 && new Date(t.expireDate) > now
    );
    const expiredTickets = tickets.filter(
      (t) => t.remainingCount === 0 || new Date(t.expireDate) <= now
    );
    const totalRemaining = activeTickets.reduce(
      (sum, t) => sum + t.remainingCount, 0
    );

    return { tickets, activeTickets, expiredTickets, totalRemaining };
  }

  // ----------------------------------------------------------
  // 管理者コマンド用ユーティリティ
  // ----------------------------------------------------------

  findUserByShortId(shortId: string): UserEntity | null {
    return new UserRepository().findByShortId(shortId);
  }
}

// ----------------------------------------------------------
// Result 型
// ----------------------------------------------------------

interface TicketUseResult {
  ticket:         TicketEntity;
  remainingAfter: number;
}

interface TicketCheckResult {
  tickets:        TicketEntity[];
  activeTickets:  TicketEntity[];
  expiredTickets: TicketEntity[];
  totalRemaining: number;
}
