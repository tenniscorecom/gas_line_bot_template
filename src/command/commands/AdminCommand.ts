// =============================================================
// src/command/commands/HelpCommand.ts
// /help コマンド
// CommandRegistry からコマンド一覧を動的に生成する
// =============================================================

class HelpCommand extends BaseCommand {
  readonly name = "help";
  readonly description = "/help - 使用できるコマンド一覧を表示";
  readonly requiresAdmin = false;

  execute(event: LineMessageEvent, _args: string[]): void {
    const allCommands = CommandRegistry.getAll();

    const userService = new UserService();
    const userId = event.source.userId ?? "";
    const isAdmin = userService.isAdmin(userId);

    // 管理者でない場合は requiresAdmin=true のコマンドを非表示
    const visibleCommands = isAdmin
      ? allCommands
      : allCommands.filter((cmd) => !cmd.requiresAdmin);

    const lines: string[] = [
      "📖 コマンド一覧",
      "",
      ...visibleCommands.map((cmd) => cmd.description),
    ];

    ReplyService.replyText(event.replyToken, lines.join("\n"));
  }
}
