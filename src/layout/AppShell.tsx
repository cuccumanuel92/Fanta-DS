import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }: { isActive: boolean }) =>
  `pill ${isActive ? "pillActive" : ""}`;

export default function AppShell() {
  return (
    <div className="container" style={{ padding: 16 }}>
      {/* TOPBAR stile render */}
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" className="brandLogo" alt="Fanta DS" />

          <div className="brandText">
            <div className="brandTitleRow">
              <div className="brandTitle">Fanta DS</div>
              <span className="brandBadge">BETA</span>
              <span className="buildTag">build 18-01 · 01:12</span>
            </div>
            <div className="brandSub">DREAM QSE League</div>
          </div>
        </div>

        <div className="topbarActions">
          <button className="iconBtn" aria-label="Cerca">
            🔎
          </button>
          <button className="iconBtn" aria-label="Impostazioni">
            ⚙️
          </button>
        </div>
      </header>

      {/* NAV pill (resta, ma sotto la topbar) */}
      <div className="pills" style={{ marginTop: 12, marginBottom: 12 }}>
  <NavLink to="/" className={linkStyle} end>
    Home
  </NavLink>

  <NavLink to="/players" className={linkStyle}>
    Calciatori
  </NavLink>

  <NavLink to="/moves" className={linkStyle}>
    Operazione consigliata
  </NavLink>

  <NavLink to="/settings" className={linkStyle}>
    Impostazioni
  </NavLink>
</div>

      <Outlet />
    </div>
  );
}