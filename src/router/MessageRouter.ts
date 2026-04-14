// =============================================================
// src/router/MessageRouter.ts
// メッセージタイプ別ルーティング
// text / image / sticker / その他
// =============================================================

class MessageRouter {
  /**
   * メッセージイベントをタイプで分岐する
   */
  static route(event: LineMessageEvent): void {
    const messageType = event.message.type;

    switch (messageType) {
      case "text":
        TextController.handle(event);
        break;

      case "image":
        this.handleImage(event);
        break;

      case "sticker":
        this.handleSticker(event);
        break;

      default:
        AppLogger.info("[MessageRouter] 未対応メッセージタイプ", { messageType });
        ReplyService.replyText(
          event.replyToken,
          "このメッセージタイプには対応していません。"
        );
    }
  }

  // ----------------------------------------------------------
  // Private handlers
  // ----------------------------------------------------------

  private static handleImage(event: LineMessageEvent): void {
    AppLogger.info("[MessageRouter] 画像メッセージ受信", {
      messageId: event.message.id,
    });
    // 必要であれば画像取得・保存処理を実装する
    ReplyService.replyText(event.replyToken, "画像を受け取りました 📷");
  }

  private static handleSticker(event: LineMessageEvent): void {
    const sticker = event.message as LineStickerMessage;
    AppLogger.info("[MessageRouter] スタンプ受信", {
      packageId: sticker.packageId,
      stickerId: sticker.stickerId,
    });
    // スタンプには絵文字で返す（お好みで変更）
    ReplyService.replyText(event.replyToken, "😊");
  }
}
