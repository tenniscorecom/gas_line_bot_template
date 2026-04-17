// =============================================================
// src/controller/FollowController.ts
// フォロー・アンフォローイベントのコントローラー
// =============================================================

class FollowController {
  private static readonly userService = new UserService();

  static handleFollow(event: LineFollowEvent): void {
    const userId = event.source.userId;
    if (!userId) return;

    AppLogger.info("[FollowController] フォロー", { userId });
    const user = this.userService.registerOnFollow(userId);

    ReplyService.replyText(
      event.replyToken,
      [
        `${user.displayName} さん、フォローありがとうございます！🎉`,
        ``,
        `あなたのお客様番号: ${user.shortId}`,
        ``,
        `/help でコマンド一覧を確認できます。`,
      ].join("\n")
    );
  }

  static handleUnfollow(event: LineUnfollowEvent): void {
    const userId = event.source.userId;
    AppLogger.info("[FollowController] アンフォロー", { userId });
  }
}

// =============================================================
// src/controller/PostbackController.ts
// ポストバックイベントのコントローラー
// data 形式: "action=xxx&key=value&..."
// =============================================================

class PostbackController {
  static handle(event: LinePostbackEvent): void {
    const data   = event.postback.data;
    const params = this.parsePostbackData(data);
    const action = params["action"] ?? "";

    AppLogger.info("[PostbackController] ポストバック受信", { action, params });

    switch (action) {
      case "ticket_issue":
        this.handleTicketIssue(event, params);
        break;
      case "ticket_use":
        this.handleTicketUse(event, params);
        break;
      default:
        AppLogger.warn("[PostbackController] 未知のアクション", { action });
        ReplyService.replyText(event.replyToken, "不明な操作です。");
    }
  }

  // ----------------------------------------------------------
  // ticket_issue: 管理者がプランを選択してチケット発行
  // ----------------------------------------------------------

  private static handleTicketIssue(
    event: LinePostbackEvent,
    params: Record<string, string>
  ): void {
    const shortId  = params["shortId"]  ?? "";
    const planKey  = params["planKey"]  as TicketPlanKey;

    if (!shortId || !planKey || !TICKET_PLANS[planKey]) {
      ReplyService.replyText(event.replyToken, "パラメータが不正です。");
      return;
    }

    const ticketService = new TicketService();
    const userRepo      = new UserRepository();

    const ticket = ticketService.issueByShortId(shortId, planKey);
    if (!ticket) {
      ReplyService.replyText(
        event.replyToken,
        `ショートID「${shortId}」のユーザーが見つかりません。`
      );
      return;
    }

    const user = userRepo.findByShortId(shortId);
    if (!user) return;

    const message = ticketService.buildIssueResultMessage(ticket, user);
    ReplyService.replyText(event.replyToken, message);
  }

  // ----------------------------------------------------------
  // ticket_use: ユーザーがチケットを選択して使用
  // ----------------------------------------------------------

  private static handleTicketUse(
    event: LinePostbackEvent,
    params: Record<string, string>
  ): void {
    const userId   = event.source.userId;
    const ticketId = params["ticketId"] ?? "";

    if (!userId || !ticketId) {
      ReplyService.replyText(event.replyToken, "パラメータが不正です。");
      return;
    }

    const result = new TicketService().use(userId, ticketId);
    ReplyService.replyText(event.replyToken, result);
  }

  // ----------------------------------------------------------
  // ヘルパー
  // ----------------------------------------------------------

  private static parsePostbackData(data: string): Record<string, string> {
    const result: Record<string, string> = {};
    data.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key) result[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
    });
    return result;
  }
}
