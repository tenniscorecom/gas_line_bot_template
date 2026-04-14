// =============================================================
// src/controller/TextController.ts
// テキストメッセージの処理
//
// CommandRegistry にクエリを投げてコマンドを検索・実行する。
// 新コマンドは Main.ts に new XxxCommand() を追加するだけ。
// TextController 自体は一切変更不要。
// =============================================================

class TextController {
  /**
   * テキストメッセージのエントリーポイント（MessageRouter から呼ばれる）
   */
  static handle(event: LineMessageEvent): void {
    const message = event.message as LineTextMessage;
    const text = message.text.trim();

    if (text.startsWith("/")) {
      this.dispatchCommand(event, text);
    } else {
      this.handleFreeText(event, text);
    }
  }

  // ----------------------------------------------------------
  // Private
  // ----------------------------------------------------------

  /**
   * テキストをパースして CommandRegistry から対応コマンドを検索・実行する
   * 例: "/ticket use ABC" → name="ticket", args=["use","ABC"]
   */
  private static dispatchCommand(
    event: LineMessageEvent,
    text: string
  ): void {
    const parts = text.slice(1).trim().split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = CommandRegistry.find(commandName);

    if (!command) {
      AppLogger.info("[TextController] 未知のコマンド", { commandName });
      ReplyService.replyText(
        event.replyToken,
        `「/${commandName}」は存在しないコマンドです。\n/help でコマンド一覧を確認してください。`
      );
      return;
    }

    // 管理者専用コマンドの権限チェック
    if (command.requiresAdmin) {
      const userId = event.source.userId ?? "";
      const userService = new UserService();
      if (!userService.isAdmin(userId)) {
        AppLogger.warn("[TextController] 権限なし", { commandName, userId });
        ReplyService.replyText(
          event.replyToken,
          "⛔ このコマンドは管理者のみ使用できます。"
        );
        return;
      }
    }

    AppLogger.info("[TextController] コマンド実行", { commandName, args });
    command.execute(event, args);
  }

  /** コマンド以外の自由テキスト処理 */
  private static handleFreeText(
    event: LineMessageEvent,
    text: string
  ): void {
    AppLogger.info("[TextController] 自由文受信", { text });
    ReplyService.replyText(
      event.replyToken,
      `「${text}」と言いましたね！\nコマンドは /help で確認できます。`
    );
  }
}
