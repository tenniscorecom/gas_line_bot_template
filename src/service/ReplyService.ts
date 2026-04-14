// =============================================================
// src/service/ReplyService.ts
// LINE Messaging API の Reply エンドポイントをラップするサービス
// =============================================================

class ReplyService {
  private static readonly REPLY_URL =
    "https://api.line.me/v2/bot/message/reply";

  /**
   * テキストメッセージを返信する
   */
  static replyText(replyToken: string, ...texts: string[]): void {
    const messages: LineSendTextMessage[] = texts.map((text) => ({
      type: "text",
      text,
    }));
    this.reply(replyToken, messages);
  }

  /**
   * 複数のメッセージをまとめて返信する（最大5件）
   */
  static reply(replyToken: string, messages: LineSendMessage[]): void {
    if (messages.length === 0) {
      AppLogger.warn("[ReplyService] 返信メッセージが空です");
      return;
    }
    if (messages.length > 5) {
      AppLogger.warn("[ReplyService] メッセージは最大5件です。先頭5件のみ送信します");
      messages = messages.slice(0, 5);
    }

    const payload: LineReplyRequest = {
      replyToken,
      messages,
      notificationDisabled: false,
    };

    this.callApi(payload);
  }

  /**
   * フレックスメッセージを返信する
   */
  static replyFlex(
    replyToken: string,
    altText: string,
    contents: Record<string, unknown>
  ): void {
    const message: LineSendFlexMessage = {
      type: "flex",
      altText,
      contents,
    };
    this.reply(replyToken, [message]);
  }

  // ----------------------------------------------------------
  // Private
  // ----------------------------------------------------------

  private static callApi(payload: LineReplyRequest): void {
    const config = Config.get();

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.channelAccessToken}`,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(this.REPLY_URL, options);
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      AppLogger.error("[ReplyService] API エラー", {
        statusCode,
        body: response.getContentText(),
      });
    } else {
      AppLogger.info("[ReplyService] 返信成功", { statusCode });
    }
  }
}
