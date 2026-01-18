import { useMemo } from "react";
import { Link } from "react-router-dom";
import players from "../data/players.json";

type Role = "P" | "D" | "C" | "A";
type LeaguePlayer = {
  id: string;
  ownerTeam: string;
  role: Role;
  name: string;
  serieATeam: string;
  cost: number;
  active: boolean;
};

export default function Home() {
  const league = players as LeaguePlayer[];

  // MVP: squadra "corrente" = prima ownerTeam trovata
  const myTeam = league[0]?.ownerTeam ?? "Q² Brothers";
  const myPlayers = useMemo(() => league.filter((p) => p.ownerTeam === myTeam), [league, myTeam]);

  const countByRole = (r: Role) => myPlayers.filter((p) => p.role === r).length;

  const P = countByRole("P");
  const D = countByRole("D");
  const C = countByRole("C");
  const A = countByRole("A");

  const status = (role: Role, n: number) => {
    // soglie indicative (MVP)
    const min = role === "P" ? 2 : role === "D" ? 6 : role === "C" ? 6 : 4;
    if (n >= min + 1) return { label: "OK", cls: "tagOk" };
    if (n >= min) return { label: "GIUSTO", cls: "tagWarn" };
    return { label: "EMERGENZA", cls: "tagBad" };
  };

  const sP = status("P", P);
  const sD = status("D", D);
  const sC = status("C", C);
  const sA = status("A", A);

  return (
    <div className="container">
      {/* Card Mercato / Timer */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardBody">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900 }}>Finestra mercato</div>
            <span className="badge">chiude tra: 2g 4h</span>
          </div>
          <div className="sub" style={{ marginTop: 8 }}>
            Pre-asta: scambi + svincoli aperti (demo). Deadline svincoli: domani 19:00.
          </div>
        </div>
      </div>

      {/* Card Stato Rosa */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h1">Dashboard</div>
        
              <div className="sub">{myTeam} • Stato rosa</div>
            </div>
            <span className="badge">BETA</span>
          </div>
        </div>

        <div className="cardBody">
          <div className="kpiGrid">
            <KPI title="Porta" value={`${P}`} tag={sP.label} tagClass={sP.cls} />
            <KPI title="Difesa" value={`${D}`} tag={sD.label} tagClass={sD.cls} />
            <KPI title="Centrocampo" value={`${C}`} tag={sC.label} tagClass={sC.cls} />
            <KPI title="Attacco" value={`${A}`} tag={sA.label} tagClass={sA.cls} />
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardBody">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Suggerimento rapido (demo)</div>
              <div className="sub">
                Se sei corto in attacco, punta a un profilo “da voto” prima della deadline e tieni crediti per l’asta.
              </div>

              <div className="row" style={{ gap: 10, marginTop: 12 }}>
                <button className="btnPrimary">Suggeriscimi una mossa</button>
                <Link to="/campo" className="btnGhost">Visione campo</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario simbolico */}
      <div className="card">
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900 }}>Calendario (contorno)</div>
            <span className="badge">demo</span>
          </div>
        </div>
        <div className="cardBody">
          <div className="calendar">
            {[
              { g: "G20", a: "Spich United", r: "2-1" },
              { g: "G21", a: "Ichnusa FC", r: "—" },
              { g: "G22", a: "WinCester", r: "—" },
              { g: "G23", a: "PandoLerZ", r: "—" },
            ].map((x) => (
              <div key={x.g} className="calRow">
                <div className="calG">{x.g}</div>
                <div className="calA">{x.a}</div>
                <div className="calR">{x.r}</div>
              </div>
            ))}
          </div>
          <div className="sub" style={{ marginTop: 10 }}>
            In futuro potremo usare il calendario per “rischio emergenza” (diffide/squalifiche) e pianificazione.
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({
  title,
  value,
  tag,
  tagClass,
}: {
  title: string;
  value: string;
  tag: string;
  tagClass: string;
}) {
  return (
    <div className="kpi">
      <div className="kpiTitle">{title}</div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="kpiValue">{value}</div>
        <span className={`tag ${tagClass}`}>{tag}</span>
      </div>
    </div>
  );
}