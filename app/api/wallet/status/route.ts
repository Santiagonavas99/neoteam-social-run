export const runtime = "nodejs";

export async function GET() {
  const google = Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID?.trim() &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64?.trim(),
  );

  return Response.json(
    {
      google,
      apple: false,
      webPass: true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
