import { getWalletPassData } from "@/lib/wallet/pass-data";

export const runtime = "nodejs";

const ICON_1X = "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAIAAADZ8fBYAAAAo0lEQVR42uWWTRbAEAyEmcdF7fRAuutZu7Dpo41ksKplHh/yM4mPMboNC27P2sUNvem4TiulpNxY/NO/BPGLvt+/k49tCEH4juamurnfCVM0luUZjcbQWRwamjgQaChDbEVDnz0mNEyJqUfDmvNKNIhy0qDBVeoQDVoEZDRm9EVAkzo5lCRef2X0lK4LDlnQh0rK9eDiPvT6Gt/PJev78Y/nnRtYQUFi2ra5ywAAAABJRU5ErkJggg==";
const ICON_2X = "iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAIAAABu2d1/AAABH0lEQVR42u3ZQRKDIAwFUM3oRd3ZA9ldz9q9UyHC/z9Cce00jwiUhHld16mdx6amnsEd3MGVPIv/1dfnTUIc2+58c/bsuzzoXXSGq4H60fYoazZoLztDSGqzobvIbmJ8/k2HkeClYMEe2w6ZKqeRe37TIJEa+BMOERvwazZwxBGLDb5insg9rWKZuDy7IeKqyaAX185dsRiw1JRizBFHJoadyDRi5AFSIAafd9li/PGcKqZUEzwxq/ghiYm1GkPMLS3hYnoljBUrCnegaWNRnQIl1bRGIWNrFqe9OqJtOleKAHlmNOKalVywO60CWiS+b/bL7iJ+BrvaN4P7u3aRYYtxRY0iE7ujWMiTB6aB9XQNq0OBL1jbm7uAO7uD+K/cLNtt0etE4cQ4AAAAASUVORK5CYII=";
const ICON_3X = "iVBORw0KGgoAAAANSUhEUgAAAFcAAABXCAIAAAD+qk47AAAB0UlEQVR42u3cwXKDMAwEUKIJP5pb+kHprd/aQy6dzrQY21rt4uUOyA9ji7HMbd/3bfkjTGAFK1jBClawghWs0HDcB8//+PpkaMbr8Rw5/daXQZM0fhZHXImgO7ZzfYG5/SOdIi5JcDbauCTB2Zg9UzYrKHaEU5HHhQna4/cbMVthMIHjVWh/Hd4EnBCHrbhPf+yvxxMwlPwVQN+tAxnicl/WWhCB77RrKQhBpOcLEhCIrIkfApQ7kkPgMmhmCOh3BC3EZIXD1I0TYn5fUIRIeSPkILLGBS2IxNFRCCJ3jlCBSJ8pJSAQ+QI/BChrIofA5Y7MENAMmhYCvR7BCVGwKkMIUbM2xQZRtkJHBVG5TskDUbxaSwJRv2bNAEGxcl8OwVK/UAtBVMVRCMFVy1IFQVfRUwLBWNeEhyCt7gIX1vHWuCEhqCv9YBDs9Y4YCIGqTwCERu1rNoRMBXAqhFIddB6EWDV4EoReTXwGxPHuMc79Eb+S6P+DPMy4VfdH/Gz2+HMS3iXybvyUrtq0n1J601DLB2jMupAuweZ9U+cUFLtDe8yRcVEtgq3vzwPkg2XH0wrMbZgJtu6/ULD1i5p/cSw6R1jBClawghWsYAUrrH18A6l8rj6XmYtlAAAAAElFTkSuQmCC";

function fromBase64Env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing`);
  return Buffer.from(value, "base64");
}

export async function GET(request: Request) {
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID?.trim();
  const teamIdentifier = process.env.APPLE_TEAM_ID?.trim();
  if (!passTypeIdentifier || !teamIdentifier) {
    return Response.json({ error: "Apple Wallet todavía no está configurado." }, { status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return Response.json({ error: "Pase no válido." }, { status: 400 });

  try {
    const participant = await getWalletPassData(token);
    const { PKPass } = await import("passkit-generator");
    const qrValue = `NEOTEAM-SR26:${participant.checkinToken}`;
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      serialNumber: participant.checkinToken,
      teamIdentifier,
      organizationName: "NeoTeam",
      description: "Social Run · Aniversario NeoTeam",
      logoText: "NEOTEAM · SOCIAL RUN",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(5, 5, 5)",
      labelColor: "rgb(111, 163, 156)",
      relevantDate: "2026-10-18T07:30:00-05:00",
      barcodes: [{
        message: qrValue,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: participant.code,
      }],
      eventTicket: {
        primaryFields: [{ key: "event", label: "EVENTO", value: "Social Run" }],
        secondaryFields: [
          { key: "date", label: "FECHA", value: "18 OCT 2026" },
          { key: "time", label: "ENCUENTRO", value: "7:30 a. m." },
        ],
        auxiliaryFields: [
          { key: "route", label: "RUTA", value: "5K" },
          { key: "code", label: "CÓDIGO", value: participant.code },
        ],
        backFields: [
          { key: "holder", label: "PARTICIPANTE", value: `${participant.firstName} ${participant.lastName}` },
          { key: "location", label: "RUTA", value: "Parque del Ingenio y sus alrededores" },
          { key: "note", label: "CHECK-IN", value: "Presenta el QR de este pase al llegar." },
        ],
      },
    };

    const pass = new PKPass(
      {
        "icon.png": Buffer.from(ICON_1X, "base64"),
        "icon@2x.png": Buffer.from(ICON_2X, "base64"),
        "icon@3x.png": Buffer.from(ICON_3X, "base64"),
        "pass.json": Buffer.from(JSON.stringify(passJson), "utf8"),
      },
      {
        wwdr: fromBase64Env("APPLE_WWDR_CERT_BASE64"),
        signerCert: fromBase64Env("APPLE_PASS_CERT_BASE64"),
        signerKey: fromBase64Env("APPLE_PASS_KEY_BASE64"),
        signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE,
      },
    );

    const buffer = pass.getAsBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="neoteam-${participant.code}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Apple Wallet", error);
    return Response.json({ error: "No pudimos preparar el pase de Apple Wallet." }, { status: 500 });
  }
}
