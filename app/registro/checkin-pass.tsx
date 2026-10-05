"use client";

import { useEffect, useMemo, useState } from "react";
import qrcode from "qrcode-generator";

type WalletStatus = { apple: boolean; google: boolean };

export function CheckinPass({ code, checkinToken, participantName }: {
  code: string;
  checkinToken?: string;
  participantName?: string;
}) {
  const [wallets, setWallets] = useState<WalletStatus>({ apple: false, google: false });
  const [statusReady, setStatusReady] = useState(false);
  const payload = checkinToken ? `NEOTEAM-SR26:${checkinToken}` : "";

  const qrSvg = useMemo(() => {
    if (!payload) return "";
    const qr = qrcode(0, "M");
    qr.addData(payload);
    qr.make();
    return qr.createSvgTag({ cellSize: 5, margin: 0, scalable: true });
  }, [payload]);

  useEffect(() => {
    let active = true;
    fetch("/api/wallet/status", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active || !data) return;
        setWallets({ apple: Boolean(data.apple), google: Boolean(data.google) });
      })
      .catch(() => undefined)
      .finally(() => { if (active) setStatusReady(true); });
    return () => { active = false; };
  }, []);

  return (
    <div className="checkin-pass">
      <div className="checkin-pass-heading">
        <span>CHECK-IN PASS</span>
        <small>{participantName || "Social Run NeoTeam"}</small>
      </div>

      {qrSvg ? (
        <div className="checkin-qr" aria-label={`QR de check-in ${code}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      ) : (
        <div className="checkin-qr-unavailable">QR pendiente</div>
      )}

      <div className="checkin-code-block">
        <span>CÓDIGO DE RESPALDO</span>
        <strong>{code}</strong>
        <small>Muéstralo si el QR no puede escanearse.</small>
      </div>

      {checkinToken && (
        <div className="wallet-actions">
          {wallets.apple && <a className="wallet-button wallet-apple" href={`/api/wallet/apple?token=${encodeURIComponent(checkinToken)}`}>Añadir a Apple Wallet</a>}
          {wallets.google && <a className="wallet-button wallet-google" href={`/api/wallet/google?token=${encodeURIComponent(checkinToken)}`}>Añadir a Google Wallet</a>}
          {statusReady && !wallets.apple && !wallets.google && <small className="wallet-pending">Los botones de Wallet se activarán cuando conectemos las credenciales de Apple y Google.</small>}
        </div>
      )}
    </div>
  );
}
