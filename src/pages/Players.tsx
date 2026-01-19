import { useEffect, useMemo, useState } from "react";
import players from "../data/players.json";
import serieAPlayers from "../data/serieAPlayers.json";

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

type SerieAPlayer = {
  id: string;
  role: Role;
  name: string;
  serieATeam: string;
  active: boolean;
};


const ROLE_ORDER: Record<Role, number> = { P: 0, D: 1, C: 2, A: 3 };

export default function Players() {
 const league = players as LeaguePlayer[];
const all = serieAPlayers as SerieAPlayer[];

const [mode, setMode] = useState<"ROSA" | "SVINCOLATI">("ROSA");

const [q, setQ] = useState("");
const [role, setRole] = useState<Role | "ALL">("ALL");
const [owner, setOwner] = useState<string>("ALL"); // usato SOLO in modalità ROSA
const [onlyActive, setOnlyActive] = useState(true);
useEffect(() => {
  // quando cambi contesto (Rosa/Svincolati) azzero filtri "pericolosi"
  setQ("");
  setRole("ALL");
  setOnlyActive(true);

  if (mode === "SVINCOLATI") setOwner("ALL");
}, [mode]);
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")                // separa lettere e accenti
    .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
    .replace(/['’`]/g, "")           // rimuove apostrofi
    .replace(/[^a-z0-9\s]/g, " ")    // rimuove simboli/punteggiatura
    .replace(/\s+/g, " ")
    .trim();

// Mappa codici / abbreviazioni -> nome normalizzato (MVP: aggiungiamo man mano)
const TEAM_ALIASES: Record<string, string> = {
  // Codici lega -> nomi listone (normalizzati)
  ata: "atalanta",
  bol: "bologna",
  cag: "cagliari",
  com: "como",
  cre: "cremonese",
  fio: "fiorentina",
  gen: "genoa",
  int: "inter",
  juv: "juventus",
  laz: "lazio",
  lec: "lecce",
  mil: "milan",
  nap: "napoli",
  par: "parma",
  pis: "pisa",
  rom: "roma",
  sas: "sassuolo",
  tor: "torino",
  udi: "udinese",
  ver: "verona",

  // Nomi listone -> se stessi
  atalanta: "atalanta",
  bologna: "bologna",
  cagliari: "cagliari",
  como: "como",
  cremonese: "cremonese",
  fiorentina: "fiorentina",
  genoa: "genoa",
  inter: "inter",
  juventus: "juventus",
  lazio: "lazio",
  lecce: "lecce",
  milan: "milan",
  napoli: "napoli",
  parma: "parma",
  pisa: "pisa",
  roma: "roma",
  sassuolo: "sassuolo",
  torino: "torino",
  udinese: "udinese",
  verona: "verona",
};

const normTeam = (t: string) => {
  const x = norm(t);
  return TEAM_ALIASES[x] ?? x; // se non lo conosce, usa comunque il normalizzato
};

const key = (p: { name: string; serieATeam: string }) =>
  `${norm(p.name)}|${normTeam(p.serieATeam)}`;

const ownedKeys = useMemo(() => new Set(league.map(key)), [league]);

const freeAgents = useMemo(
  () => all.filter((p) => !ownedKeys.has(key(p))),
  [all, ownedKeys]
);
// Sorgente dati in base alla modalità
const source = mode === "ROSA" ? league : freeAgents;
 const owners = useMemo(() => {
  const set = new Set<string>();
  for (const p of league) set.add(p.ownerTeam);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}, [league]);

  const filtered = useMemo(() => {
    const query = norm(q);

    return source
  .filter((p) => (onlyActive ? p.active : true))
  .filter((p) => (role === "ALL" ? true : p.role === role))
  .filter((p) => (mode === "ROSA" ? (owner === "ALL" ? true : (p as LeaguePlayer).ownerTeam === owner) : true))
  .filter((p) => (query ? norm(p.name).includes(query) : true))
      .slice()
      .sort((a, b) => {
        const r = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
        if (r !== 0) return r;
        return a.name.localeCompare(b.name);
      });
  }, [source, q, role, owner, onlyActive, mode]);

  return (
  <div className="container">
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="h1">Calciatori</h1>
            <div className="sub">
              {mode === "ROSA" ? "In rosa" : "Svincolati"} • {source.length}/
              {mode === "ROSA" ? league.length : all.length}
            </div>
          </div>

          <span className="badge">{mode === "ROSA" ? "ROSA" : "SVINCOLATI"}</span>
        </div>

        <div className="pills" style={{ marginTop: 10 }}>
          <button
            className={`pill ${mode === "ROSA" ? "pillActive" : ""}`}
            onClick={() => setMode("ROSA")}
          >
            In rosa
          </button>
          <button
            className={`pill ${mode === "SVINCOLATI" ? "pillActive" : ""}`}
            onClick={() => setMode("SVINCOLATI")}
          >
            Svincolati
          </button>
        </div>
      </div>
    </div>


      {/* Filtri */}
<div className="card" style={{ marginBottom: 12 }}>
  <div className="cardBody">
    <div className="gridFilters">
      <label className="label">
        <span>Cerca</span>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Es. Lautaro, Barella…"
        />
      </label>

      <label className="label">
        <span>Ruolo</span>
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="ALL">Tutti</option>
          <option value="P">P</option>
          <option value="D">D</option>
          <option value="C">C</option>
          <option value="A">A</option>
        </select>
      </label>

      {mode === "ROSA" && (
        <label className="label">
          <span>Squadra fantacalcio</span>
          <select
            className="select"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="ALL">Tutte</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  </div>
</div>

      <div className="card" style={{ marginBottom: 12 }}>
  <div className="cardBody">
    <label className="row" style={{ gap: 10 }}>
      <input
        type="checkbox"
        checked={onlyActive}
        onChange={(e) => setOnlyActive(e.target.checked)}
      />
      <span style={{ color: "var(--muted)", fontWeight: 800 }}>
        Solo giocatori attivi
      </span>
    </label>
  </div>
</div>

      {/* Lista */}
<div style={{ display: "grid", gap: 8 }}>
  {filtered.map((p) => (
    <div key={p.id} className="card">
      <div className="cardBody">
        <div style={{ fontWeight: 800 }}>
          {p.role} — {p.name}
        </div>

        <div style={{ opacity: 0.85, fontSize: 14 }}>
          {p.serieATeam}
          {mode === "ROSA" ? (
            <>
              {" "}
              • {(p as LeaguePlayer).ownerTeam} • costo {(p as LeaguePlayer).cost}
            </>
          ) : (
            <> • Svincolato</>
          )}
          {!p.active ? " • (non più in campionato)" : ""}
        </div>
      </div>
    </div>
  ))}
</div>

</div>
  );
}
