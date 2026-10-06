import { createSign } from "node:crypto";
import { getWalletPassData } from "@/lib/wallet/pass-data";

export const runtime = "nodejs";

const GOOGLE_WALLET_SCOPE =
  "https://www.googleapis.com/auth/wallet_object.issuer";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_WALLET_OBJECT_URL =
  "https://walletobjects.googleapis.com/walletobjects/v1/eventTicketObject";

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

async function getGoogleAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    {
      iss: serviceAccountEmail,
      scope: GOOGLE_WALLET_SCOPE,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    privateKey,
  );

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    const reason =
      body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(`OAUTH:${response.status}:${reason}`);
  }

  return body.access_token;
}

async function ensureGoogleWalletObject(
  accessToken: string,
  eventObject: Record<string, unknown>,
) {
  const objectId = String(eventObject.id);
  const objectUrl = `${GOOGLE_WALLET_OBJECT_URL}/${encodeURIComponent(objectId)}`;

  const existing = await fetch(objectUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (existing.ok) {
    return;
  }

  if (existing.status !== 404) {
    const body = await existing.text();
    throw new Error(
      `OBJECT_GET:${existing.status}:${body.slice(0, 1200)}`,
    );
  }

  const created = await fetch(GOOGLE_WALLET_OBJECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventObject),
    cache: "no-store",
  });

  if (!created.ok && created.status !== 409) {
    const body = await created.text();
    throw new Error(
      `OBJECT_INSERT:${created.status}:${body.slice(0, 1200)}`,
    );
  }
}

function safeGoogleError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Error desconocido de Google Wallet";

  const [stage, status, ...rest] = message.split(":");
  const knownStage = ["OAUTH", "OBJECT_GET", "OBJECT_INSERT"].includes(stage);

  return {
    stage: knownStage ? stage : "UNKNOWN",
    status: knownStage ? Number(status) || 500 : 500,
    message: knownStage
      ? rest.join(":").slice(0, 1000)
      : "Google Wallet rechazó la operación.",
  };
}

export async function GET(request: Request) {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID?.trim();
  const serviceAccountEmail =
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKeyBase64 =
    process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64?.trim();

  if (!issuerId || !serviceAccountEmail || !privateKeyBase64) {
    return Response.json(
      { error: "Google Wallet todavía no está configurado." },
      { status: 503 },
    );
  }

  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return Response.json({ error: "Pase no válido." }, { status: 400 });
  }

  try {
    const pass = await getWalletPassData(token);
    const classSuffix =
      process.env.GOOGLE_WALLET_CLASS_SUFFIX?.trim() ||
      "neoteam_social_run_2026";
    const classId = `${issuerId}.${classSuffix}`;
    const objectId = `${issuerId}.${classSuffix}_${pass.checkinToken.replace(
      /-/g,
      "",
    )}`;
    const qrValue = `NEOTEAM-SR26:${pass.checkinToken}`;
    const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");

    const eventObject = {
      id: objectId,
      classId,
      state: "ACTIVE",
      ticketHolderName: `${pass.firstName} ${pass.lastName}`,
      ticketNumber: pass.code,
      reservationInfo: {
        confirmationCode: pass.code,
      },
      barcode: {
        type: "QR_CODE",
        value: qrValue,
        alternateText: pass.code,
      },
      hexBackgroundColor: "#050505",
      textModulesData: [
        {
          id: "route",
          header: "RUTA",
          body: "5K · Parque del Ingenio y sus alrededores",
        },
        {
          id: "time",
          header: "ENCUENTRO",
          body: "18 OCT 2026 · 7:30 a. m.",
        },
      ],
    };

    // Create the participant object with the REST API first. This makes
    // Google return a precise validation/auth error instead of a generic
    // pay.google.com save error.
    const accessToken = await getGoogleAccessToken(
      serviceAccountEmail,
      privateKey,
    );
    await ensureGoogleWalletObject(accessToken, eventObject);

    // The object now exists. The save JWT only references it.
    const jwtPayload = {
      iss: serviceAccountEmail,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: [],
      payload: {
        eventTicketObjects: [
          {
            id: objectId,
            classId,
          },
        ],
      },
    };

    const jwt = signJwt(jwtPayload, privateKey);
    return Response.redirect(`https://pay.google.com/gp/v/save/${jwt}`, 302);
  } catch (error) {
    console.error("Google Wallet", error);
    const googleError = safeGoogleError(error);

    return Response.json(
      {
        error: "Google Wallet rechazó el pase.",
        google: googleError,
      },
      { status: googleError.status >= 400 ? googleError.status : 500 },
    );
  }
}
