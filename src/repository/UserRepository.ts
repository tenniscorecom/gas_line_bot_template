// =============================================================
// src/repository/UserRepository.ts
//
// users シート列構成（A〜F）:
//   A: user_id | B: display_name | C: short_id
//   D: followed_at | E: is_admin | F: memo
// =============================================================

class UserRepository extends BaseRepository {
  private static readonly COL_USER_ID      = 1;
  private static readonly COL_DISPLAY_NAME = 2;
  private static readonly COL_SHORT_ID     = 3;
  private static readonly COL_FOLLOWED_AT  = 4;
  private static readonly COL_IS_ADMIN     = 5;
  private static readonly COL_MEMO         = 6;

  constructor() {
    super(SHEET_NAMES.USERS);
  }

  // ----------------------------------------------------------
  // 検索
  // ----------------------------------------------------------

  findByUserId(userId: string): UserEntity | null {
    const rowIndex = this.findRowIndex(UserRepository.COL_USER_ID, userId);
    if (rowIndex === -1) return null;
    const row = this.sheet.getRange(rowIndex, 1, 1, 6).getValues()[0] as SheetRow;
    return this.rowToEntity(row);
  }

  findByShortId(shortId: string): UserEntity | null {
    const rowIndex = this.findRowIndex(UserRepository.COL_SHORT_ID, shortId);
    if (rowIndex === -1) return null;
    const row = this.sheet.getRange(rowIndex, 1, 1, 6).getValues()[0] as SheetRow;
    return this.rowToEntity(row);
  }

  findAll(): UserEntity[] {
    return this.getAllRows().map((r) => this.rowToEntity(r));
  }

  exists(userId: string): boolean {
    return this.findByUserId(userId) !== null;
  }

  // ----------------------------------------------------------
  // 作成・更新
  // ----------------------------------------------------------

  create(userId: string, displayName: string): UserEntity {
    const entity: UserEntity = {
      userId,
      displayName,
      shortId:    this.generateShortId(),
      followedAt: this.now(),
      isAdmin:    false,
      memo:       "",
    };
    this.appendRow(this.entityToRow(entity));
    AppLogger.info("[UserRepository] ユーザー登録", {
      userId, displayName, shortId: entity.shortId,
    });
    return entity;
  }

  update(entity: UserEntity): boolean {
    const rowIndex = this.findRowIndex(UserRepository.COL_USER_ID, entity.userId);
    if (rowIndex === -1) return false;
    this.updateRow(rowIndex, this.entityToRow(entity));
    return true;
  }

  toggleAdmin(userId: string): boolean {
    const entity = this.findByUserId(userId);
    if (!entity) return false;
    entity.isAdmin = !entity.isAdmin;
    return this.update(entity);
  }

  // ----------------------------------------------------------
  // ショートID発番
  // ----------------------------------------------------------

  private generateShortId(): string {
    const existingIds = new Set(
      this.getAllRows().map((r) => String(r[UserRepository.COL_SHORT_ID - 1]))
    );
    const digits = existingIds.size >= 9999 ? 5 : 4;
    const max    = Math.pow(10, digits);

    for (let i = 0; i < 100; i++) {
      const candidate = String(Math.floor(Math.random() * max)).padStart(digits, "0");
      if (!existingIds.has(candidate)) return candidate;
    }
    return String(Date.now()).slice(-6);
  }

  // ----------------------------------------------------------
  // 変換
  // ----------------------------------------------------------

  private rowToEntity(row: SheetRow): UserEntity {
    return {
      userId:      String(row[0]),
      displayName: String(row[1]),
      shortId:     String(row[2]),
      followedAt:  String(row[3]),
      isAdmin:     row[4] === true || String(row[4]).toLowerCase() === "true",
      memo:        String(row[5] ?? ""),
    };
  }

  private entityToRow(entity: UserEntity): SheetRow {
    return [
      entity.userId,
      entity.displayName,
      entity.shortId,
      entity.followedAt,
      entity.isAdmin,
      entity.memo,
    ];
  }
}
