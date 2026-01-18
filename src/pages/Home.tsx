import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h1 className="h1">Fanta DS</h1>
              <div className="sub">Beta • DREAM QSE LEAGUE</div>
            </div>
            <span className="badge">HOME</span>
          </div>
        </div>
      </div>

      <Link to="/players" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="card">
          <div className="cardBody">
            <div style={{ fontWeight: 900 }}>Calciatori</div>
            <div className="sub">Rosa + Svincolati con filtri</div>
          </div>
        </div>
      </Link>

      <Link to="/settings" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="card" style={{ marginTop: 10 }}>
          <div className="cardBody">
            <div style={{ fontWeight: 900 }}>Impostazioni</div>
            <div className="sub">Lega, squadra, regole, finestre mercato</div>
          </div>
        </div>
      </Link>
    </div>
  );
}