// =============================================================
// src/command/commands/AdminCommand.ts
// /admin サブコマンド群（管理者専用）
// /admin user <userId> - 管理者権限トグル
// /admin summary       - ユーザーサマリー表示
// =============================================================

class AdminCommand extends BaseCommand {
  readonly name = "admin";
  readonly description = "/admin user <userId> | summary - 管理者操作";
  readonly requiresAdmin = true; // 権限チェックは TextController が行う

  private readonly userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  execute(event: LineMessageEvent, args: string[]): void {
    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case "user":
        this.handleToggleAdmin(event, args);
        break;
      case "summary":
        this.handleSummary(event);
        break;
      default:
        ReplyService.replyText(
          event.replyToken,
          "管理者コマンド:\n/admin user <userId> - 管理者権限切替\n/admin summary - ユーザーサマリー"
        );
    }
  }

  // ----------------------------------------------------------
  // Private handlers
  // ----------------------------------------------------------

  private handleToggleAdmin(event: LineMessageEvent, args: string[]): void {
    const targetUserId = args[1];
    if (!targetUserId) {
      ReplyService.replyText(
        event.replyToken,
        "対象のユーザーIDを指定してください。\n例: /admin user U1234567890"
      );
      return;
    }
    const result = this.userService.toggleAdmin(targetUserId);
    ReplyService.replyText(event.replyToken, result);
  }

  private handleSummary(event: LineMessageEvent): void {
    const summary = this.userService.getUserSummary();
    ReplyService.replyText(event.replyToken, `📊 ${summary}`);
  }
}
