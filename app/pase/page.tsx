import Link from "next/link";
import { PassForm } from "./pass-form";

export default function PassPage() {
  return <main className="pass-recovery-page">
    <header className="registration-header shell">
      <Link href="/" className="brand"><span className="brand-mark">N</span><span>NEOTEAM</span></Link>
      <Link href="/" className="text-link">← Volver al evento</Link>
    </header>
    <div className="pass-recovery-layout shell">
      <aside className="pass-recovery-copy">
        <p className="kicker">SOCIAL RUN · 18 OCT</p>
        <h1>UN QR.<br />Y A CORRER.</h1>
        <p>Tu pase identifica tu inscripción y nos permite hacer el check-in rápido el día del evento.</p>
        <div className="registration-fact"><span>ENCUENTRO</span><strong>7:30 a. m.</strong></div>
        <div className="registration-fact"><span>RUTA</span><strong>5K · Parque del Ingenio</strong></div>
      </aside>
      <PassForm />
    </div>
  </main>;
}
