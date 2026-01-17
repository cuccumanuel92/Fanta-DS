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
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>
  Calciatori ({source.length}/{mode === "ROSA" ? league.length : all.length})
</h1>

<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
  <button onClick={() => setMode("ROSA")}>In rosa</button>
  <button onClick={() => setMode("SVINCOLATI")}>Svincolati</button>
</div>


      {/* Filtri */}
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "1fr 120px 220px",
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Cerca</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Es. Lautaro, Barella…"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "inherit",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Ruolo</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "inherit",
            }}
          >
            <option value="ALL">Tutti</option>
            <option value="P">P</option>
            <option value="D">D</option>
            <option value="C">C</option>
            <option value="A">A</option>
          </select>
        </label>

        {mode === "ROSA" && (
  <label style={{ display: "grid", gap: 6 }}>
    <span style={{ fontSize: 12, opacity: 0.8 }}>Squadra fantacalcio</span>
    <select
      value={owner}
      onChange={(e) => setOwner(e.target.value)}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
        color: "inherit",
      }}
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

      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={onlyActive}
          onChange={(e) => setOnlyActive(e.target.checked)}
        />
        <span>Solo giocatori attivi</span>
      </label>

      {/* Lista */}
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
            }}
          >
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
            </div>          </div>
        ))}
      </div>
    </div>
  );
}
