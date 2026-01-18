export default function Settings() {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h1 className="h1">Impostazioni</h1>
              <div className="sub">Configura lega, squadra e finestre</div>
            </div>
            <span className="badge">BETA</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardBody">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Lega</div>
          <div className="sub">Per ora è statico. Poi lo rendiamo editabile e salvato in locale.</div>

          <div className="gridFilters" style={{ marginTop: 10 }}>
            <label className="label">
              <span>Nome lega</span>
              <input className="input" value="DREAM QSE LEAGUE" readOnly />
            </label>

            <label className="label">
              <span>La tua squadra</span>
              <input className="input" value="Q² Brothers" readOnly />
            </label>

            <label className="label">
              <span>Tipo</span>
              <input className="input" value="Classico" readOnly />
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Finestre di mercato</div>
          <div className="sub">
            Qui inseriremo: pre-asta (scambi + svincoli), deadline svincoli, asta di riparazione, post-asta scambi.
          </div>

          <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span className="pill pillActive">+100 crediti (apertura mercato invernale)</span>
            <span className="pill">Svincoli: aperti fino a fine mercato</span>
            <span className="pill">Dopo asta: no svincoli</span>
          </div>
        </div>
      </div>
    </div>
  );
}