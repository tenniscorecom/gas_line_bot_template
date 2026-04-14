// =============================================================
// src/controller/FollowController.ts
// フォロー・アンフォローイベントのコントローラー
// =============================================================

class FollowController {
  private static readonly userService = new UserService();

  /** フォローイベントのエントリーポイント */
  static handleFollow(event: LineFollowEvent): void {
    const userId = event.source.userId;
    if (!userId) return;

    AppLogger.info("[FollowController] フォロー", { userId });
    const user = this.userService.registerOnFollow(userId);

    ReplyService.replyText(
      event.replyToken,
      `${user.displayName} さん、フォローありがとうございます！🎉\n\n/help でコマンド一覧を確認できます。`
    );
  }

  /** アンフォローイベントのエントリーポイント（返信不可） */
  static handleUnfollow(event: LineUnfollowEvent): void {
    const userId = event.source.userId;
    AppLogger.info("[FollowController] アンフォロー", { userId });
    // アンフォロー時は replyToken がないため返信不可
    // 必要であればここでDBのフラグを更新するなどの処理を行う
  }
}

// =============================================================
// src/controller/PostbackController.ts
// ポストバックイベントのコントローラー
// =============================================================

class PostbackController {
  /**
   * ポストバックイベントのエントリーポイント
   * data 形式: "action=xxx&param=yyy" を想定
   */
  static handle(event: LinePostbackEvent): void {
    const data = event.postback.data;
    AppLogger.info("[PostbackController] ポストバック受信", { data });

    const params = this.parsePostbackData(data);
    const action = params["action"] ?? "";

    switch (action) {
      case "ticket_use":
        this.handleTicketUse(event, params);
        break;
      case "ticket_check":
        this.handleTicketCheck(event);
        break;
      default:
        AppLogger.warn("[PostbackController] 未知のアクション", { action });
        ReplyService.replyText(event.replyToken, "不明な操作です。");
    }
  }

  // ----------------------------------------------------------
  // Private handlers
  // ----------------------------------------------------------

  private static handleTicketUse(
    event: LinePostbackEvent,
    params: Record<string, string>
  ): void {
    const userId = event.source.userId;
    if (!userId) return;

    const ticketId = params["ticketId"] ?? "";
    const result = new TicketService().use(userId, ticketId);
    ReplyService.replyText(event.replyToken, result);
  }

  private static handleTicketCheck(event: LinePostbackEvent): void {
    const userId = event.source.userId;
    if (!userId) return;

    const result = new TicketService().check(userId);
    ReplyService.replyText(event.replyToken, result);
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  /** "key=value&key2=value2" を Record に変換 */
  private static parsePostbackData(data: string): Record<string, string> {
    const result: Record<string, string> = {};
    data.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key) result[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
    });
    return result;
  }
}
