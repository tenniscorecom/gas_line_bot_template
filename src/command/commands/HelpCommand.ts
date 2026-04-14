// =============================================================
// src/command/commands/TicketCommand.ts
// /ticket サブコマンド群
// /ticket use <ID>  - チケットを使用する
// /ticket check     - 保有チケットを確認する
// /ticket issue     - チケットを発行する（管理者のみ）
// =============================================================

class TicketCommand extends BaseCommand {
  readonly name = "ticket";
  readonly description = "/ticket use <ID> | check - チケットの使用・確認";
  readonly requiresAdmin = false;

  private readonly ticketService: TicketService;

  constructor() {
    super();
    this.ticketService = new TicketService();
  }

  execute(event: LineMessageEvent, args: string[]): void {
    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case "use":
        this.handleUse(event, args);
        break;
      case "check":
        this.handleCheck(event);
        break;
      case "issue":
        this.handleIssue(event);
        break;
      default:
        ReplyService.replyText(
          event.replyToken,
          "使い方:\n/ticket use <チケットID>\n/ticket check"
        );
    }
  }

  // ----------------------------------------------------------
  // Private handlers
  // ----------------------------------------------------------

  private handleUse(event: LineMessageEvent, args: string[]): void {
    const userId = event.source.userId;
    if (!userId) {
      ReplyService.replyText(event.replyToken, "ユーザーIDを取得できませんでした。");
      return;
    }
    const ticketIdPrefix = args[1];
    if (!ticketIdPrefix) {
      ReplyService.replyText(
        event.replyToken,
        "チケットIDを指定してください。\n例: /ticket use ABC12345"
      );
      return;
    }
    const result = this.ticketService.use(userId, ticketIdPrefix);
    ReplyService.replyText(event.replyToken, result);
  }

  private handleCheck(event: LineMessageEvent): void {
    const userId = event.source.userId;
    if (!userId) {
      ReplyService.replyText(event.replyToken, "ユーザーIDを取得できませんでした。");
      return;
    }
    const result = this.ticketService.check(userId);
    ReplyService.replyText(event.replyToken, result);
  }

  private handleIssue(event: LineMessageEvent): void {
    const userId = event.source.userId;
    if (!userId) {
      ReplyService.replyText(event.replyToken, "ユーザーIDを取得できませんでした。");
      return;
    }
    const userService = new UserService();
    if (!userService.isAdmin(userId)) {
      ReplyService.replyText(event.replyToken, "このサブコマンドは管理者のみ使用できます。");
      return;
    }
    const result = this.ticketService.issue(userId);
    ReplyService.replyText(event.replyToken, result);
  }
}
