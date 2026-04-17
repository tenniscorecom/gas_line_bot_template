// =============================================================
// src/command/commands/UserCommand.ts
// 管理者専用：ユーザー管理コマンド
//
// /user summary            登録ユーザーのサマリー表示
// /user admin <userId>     管理者権限のトグル
//
// requiresAdmin = true なので ADMIN_USER_IDS 外のユーザーは
// TextController の段階で弾かれ、このクラスまで到達しない。
// =============================================================

class UserCommand extends BaseCommand {
  readonly name = "user";
  readonly description = "/user summary | admin <userId> - ユーザー管理（管理者専用）";
  readonly requiresAdmin = true;

  private readonly userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  execute(event: LineMessageEvent, args: string[]): void {
    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case "summary":
        this.handleSummary(event);
        break;
      case "admin":
        this.handleToggleAdmin(event, args);
        break;
      default:
        ReplyService.replyText(
          event.replyToken,
          "使い方:\n/user summary - ユーザーサマリー\n/user admin <userId> - 管理者権限切替"
        );
    }
  }

  // ----------------------------------------------------------
  // /user summary
  // ----------------------------------------------------------

  private handleSummary(event: LineMessageEvent): void {
    const summary = this.userService.getUserSummary();
    ReplyService.replyText(event.replyToken, `📊 ${summary}`);
  }

  // ----------------------------------------------------------
  // /user admin <userId>
  // ----------------------------------------------------------

  private handleToggleAdmin(event: LineMessageEvent, args: string[]): void {
    const targetUserId = args[1];
    if (!targetUserId) {
      ReplyService.replyText(
        event.replyToken,
        "対象のユーザーIDを指定してください。\n例: /user admin U1234567890"
      );
      return;
    }
    const result = this.userService.toggleAdmin(targetUserId);
    ReplyService.replyText(event.replyToken, result);
  }
}
