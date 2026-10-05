import { createSign } from "node:crypto";
import { getWalletPassData } from "@/lib/wallet/pass-data";

export const runtime = "nodejs";

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signJwt(payload: Record<string, unknown>, privateKey: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

export async function GET(request: Request) {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim();
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKeyBase64 = process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64?.trim();
  if (!issuerId || !serviceAccountEmail || !privateKeyBase64) {
    return Response.json({ error: "Google Wallet todavía no está configurado." }, { status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return Response.json({ error: "Pase no válido." }, { status: 400 });

  try {
    const pass = await getWalletPassData(token);
    const classSuffix = process.env.GOOGLE_WALLET_CLASS_SUFFIX?.trim() || "neoteam_social_run_2026";
    const classId = `${issuerId}.${classSuffix}`;
    const objectId = `${issuerId}.${classSuffix}_${pass.checkinToken.replace(/-/g, "")}`;
    const origin = process.env.GOOGLE_WALLET_ORIGIN?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://neoteam-social-run.vercel.app";
    const qrValue = `NEOTEAM-SR26:${pass.checkinToken}`;

    const eventClass = {
      id: classId,
      eventId: classId,
      issuerName: "NeoTeam",
      reviewStatus: "UNDER_REVIEW",
      eventName: { defaultValue: { language: "es-CO", value: "Social Run · Aniversario NeoTeam" } },
      venue: { name: { defaultValue: { language: "es-CO", value: "Parque del Ingenio" } } },
      dateTime: { start: "2026-10-18T07:30:00-05:00" },
      hexBackgroundColor: "#050505",
    };

    const eventObject = {
      id: objectId,
      classId,
      state: "ACTIVE",
      ticketHolderName: `${pass.firstName} ${pass.lastName}`,
      ticketNumber: pass.code,
      barcode: { type: "QR_CODE", value: qrValue, alternateText: pass.code },
      hexBackgroundColor: "#050505",
      textModulesData: [
        { id: "route", header: "RUTA", body: "5K · Parque del Ingenio y sus alrededores" },
        { id: "time", header: "ENCUENTRO", body: "18 OCT 2026 · 7:30 a. m." },
      ],
    };

    const jwtPayload = {
      iss: serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: [origin],
      payload: { eventTicketClasses: [eventClass], eventTicketObjects: [eventObject] },
    };

    const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");
    const jwt = signJwt(jwtPayload, privateKey);
    return Response.redirect(`https://pay.google.com/gp/v/save/${jwt}`, 302);
  } catch (error) {
    console.error("Google Wallet", error);
    return Response.json({ error: "No pudimos preparar el pase de Google Wallet." }, { status: 500 });
  }
}
