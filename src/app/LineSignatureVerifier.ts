// =============================================================
// src/app/LineSignatureVerifier.ts
// LINE Webhook の署名検証
//
// LINE はリクエストヘッダー "x-line-signature" に
// CHANNEL_SECRET で HMAC-SHA256 署名したハッシュを付与する。
//
// GAS では e.postData.headers が使用不可のため
// e.parameter["x-line-signature"] で取得する。
//
// 参考: https://developers.line.biz/ja/docs/messaging-api/receiving-messages/#signature-validation
// =============================================================

class LineSignatureVerifier {

  static verify(e: GoogleAppsScript.Events.DoPost): void {
    const signature = (e.parameter as Record<string, string>)["x-line-signature"] ?? "";

    if (!signature) {
      throw new Error("[LineSignatureVerifier] x-line-signature ヘッダーがありません");
    }

    const channelSecret = Config.get().channelSecret;
    const body          = e.postData.contents;
    const expected      = this.computeHmacSha256Base64(channelSecret, body);

    if (expected !== signature) {
      throw new Error("[LineSignatureVerifier] 署名が一致しません。不正なリクエストです。");
    }
  }

  // ----------------------------------------------------------
  // Private
  // ----------------------------------------------------------

  /**
   * HMAC-SHA256 を計算して Base64 文字列で返す
   *
   * GAS の computeHmacSha256Signature は signed byte[]（-128〜127）を返すため
   * unsigned（0〜255）に変換してから Base64 エンコードする
   */
  private static computeHmacSha256Base64(secret: string, body: string): string {
    const secretBytes = Utilities.newBlob(secret).getBytes();
    const bodyBytes   = Utilities.newBlob(body).getBytes();

    const signed   = Utilities.computeHmacSha256Signature(bodyBytes, secretBytes);
    const unsigned = signed.map((b) => (b < 0 ? b + 256 : b));

    return Utilities.base64Encode(unsigned);
  }
}
