/**
 * Shared admin auth helper.
 *
 * Secret diterima via `Authorization: Bearer <secret>` (utama).
 * Body/form-field `secret` tetap didukung untuk kompatibilitas,
 * tapi secret via query string SUDAH TIDAK didukung (bocor ke
 * browser history / proxy / access log).
 */

export function getBearerSecret(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() || null : null;
}

export function isValidAdminSecret(
  candidate: string | null | undefined
): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !candidate) return false;
  return candidate === expected;
}

/** 401 JSON standar agar client selalu dapat JSON, bukan HTML. */
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

/** 500 JSON saat ADMIN_SECRET belum dikonfigurasi di server. */
export function misconfiguredResponse() {
  return Response.json(
    { error: "Server belum dikonfigurasi (ADMIN_SECRET kosong)." },
    { status: 500 }
  );
}
