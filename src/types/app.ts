// =============================================================
// src/types/app.ts
// アプリケーション共通の型定義・定数
// =============================================================

/** スプレッドシートの行データ（汎用） */
type SheetRow = (string | number | boolean | Date)[];

// ----------------------------------------------------------
// チケット種別マスタ
// ----------------------------------------------------------

const TicketTypes = {
  "4_3m": { name: "4回券（3ヶ月）", count: 4,  expireDays: 90  },
  "8_3m": { name: "8回券（3ヶ月）", count: 8,  expireDays: 90  },
  "8_6m": { name: "8回券（6ヶ月）", count: 8,  expireDays: 180 },
} as const;

type TicketTypeKey = keyof typeof TicketTypes;

// ----------------------------------------------------------
// チケット
// ----------------------------------------------------------

/** tickets シートのエンティティ */
interface TicketEntity {
  ticketId:       string;
  userId:         string;
  ticketType:     TicketTypeKey;
  remainingCount: number;
  expireDate:     string;   // "yyyy-MM-dd HH:mm:ss"
  createdAt:      string;   // "yyyy-MM-dd HH:mm:ss"
}

/** ticket_logs シートのエンティティ */
interface TicketLogEntity {
  logId:          string;
  userId:         string;
  ticketId:       string;
  action:         TicketLogAction;
  count:          number;   // 増減値（使用なら -1、付与なら +n）
  remainingAfter: number;
  createdAt:      string;
  note:           string;
}

type TicketLogAction = "use" | "add" | "adjust" | "expire";

// ----------------------------------------------------------
// ユーザー
// ----------------------------------------------------------

/** ユーザーエンティティ */
interface UserEntity {
  userId:      string;
  displayName: string;
  shortId:     string;   // 管理用ショートID（4桁数字）
  followedAt:  string;
  isAdmin:     boolean;
  memo:        string;
}

// ----------------------------------------------------------
// アプリケーション設定
// ----------------------------------------------------------

interface AppConfig {
  channelAccessToken: string;
  channelSecret:      string;
  spreadsheetId:      string;
  adminUserIds:       string[];
}

const CONFIG_KEYS = {
  CHANNEL_ACCESS_TOKEN: "CHANNEL_ACCESS_TOKEN",
  CHANNEL_SECRET:       "CHANNEL_SECRET",
  SPREADSHEET_ID:       "SPREADSHEET_ID",
  ADMIN_USER_IDS:       "ADMIN_USER_IDS",
} as const;

const SHEET_NAMES = {
  USERS:       "users",
  TICKETS:     "tickets",
  TICKET_LOGS: "ticket_logs",
  LOGS:        "logs",   // アプリログ（エラー記録）
} as const;
