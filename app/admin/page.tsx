const metrics = [
  ["REGISTRADOS", "—", "Se activa al conectar Supabase"],
  ["CHECK-IN", "—", "Asistentes confirmados"],
  ["CREWS", "—", "Grupos representados"],
  ["RIFAS", "—", "Premios configurados"],
];

export default function AdminPage() {
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="brand"><span className="brand-mark">N</span><span>NEOTEAM</span></div>
        <nav><strong>Overview</strong><span>Participantes</span><span>Check-in</span><span>Grupos</span><span>Marcas</span><span>Rifas</span></nav>
        <small>Admin · scaffold MVP</small>
      </aside>
      <section className="admin-content">
        <p className="section-label">SOCIAL RUN · 18 OCT</p>
        <h1>Panel del evento</h1>
        <p className="admin-note">La estructura visual está lista. En la siguiente iteración conectamos métricas, tabla de participantes y autenticación administrativa.</p>
        <div className="metric-grid">
          {metrics.map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}
        </div>
        <div className="admin-placeholder">
          <div><strong>Participantes recientes</strong><span>Nombre · Crew · Estado · Check-in</span></div>
          <p>Los registros aparecerán aquí cuando conectemos la base de datos.</p>
        </div>
      </section>
    </main>
  );
}
