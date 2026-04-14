// =============================================================
// src/command/commands/ShopCommand.ts
// /shop コマンド（新規コマンド追加のサンプル）
//
// ★ このファイルを追加して Main.ts に new ShopCommand() を
//    1行追加するだけで /shop コマンドが動作します。
// =============================================================

class ShopCommand extends BaseCommand {
  readonly name = "shop";
  readonly description = "/shop - ショップを開く";
  readonly requiresAdmin = false;

  execute(event: LineMessageEvent, _args: string[]): void {
    // 実際のロジックはここに実装する
    ReplyService.replyText(
      event.replyToken,
      "🛍️ ショップへようこそ！\n現在準備中です。"
    );
  }
}
