// =============================================================
// src/repository/UserRepository.ts
// ユーザー情報のスプレッドシート操作
//
// シート "users" の列構成:
//   A: userId | B: displayName | C: followedAt | D: isAdmin | E: memo
// =============================================================

class UserRepository extends BaseRepository {
  // カラムインデックス（1-indexed）
  private static readonly COL_USER_ID = 1;
  private static readonly COL_DISPLAY_NAME = 2;
  private static readonly COL_FOLLOWED_AT = 3;
  private static readonly COL_IS_ADMIN = 4;
  private static readonly COL_MEMO = 5;

  constructor() {
    super(SHEET_NAMES.USERS);
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  /** userId でユーザーを検索する */
  findByUserId(userId: string): UserEntity | null {
    const rowIndex = this.findRowIndexByColumn(
      UserRepository.COL_USER_ID,
      userId
    );
    if (rowIndex === -1) return null;

    const row = this.sheet.getRange(rowIndex, 1, 1, 5).getValues()[0] as SheetRow;
    return this.rowToEntity(row);
  }

  /** 全ユーザーを取得する */
  findAll(): UserEntity[] {
    return this.getAllRows().map((row) => this.rowToEntity(row));
  }

  /** 管理者ユーザー一覧を取得する */
  findAdmins(): UserEntity[] {
    return this.findAll().filter((u) => u.isAdmin);
  }

  /** ユーザーを新規登録する */
  create(userId: string, displayName: string): UserEntity {
    const entity: UserEntity = {
      userId,
      displayName,
      followedAt: this.formatDate(),
      isAdmin: false,
      memo: "",
    };
    this.appendRow(this.entityToRow(entity));
    AppLogger.info("[UserRepository] ユーザー登録", { userId, displayName });
    return entity;
  }

  /** ユーザー情報を更新する */
  update(entity: UserEntity): boolean {
    const rowIndex = this.findRowIndexByColumn(
      UserRepository.COL_USER_ID,
      entity.userId
    );
    if (rowIndex === -1) {
      AppLogger.warn("[UserRepository] 更新対象ユーザーが見つかりません", {
        userId: entity.userId,
      });
      return false;
    }
    this.updateRow(rowIndex, this.entityToRow(entity));
    return true;
  }

  /** 管理者フラグをトグルする */
  toggleAdmin(userId: string): boolean {
    const entity = this.findByUserId(userId);
    if (!entity) return false;
    entity.isAdmin = !entity.isAdmin;
    return this.update(entity);
  }

  /** userId が存在するか確認する */
  exists(userId: string): boolean {
    return this.findByUserId(userId) !== null;
  }

  // ----------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------

  private rowToEntity(row: SheetRow): UserEntity {
    return {
      userId: String(row[0]),
      displayName: String(row[1]),
      followedAt: String(row[2]),
      isAdmin: row[3] === true || String(row[3]).toLowerCase() === "true",
      memo: String(row[4] ?? ""),
    };
  }

  private entityToRow(entity: UserEntity): SheetRow {
    return [
      entity.userId,
      entity.displayName,
      entity.followedAt,
      entity.isAdmin,
      entity.memo,
    ];
  }
}
