// =============================================================
// src/types/app.ts
// アプリケーション共通の型定義
// =============================================================

/** コマンドハンドラの型 */
type CommandHandler = (event: LineMessageEvent, args: string[]) => void;

/** コマンドマップの型 */
type CommandMap = Record<string, CommandHandler>;

/** スプレッドシートの行データ（汎用） */
type SheetRow = (string | number | boolean | Date)[];

/** ユーザーエンティティ */
interface UserEntity {
  userId: string;
  displayName: string;
  followedAt: string;
  isAdmin: boolean;
  memo: string;
}

/** チケットエンティティ */
interface TicketEntity {
  ticketId: string;
  userId: string;
  status: "unused" | "used" | "expired";
  issuedAt: string;
  usedAt: string;
}

/** アプリケーション設定 */
interface AppConfig {
  channelAccessToken: string;
  channelSecret: string;
  spreadsheetId: string;
  adminUserIds: string[];
}

/** Config キー（PropertiesService のキー名） */
const CONFIG_KEYS = {
  CHANNEL_ACCESS_TOKEN: "CHANNEL_ACCESS_TOKEN",
  CHANNEL_SECRET: "CHANNEL_SECRET",
  SPREADSHEET_ID: "SPREADSHEET_ID",
  ADMIN_USER_IDS: "ADMIN_USER_IDS",
} as const;

/** スプレッドシートのシート名 */
const SHEET_NAMES = {
  USERS: "users",
  TICKETS: "tickets",
  LOGS: "logs",
} as const;
