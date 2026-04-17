// =============================================================
// src/command/BaseCommand.ts
// コマンドの基底クラス
// 継承してインスタンス化するだけで CommandRegistry に自動登録される
// =============================================================

abstract class BaseCommand {
  /**
   * コマンド名（スラッシュなし・小文字）
   * 例: "ticket", "admin", "help"
   */
  abstract readonly name: string;

  /**
   * ヘルプに表示するコマンド説明
   * 例: "/ticket use <ID> - チケットを使用する"
   */
  abstract readonly description: string;

  /**
   * コマンドの実行エントリーポイント
   * @param event LINE メッセージイベント
   * @param args  コマンド名以降のトークン列
   *              例: "/ticket use ABC" → args = ["use", "ABC"]
   */
  abstract execute(event: LineMessageEvent, args: string[]): void;

  /**
   * 管理者専用コマンドかどうか
   * true の場合、TextController が実行前に権限チェックを行う
   */
  readonly requiresAdmin: boolean = false;
}
