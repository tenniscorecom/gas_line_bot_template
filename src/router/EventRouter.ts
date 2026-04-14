// =============================================================
// src/router/EventRouter.ts
// LINE Webhook イベント種別ルーティング
// message / follow / unfollow / postback / その他
// =============================================================

class EventRouter {
  /**
   * イベント配列をループし、タイプごとに対応コントローラーへ振り分ける
   */
  static route(events: LineEvent[]): void {
    events.forEach((event) => {
      try {
        this.dispatch(event);
      } catch (e) {
        AppLogger.error("[EventRouter] イベント処理中にエラー", {
          eventType: event.type,
          error: String(e),
        });
        // 1イベントのエラーで全体が止まらないよう握りつぶす
      }
    });
  }

  // ----------------------------------------------------------
  // Private
  // ----------------------------------------------------------

  private static dispatch(event: LineEvent): void {
    switch (event.type) {
      case "message":
        MessageRouter.route(event as LineMessageEvent);
        break;

      case "follow":
        FollowController.handleFollow(event as LineFollowEvent);
        break;

      case "unfollow":
        FollowController.handleUnfollow(event as LineUnfollowEvent);
        break;

      case "postback":
        PostbackController.handle(event as LinePostbackEvent);
        break;

      default:
        AppLogger.info("[EventRouter] 未対応イベントタイプ", {
          type: event.type,
        });
    }
  }
}
