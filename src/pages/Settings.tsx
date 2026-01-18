export default function Settings() {
  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h1 className="h1">Impostazioni</h1>
              <div className="sub">Placeholder (poi mettiamo la configurazione lega)</div>
            </div>
            <span className="badge">SET</span>
          </div>
        </div>

        <div className="cardBody">
          <div className="sub">
            Qui aggiungeremo: nome lega, squadra, regole, timer finestre mercato, budget.
          </div>
        </div>
      </div>
    </div>
  );
}