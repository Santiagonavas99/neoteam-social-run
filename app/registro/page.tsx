import Link from "next/link";
import { eventConfig } from "@/lib/event";
import { RegistrationForm } from "./registration-form";

export default function RegistrationPage() {
  return (
    <main className="registration-page">
      <header className="registration-header shell">
        <Link href="/" className="brand"><span className="brand-mark">N</span><span>NEOTEAM</span></Link>
        <div className="registration-header-actions">
          <Link href="/pase" className="text-link">Ya estoy inscrito · Mi pase</Link>
          <Link href="/" className="text-link">← Volver al evento</Link>
        </div>
      </header>
      <div className="registration-layout shell">
        <aside className="registration-copy">
          <p className="kicker">SOCIAL RUN · {eventConfig.dateShort}</p>
          <h1>RESERVA<br />TU LUGAR.</h1>
          <p>El registro es gratuito y toma menos de dos minutos. Estos datos nos permitirán organizar asistentes, grupos invitados, check-in y rifas.</p>
          <div className="registration-fact"><span>FECHA</span><strong>{eventConfig.dateLabel}</strong></div>
          <div className="registration-fact"><span>PUNTO</span><strong>{eventConfig.location}</strong></div>
          <div className="registration-fact"><span>FORMATO</span><strong>Social Run · comunidad</strong></div>
        </aside>
        <RegistrationForm />
      </div>
    </main>
  );
}
