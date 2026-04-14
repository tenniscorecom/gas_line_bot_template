// =============================================================
// src/app/Config.ts
// アプリケーション設定の読み込み
// PropertiesService（スクリプトプロパティ）から取得する
// =============================================================

class Config {
  private static instance: AppConfig | null = null;

  /**
   * アプリ設定をシングルトンで返す
   */
  static get(): AppConfig {
    if (this.instance) return this.instance;

    const props = PropertiesService.getScriptProperties();

    const channelAccessToken = props.getProperty(CONFIG_KEYS.CHANNEL_ACCESS_TOKEN);
    const channelSecret = props.getProperty(CONFIG_KEYS.CHANNEL_SECRET);
    const spreadsheetId = props.getProperty(CONFIG_KEYS.SPREADSHEET_ID);
    const adminUserIds = props.getProperty(CONFIG_KEYS.ADMIN_USER_IDS);

    if (!channelAccessToken || !channelSecret || !spreadsheetId) {
      throw new Error(
        "[Config] スクリプトプロパティが不足しています。" +
          "CHANNEL_ACCESS_TOKEN, CHANNEL_SECRET, SPREADSHEET_ID を設定してください。"
      );
    }

    this.instance = {
      channelAccessToken,
      channelSecret,
      spreadsheetId,
      adminUserIds: adminUserIds ? adminUserIds.split(",").map((id) => id.trim()) : [],
    };

    return this.instance;
  }

  /** テスト・再読み込み用にキャッシュをクリア */
  static clear(): void {
    this.instance = null;
  }
}
