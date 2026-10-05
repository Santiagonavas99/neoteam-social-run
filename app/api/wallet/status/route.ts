export const runtime = "nodejs";

export async function GET() {
  const google = Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID?.trim() &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim() &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64?.trim()
  );

  const apple = Boolean(
    process.env.APPLE_PASS_TYPE_ID?.trim() &&
    process.env.APPLE_TEAM_ID?.trim() &&
    process.env.APPLE_WWDR_CERT_BASE64?.trim() &&
    process.env.APPLE_PASS_CERT_BASE64?.trim() &&
    process.env.APPLE_PASS_KEY_BASE64?.trim()
  );

  return Response.json({ google, apple }, { headers: { "Cache-Control": "no-store" } });
}
