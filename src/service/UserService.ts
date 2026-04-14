// =============================================================
// src/service/UserService.ts
// ユーザーに関するビジネスロジック
// =============================================================

class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  /**
   * フォロー時のユーザー登録
   * 既存ユーザーの場合は何もしない（冪等）
   */
  registerOnFollow(userId: string): UserEntity {
    const existing = this.userRepo.findByUserId(userId);
    if (existing) {
      AppLogger.info("[UserService] 既存ユーザーのフォロー", { userId });
      return existing;
    }

    // LINE API でプロフィール取得（任意）
    const displayName = this.fetchDisplayName(userId);
    return this.userRepo.create(userId, displayName);
  }

  /**
   * ユーザーが存在するか確認。いなければ自動登録する
   */
  ensureUser(userId: string): UserEntity {
    const existing = this.userRepo.findByUserId(userId);
    if (existing) return existing;
    const displayName = this.fetchDisplayName(userId);
    return this.userRepo.create(userId, displayName);
  }

  /**
   * 管理者かどうか判定
   */
  isAdmin(userId: string): boolean {
    // スクリプトプロパティに登録された管理者 or スプレッドシートの isAdmin フラグ
    const configAdmins = Config.get().adminUserIds;
    if (configAdmins.includes(userId)) return true;

    const user = this.userRepo.findByUserId(userId);
    return user?.isAdmin ?? false;
  }

  /**
   * 管理者フラグをトグルする
   */
  toggleAdmin(targetUserId: string): string {
    const user = this.userRepo.findByUserId(targetUserId);
    if (!user) {
      return `ユーザー ${targetUserId} が見つかりません。`;
    }
    const result = this.userRepo.toggleAdmin(targetUserId);
    if (!result) return "更新に失敗しました。";
    const newStatus = !user.isAdmin;
    return `${user.displayName} の管理者権限を ${newStatus ? "付与" : "削除"} しました。`;
  }

  /**
   * 全ユーザーサマリーを返す
   */
  getUserSummary(): string {
    const users = this.userRepo.findAll();
    const adminCount = users.filter((u) => u.isAdmin).length;
    return `登録ユーザー: ${users.length}人 / 管理者: ${adminCount}人`;
  }

  // ----------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------

  /**
   * LINE Profile API でユーザー名取得
   * 取得失敗した場合は userId を返す
   */
  private fetchDisplayName(userId: string): string {
    try {
      const config = Config.get();
      const url = `https://api.line.me/v2/bot/profile/${userId}`;
      const response = UrlFetchApp.fetch(url, {
        headers: {
          Authorization: `Bearer ${config.channelAccessToken}`,
        },
        muteHttpExceptions: true,
      });

      if (response.getResponseCode() === 200) {
        const profile = JSON.parse(response.getContentText()) as {
          displayName: string;
        };
        return profile.displayName;
      }
    } catch (e) {
      AppLogger.warn("[UserService] プロフィール取得失敗", { userId });
    }
    return userId;
  }
}
