// =============================================================
// src/command/CommandRegistry.ts
// コマンドの登録・検索を管理するレジストリ
//
// 使い方:
//   CommandRegistry.register(new HelpCommand());
//   CommandRegistry.register(new TicketCommand());
//   // → その後は自動でコマンド名から検索される
// =============================================================

class CommandRegistry {
  private static readonly commands: Map<string, BaseCommand> = new Map();

  // ----------------------------------------------------------
  // 登録
  // ----------------------------------------------------------

  /**
   * コマンドをレジストリに登録する
   * コマンド名の重複時はエラーログを出して後勝ちにする
   */
  static register(command: BaseCommand): void {
    const key = command.name.toLowerCase();

    if (this.commands.has(key)) {
      AppLogger.warn("[CommandRegistry] コマンド名が重複しています（上書き）", {
        name: key,
      });
    }

    this.commands.set(key, command);
    AppLogger.info("[CommandRegistry] コマンド登録", { name: key });
  }

  /**
   * 複数コマンドをまとめて登録する
   */
  static registerAll(commands: BaseCommand[]): void {
    commands.forEach((cmd) => this.register(cmd));
  }

  // ----------------------------------------------------------
  // 検索
  // ----------------------------------------------------------

  /**
   * コマンド名でコマンドを検索する
   * @returns 見つかった BaseCommand、なければ null
   */
  static find(name: string): BaseCommand | null {
    return this.commands.get(name.toLowerCase()) ?? null;
  }

  /**
   * 登録済みコマンドをすべて返す
   */
  static getAll(): BaseCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * 登録済みコマンド数を返す
   */
  static count(): number {
    return this.commands.size;
  }

  /**
   * テスト・再初期化用にレジストリをクリアする
   */
  static clear(): void {
    this.commands.clear();
  }
}
