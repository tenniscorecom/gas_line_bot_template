// =============================================================
// src/types/line.ts
// LINE Messaging API の型定義
// =============================================================

/** Webhookリクエストのルートボディ */
interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

/** イベントの共通プロパティ */
interface LineEventBase {
  type: LineEventType;
  mode: "active" | "standby" | "connecting";
  timestamp: number;
  source: LineSource;
  webhookEventId: string;
  deliveryContext: {
    isRedelivery: boolean;
  };
}

/** イベント種別 */
type LineEventType =
  | "message"
  | "follow"
  | "unfollow"
  | "postback"
  | "join"
  | "leave"
  | "memberJoined"
  | "memberLeft"
  | "unsend"
  | "videoPlayComplete";

/** メッセージイベント */
interface LineMessageEvent extends LineEventBase {
  type: "message";
  replyToken: string;
  message: LineMessage;
}

/** フォローイベント */
interface LineFollowEvent extends LineEventBase {
  type: "follow";
  replyToken: string;
}

/** アンフォローイベント */
interface LineUnfollowEvent extends LineEventBase {
  type: "unfollow";
}

/** ポストバックイベント */
interface LinePostbackEvent extends LineEventBase {
  type: "postback";
  replyToken: string;
  postback: {
    data: string;
    params?: Record<string, string>;
  };
}

/** その他のイベント（拡張用） */
interface LineOtherEvent extends LineEventBase {
  type: Exclude<LineEventType, "message" | "follow" | "unfollow" | "postback">;
  replyToken?: string;
}

/** イベントのユニオン型 */
type LineEvent =
  | LineMessageEvent
  | LineFollowEvent
  | LineUnfollowEvent
  | LinePostbackEvent
  | LineOtherEvent;

// ---------- Source ----------

type LineSource = LineUserSource | LineGroupSource | LineRoomSource;

interface LineUserSource {
  type: "user";
  userId: string;
}

interface LineGroupSource {
  type: "group";
  groupId: string;
  userId?: string;
}

interface LineRoomSource {
  type: "room";
  roomId: string;
  userId?: string;
}

// ---------- Message ----------

type LineMessage =
  | LineTextMessage
  | LineImageMessage
  | LineStickerMessage
  | LineVideoMessage
  | LineAudioMessage
  | LineFileMessage
  | LineLocationMessage
  | LineOtherMessage;

interface LineMessageBase {
  id: string;
  type: LineMessageType;
  quoteToken?: string;
}

type LineMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "location"
  | "sticker"
  | "template"
  | "flex";

interface LineTextMessage extends LineMessageBase {
  type: "text";
  text: string;
  emojis?: LineEmoji[];
  mention?: LineMention;
}

interface LineImageMessage extends LineMessageBase {
  type: "image";
  contentProvider: LineContentProvider;
}

interface LineStickerMessage extends LineMessageBase {
  type: "sticker";
  packageId: string;
  stickerId: string;
  stickerResourceType?: string;
  keywords?: string[];
}

interface LineVideoMessage extends LineMessageBase {
  type: "video";
  duration: number;
  contentProvider: LineContentProvider;
}

interface LineAudioMessage extends LineMessageBase {
  type: "audio";
  duration: number;
  contentProvider: LineContentProvider;
}

interface LineFileMessage extends LineMessageBase {
  type: "file";
  fileName: string;
  fileSize: number;
}

interface LineLocationMessage extends LineMessageBase {
  type: "location";
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LineOtherMessage extends LineMessageBase {
  type: Exclude<LineMessageType, "text" | "image" | "sticker" | "video" | "audio" | "file" | "location">;
}

interface LineContentProvider {
  type: "line" | "external";
  originalContentUrl?: string;
  previewImageUrl?: string;
}

interface LineEmoji {
  index: number;
  length: number;
  productId: string;
  emojiId: string;
}

interface LineMention {
  mentionees: LineMentionee[];
}

interface LineMentionee {
  index: number;
  length: number;
  type: "user" | "all";
  userId?: string;
}

// ---------- Reply Message ----------

type LineSendMessage =
  | LineSendTextMessage
  | LineSendImageMessage
  | LineSendStickerMessage
  | LineSendFlexMessage
  | LineSendTemplateMessage;

interface LineSendTextMessage {
  type: "text";
  text: string;
  emojis?: LineEmoji[];
}

interface LineSendImageMessage {
  type: "image";
  originalContentUrl: string;
  previewImageUrl: string;
}

interface LineSendStickerMessage {
  type: "sticker";
  packageId: string;
  stickerId: string;
}

interface LineSendFlexMessage {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
}

interface LineSendTemplateMessage {
  type: "template";
  altText: string;
  template: Record<string, unknown>;
}

interface LineReplyRequest {
  replyToken: string;
  messages: LineSendMessage[];
  notificationDisabled?: boolean;
}
