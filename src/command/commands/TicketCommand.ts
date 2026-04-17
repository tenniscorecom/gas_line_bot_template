// =============================================================
// src/command/commands/TicketCommand.ts
//
// 全員向け:
//   /ticket use            有効チケットを1回使用
//   /ticket check          保有チケットの残数・期限確認
//
// 管理者向け（ADMIN_USER_IDS に含まれるユーザーのみ）:
//   /ticket add <shortId> <type>   チケット付与
//                                  type: 4_3m | 8_3m | 8_6m
// =============================================================

class TicketCommand extends BaseCommand {
  readonly name        = "ticket";
  readonly description = "/ticket use | check - チケットの使用・確認";
  readonly requiresAdmin = false;

  private readonly ticketService: TicketService;
  private readonly userService:   UserService;

  constructor() {
    super();
    this.ticketService = new TicketService();
    this.userService   = new UserService();
  }

  execute(event: LineMessageEvent, args: string[]): void {
    const subCommand = (args[0] ?? "").toLowerCase();

    switch (subCommand) {
      case "use":
        this.handleUse(event);
        break;
      case "check":
        this.handleCheck(event);
        break;
      case "add":
        this.handleAdd(event, args);
        break;
      default:
        ReplyService.replyText(
          event.replyToken,
          "使い方:\n/ticket use - チケット使用\n/ticket check - チケット確認"
        );
    }
  }

  // ----------------------------------------------------------
  // /ticket use（全員）
  // ----------------------------------------------------------

  private handleUse(event: LineMessageEvent): void {
    const userId = event.source.userId;
    if (!userId) return;

    try {
      const result = this.ticketService.use(userId);
      const expire = result.ticket.expireDate.slice(0, 10);

      const lines = [
        "✅ チケットを使用しました",
        "",
        `種別: ${TicketTypes[result.ticket.ticketType].name}`,
        `残り: ${result.remainingAfter}回`,
        `期限: ${expire}`,
      ];

      if (result.remainingAfter === 0) {
        lines.push("", "⚠️ このチケットの残数が0になりました。");
      } else if (result.remainingAfter <= 2) {
        lines.push("", `⚠️ 残り${result.remainingAfter}回です。お早めにご確認ください。`);
      }

      ReplyService.replyText(event.replyToken, lines.join("\n"));

    } catch (e) {
      ReplyService.replyText(
        event.replyToken,
        `❌ ${String(e instanceof Error ? e.message : e)}`
      );
    }
  }

  // ----------------------------------------------------------
  // /ticket check（全員）
  // ----------------------------------------------------------

  private handleCheck(event: LineMessageEvent): void {
    const userId = event.source.userId;
    if (!userId) return;

    try {
      const result = this.ticketService.check(userId);

      if (result.tickets.length === 0) {
        ReplyService.replyText(event.replyToken, "チケットをお持ちではありません。");
        return;
      }

      const lines: string[] = ["🎾 チケット残数", ""];

      // 有効チケット
      if (result.activeTickets.length > 0) {
        lines.push("【有効】");
        result.activeTickets.forEach((t) => {
          const name   = TicketTypes[t.ticketType].name;
          const expire = t.expireDate.slice(0, 10);
          lines.push(`・${name}　残${t.remainingCount}回　期限:${expire}`);
        });
        lines.push(`合計: ${result.totalRemaining}回`);
      } else {
        lines.push("有効なチケットがありません。");
      }

      // 期限切れ・使い切りは件数だけ表示
      if (result.expiredTickets.length > 0) {
        lines.push("", `【終了済】${result.expiredTickets.length}件`);
      }

      ReplyService.replyText(event.replyToken, lines.join("\n"));

    } catch (e) {
      ReplyService.replyText(
        event.replyToken,
        `❌ ${String(e instanceof Error ? e.message : e)}`
      );
    }
  }

  // ----------------------------------------------------------
  // /ticket add <shortId> <type>（管理者のみ）
  // ----------------------------------------------------------

  private handleAdd(event: LineMessageEvent, args: string[]): void {
    const adminId = event.source.userId;
    if (!adminId) return;

    // 権限チェック
    if (!this.userService.isAdmin(adminId)) {
      ReplyService.replyText(event.replyToken, "⛔ このコマンドは管理者のみ使用できます。");
      return;
    }

    const shortId  = args[1];
    const typeKey  = args[2] as TicketTypeKey | undefined;

    // 引数チェック
    if (!shortId || !typeKey) {
      const typeList = Object.entries(TicketTypes)
        .map(([k, v]) => `  ${k}: ${v.name}`)
        .join("\n");
      ReplyService.replyText(
        event.replyToken,
        `使い方: /ticket add <ショートID> <種別>\n\n種別一覧:\n${typeList}`
      );
      return;
    }

    if (!TicketTypes[typeKey]) {
      const typeList = Object.keys(TicketTypes).join(", ");
      ReplyService.replyText(
        event.replyToken,
        `❌ 種別「${typeKey}」は存在しません。\n使用可能: ${typeList}`
      );
      return;
    }

    // ユーザー検索
    const user = this.ticketService.findUserByShortId(shortId);
    if (!user) {
      ReplyService.replyText(
        event.replyToken,
        `❌ ショートID「${shortId}」のユーザーが見つかりません。`
      );
      return;
    }

    // チケット付与
    try {
      const ticket = this.ticketService.add(user.userId, typeKey);
      const plan   = TicketTypes[typeKey];
      const expire = ticket.expireDate.slice(0, 10);

      ReplyService.replyText(
        event.replyToken,
        [
          "✅ チケットを発行しました",
          "",
          `お客様: ${user.displayName}（${user.shortId}）`,
          `種別: ${plan.name}`,
          `残り: ${ticket.remainingCount}回`,
          `期限: ${expire}`,
        ].join("\n")
      );

    } catch (e) {
      ReplyService.replyText(
        event.replyToken,
        `❌ ${String(e instanceof Error ? e.message : e)}`
      );
    }
  }
}
