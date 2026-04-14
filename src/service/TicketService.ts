// =============================================================
// src/service/TicketService.ts
// チケットに関するビジネスロジック
// =============================================================

class TicketService {
  private ticketRepo: TicketRepository;
  private userService: UserService;

  constructor() {
    this.ticketRepo = new TicketRepository();
    this.userService = new UserService();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  /**
   * チケットを1枚発行する
   */
  issue(userId: string): string {
    // ユーザーが存在することを保証
    this.userService.ensureUser(userId);
    const ticket = this.ticketRepo.issue(userId);
    return `チケットを発行しました 🎫\nチケットID: ${ticket.ticketId.slice(0, 8).toUpperCase()}`;
  }

  /**
   * チケットを使用する
   * @param userId  操作ユーザー
   * @param ticketIdPrefix チケットID先頭8文字（または完全ID）
   */
  use(userId: string, ticketIdPrefix: string): string {
    const tickets = this.ticketRepo.findUnusedByUserId(userId);

    // 先頭文字列でマッチング
    const target = tickets.find((t) =>
      t.ticketId.toUpperCase().startsWith(ticketIdPrefix.toUpperCase())
    );

    if (!target) {
      return `未使用のチケット "${ticketIdPrefix}" が見つかりません。\n/ticket check で保有チケットを確認してください。`;
    }

    const success = this.ticketRepo.use(target.ticketId);
    if (!success) {
      return "チケットの使用に失敗しました。すでに使用済みか期限切れです。";
    }

    return `チケット ${ticketIdPrefix.toUpperCase()} を使用しました ✅`;
  }

  /**
   * 保有チケット一覧を返す
   */
  check(userId: string): string {
    const tickets = this.ticketRepo.findByUserId(userId);

    if (tickets.length === 0) {
      return "チケットを1枚も持っていません。";
    }

    const unused = tickets.filter((t) => t.status === "unused");
    const used = tickets.filter((t) => t.status === "used");

    const lines: string[] = [
      `🎫 チケット保有状況`,
      `未使用: ${unused.length}枚 / 使用済み: ${used.length}枚`,
      "",
    ];

    unused.forEach((t) => {
      lines.push(`・${t.ticketId.slice(0, 8).toUpperCase()} [未使用] 発行:${t.issuedAt}`);
    });
    used.forEach((t) => {
      lines.push(`・${t.ticketId.slice(0, 8).toUpperCase()} [使用済] 使用:${t.usedAt}`);
    });

    return lines.join("\n");
  }
}
