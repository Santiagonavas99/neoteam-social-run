"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

const ADMIN_SESSION_KEY = "neoteam_admin_pin_session";

type Participant = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  status: string;
  checkedInAt?: string | null;
  group?: string;
};

type CheckinResponse = {
  ok?: boolean;
  alreadyCheckedIn?: boolean;
  participant?: Participant;
  error?: string;
};

type ScannerLike = {
  stop: () => Promise<void>;
  clear: () => void;
};

export function CheckinClient() {
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const scannerRef = useRef<ScannerLike | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const storedToken = window.localStorage.getItem(ADMIN_SESSION_KEY) ?? "";
    if (!storedToken) {
      setAuthReady(true);
      return;
    }

    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", token: storedToken }),
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        if (data?.valid) setToken(storedToken);
      })
      .finally(() => { if (active) setAuthReady(true); });

    return () => {
      active = false;
      void stopScanner();
    };
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try { await scanner.stop(); } catch {}
    try { scanner.clear(); } catch {}
    setScanning(false);
  }

  async function submitCode(value: string) {
    if (!token || processingRef.current) return;
    const code = value.trim();
    if (!code) return;
    processingRef.current = true;
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code }),
      });
      const data = await response.json() as CheckinResponse;
      if (!response.ok) throw new Error(data.error || "No pudimos completar el check-in.");
      setResult(data);
      setManualCode("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos completar el check-in.");
    } finally {
      setBusy(false);
      processingRef.current = false;
    }
  }

  async function startScanner() {
    if (!token || scanning || busy) return;
    setMessage("");
    setResult(null);
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("neoteam-qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (decodedText) => {
          if (processingRef.current) return;
          await stopScanner();
          await submitCode(decodedText);
        },
        () => undefined,
      );
    } catch (error) {
      scannerRef.current = null;
      setScanning(false);
      setMessage(error instanceof Error ? error.message : "No pudimos abrir la cámara. Usa el código manual.");
    }
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitCode(manualCode);
  }

  if (!authReady) {
    return <main className="checkin-admin-page"><p className="loading-state">Comprobando acceso…</p></main>;
  }

  if (!token) {
    return <main className="checkin-admin-page">
      <section className="checkin-admin-card checkin-auth-needed">
        <p className="section-label">NEOTEAM · CHECK-IN</p>
        <h1>Necesitas iniciar sesión.</h1>
        <p>Entra primero al panel administrativo con el PIN y vuelve al escáner.</p>
        <Link href="/admin" className="button">Ir al panel →</Link>
      </section>
    </main>;
  }

  return <main className="checkin-admin-page">
    <header className="checkin-admin-header">
      <Link href="/admin" className="brand"><span className="brand-mark">N</span>NEOTEAM</Link>
      <Link href="/admin" className="text-link">← Panel</Link>
    </header>

    <section className="checkin-admin-card">
      <div className="checkin-admin-title">
        <div>
          <p className="section-label">18 OCT · CHECK-IN</p>
          <h1>Escáner QR</h1>
        </div>
        <span className="checkin-live">EN VIVO</span>
      </div>

      <div id="neoteam-qr-reader" className={`checkin-reader ${scanning ? "is-scanning" : ""}`} />

      <div className="checkin-scan-actions">
        {!scanning ? <button className="button" onClick={() => void startScanner()} disabled={busy}>Abrir cámara</button> : <button className="button button-secondary" onClick={() => void stopScanner()}>Detener cámara</button>}
      </div>

      <div className="checkin-divider"><span>o usa el código</span></div>

      <form className="checkin-manual" onSubmit={submitManual}>
        <label>Código de registro
          <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="SR26-00001" autoCapitalize="characters" autoComplete="off" />
        </label>
        <button className="button" disabled={busy || !manualCode.trim()}>{busy ? "Validando…" : "Hacer check-in"}</button>
      </form>

      {message && <div className="checkin-result checkin-error"><strong>No se pudo validar</strong><p>{message}</p></div>}

      {result?.participant && <div className={`checkin-result ${result.alreadyCheckedIn ? "checkin-warning" : "checkin-success"}`}>
        <span>{result.alreadyCheckedIn ? "YA REGISTRADO" : "CHECK-IN OK"}</span>
        <h2>{result.participant.firstName} {result.participant.lastName}</h2>
        <p>{result.participant.code} · {result.participant.group || "Independiente"}</p>
        {result.alreadyCheckedIn && <small>Esta persona ya tenía el check-in registrado.</small>}
        <button className="button button-secondary" onClick={() => { setResult(null); setMessage(""); void startScanner(); }}>Escanear siguiente</button>
      </div>}
    </section>
  </main>;
}
