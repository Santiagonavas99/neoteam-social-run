"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";

type WalletStatus = { google: boolean };
type Platform = "ios" | "android" | "other";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

const PASS_STORAGE_KEY = "neoteam:social-run:pass:v1";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const iPadOnDesktopMode =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/iPhone|iPad|iPod/i.test(ua) || iPadOnDesktopMode) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return Boolean(
    window.matchMedia("(display-mode: standalone)").matches ||
      navigatorWithStandalone.standalone,
  );
}

export function CheckinPass({ code, checkinToken, participantName }: {
  code: string;
  checkinToken?: string;
  participantName?: string;
}) {
  const [wallets, setWallets] = useState<WalletStatus>({ google: false });
  const [statusReady, setStatusReady] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [standalone, setStandalone] = useState(false);
  const [webPassOpen, setWebPassOpen] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const payload = checkinToken ? `NEOTEAM-SR26:${checkinToken}` : "";

  const qrSvg = useMemo(() => {
    if (!payload) return "";
    const qr = qrcode(0, "M");
    qr.addData(payload);
    qr.make();
    return qr.createSvgTag({ cellSize: 5, margin: 0, scalable: true });
  }, [payload]);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandaloneMode());

    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setStandalone(isStandaloneMode());
    displayMode.addEventListener?.("change", onDisplayModeChange);

    return () => {
      displayMode.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    if (!checkinToken || !code) return;

    try {
      window.localStorage.setItem(
        PASS_STORAGE_KEY,
        JSON.stringify({
          code,
          checkinToken,
          participantName: participantName || "Social Run NeoTeam",
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // The pass still works in the current session when storage is blocked.
    }
  }, [checkinToken, code, participantName]);

  useEffect(() => {
    let active = true;
    fetch("/api/wallet/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setWallets({ google: Boolean(data.google) });
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setStatusReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!webPassOpen) {
      setScanMode(false);
      wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
    }
  }, [webPassOpen]);

  async function requestWakeLock() {
    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (type: "screen") => Promise<WakeLockSentinelLike>;
      };
    };

    if (!nav.wakeLock) return;

    try {
      wakeLockRef.current = await nav.wakeLock.request("screen");
    } catch {
      // Wake Lock is progressive enhancement; the pass remains usable.
    }
  }

  async function toggleScanMode() {
    const next = !scanMode;
    setScanMode(next);

    if (next) {
      await requestWakeLock();
    } else {
      await wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
    }
  }

  function openWebPass() {
    setWebPassOpen(true);
  }

  function saveOnIPhone() {
    setWebPassOpen(true);
    if (!standalone) setInstallHelpOpen(true);
  }

  const qr = qrSvg ? (
    <div
      className="checkin-qr"
      aria-label={`QR de check-in ${code}`}
      dangerouslySetInnerHTML={{ __html: qrSvg }}
    />
  ) : (
    <div className="checkin-qr-unavailable">QR pendiente</div>
  );

  return (
    <>
      <div className="checkin-pass">
        <div className="checkin-pass-heading">
          <span>CHECK-IN PASS</span>
          <small>{participantName || "Social Run NeoTeam"}</small>
        </div>

        {qr}

        <div className="checkin-code-block">
          <span>CÓDIGO DE RESPALDO</span>
          <strong>{code}</strong>
          <small>Muéstralo si el QR no puede escanearse.</small>
        </div>

        {checkinToken && (
          <div className="wallet-actions">
            {platform === "ios" ? (
              <button
                type="button"
                className="wallet-button wallet-webpass"
                onClick={saveOnIPhone}
              >
                {standalone ? "Abrir NeoTeam Pass" : "Guardar pase en mi iPhone"}
              </button>
            ) : (
              <>
                {wallets.google && (
                  <a
                    className="wallet-button wallet-google"
                    href={`/api/wallet/google?token=${encodeURIComponent(checkinToken)}`}
                  >
                    Añadir a Google Wallet
                  </a>
                )}
                <button
                  type="button"
                  className="wallet-button wallet-webpass-secondary"
                  onClick={openWebPass}
                >
                  Ver NeoTeam Pass
                </button>
              </>
            )}

            {statusReady && platform !== "ios" && !wallets.google && (
              <small className="wallet-pending">
                Google Wallet no está disponible ahora mismo. Puedes usar el
                NeoTeam Pass y el QR sin problema.
              </small>
            )}
          </div>
        )}
      </div>

      {webPassOpen && (
        <div
          className={`neoteam-pass-overlay${scanMode ? " is-scan-mode" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="NeoTeam Pass"
        >
          <div className="neoteam-pass-toolbar">
            <button
              type="button"
              className="neoteam-pass-icon-button"
              onClick={() => setWebPassOpen(false)}
              aria-label="Cerrar pase"
            >
              ×
            </button>
            <span>NEOTEAM PASS</span>
            <button
              type="button"
              className="neoteam-pass-icon-button"
              onClick={toggleScanMode}
            >
              {scanMode ? "Normal" : "Escanear"}
            </button>
          </div>

          <div className="neoteam-pass-stage">
            <article className="neoteam-pass-card">
              <div className="neoteam-pass-card-top">
                <div>
                  <span className="neoteam-pass-eyebrow">NEOTEAM · SOCIAL RUN</span>
                  <h2>{participantName || "Participante NeoTeam"}</h2>
                </div>
                <span className="neoteam-pass-status">CONFIRMADO</span>
              </div>

              <div className="neoteam-pass-event">
                <span>18 OCT 2026</span>
                <strong>7:30 A.M.</strong>
                <small>Parque del Ingenio · Ruta 5K</small>
              </div>

              <div className="neoteam-pass-qr">{qr}</div>

              <div className="neoteam-pass-code">
                <span>CÓDIGO DE REGISTRO</span>
                <strong>{code}</strong>
              </div>
            </article>
          </div>

          <div className="neoteam-pass-actions">
            <button
              type="button"
              className="neoteam-pass-action"
              onClick={toggleScanMode}
            >
              {scanMode ? "Volver al pase" : "Modo escaneo"}
            </button>

            {platform === "ios" && !standalone && (
              <button
                type="button"
                className="neoteam-pass-action secondary"
                onClick={() => setInstallHelpOpen(true)}
              >
                Añadir a pantalla de inicio
              </button>
            )}
          </div>

          <p className="neoteam-pass-note">
            El modo escaneo aumenta el contraste e intenta mantener la pantalla
            activa. El navegador no permite cambiar el brillo del iPhone.
          </p>

          {installHelpOpen && (
            <div
              className="neoteam-install-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Añadir NeoTeam Pass al iPhone"
            >
              <div className="neoteam-install-sheet-card">
                <span className="neoteam-pass-eyebrow">GUARDAR EN IPHONE</span>
                <h3>Ten tu QR a un toque.</h3>
                <ol>
                  <li>Abre esta página en Safari.</li>
                  <li>Toca el botón Compartir.</li>
                  <li>Elige “Añadir a pantalla de inicio”.</li>
                  <li>Confirma “Añadir”.</li>
                </ol>
                <p>
                  Después podrás abrir NeoTeam Pass desde el icono de tu iPhone,
                  incluso si la conexión está inestable.
                </p>
                <button
                  type="button"
                  className="button full-width"
                  onClick={() => setInstallHelpOpen(false)}
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
