import { useMemo } from "react";
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

type WindowType = "PRE_ASTA" | "ASTA" | "POST_ASTA" | "NORMALE";

const ROLE_MIN: Record<Role, number> = { P: 2, D: 6, C: 6, A: 4 };

// MVP: finestra hardcoded (poi la renderemo configurabile)
const windowNow: {
  type: WindowType;
  canTrade: boolean;
  canBuyForCredits: boolean;
  canFreeAgents: boolean;
  canDrop: boolean;
  closesInLabel: string;
} = {
  type: "PRE_ASTA",
  canTrade: true,
  canBuyForCredits: true,
  canFreeAgents: true,
  canDrop: true,
  closesInLabel: "2g 4h",
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TEAM_ALIASES: Record<string, string> = {
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
  return TEAM_ALIASES[x] ?? x;
};

const key = (p: { name: string; serieATeam: string }) =>
  `${norm(p.name)}|${normTeam(p.serieATeam)}`;

export default function Moves() {
  const league = players as LeaguePlayer[];
  const all = serieAPlayers as SerieAPlayer[];

  // MVP: squadra "corrente" = prima ownerTeam trovata
  const myTeam = league[0]?.ownerTeam ?? "Q² Brothers";
  const myPlayers = useMemo(() => league.filter((p) => p.ownerTeam === myTeam), [league, myTeam]);

  const countRole = (r: Role) => myPlayers.filter((p) => p.role === r).length;

  const needRoles = useMemo(() => {
    const roles: Role[] = ["A", "C", "D", "P"]; // priorità (A prima)
    return roles.filter((r) => countRole(r) < ROLE_MIN[r]);
  }, [myPlayers]);

  const surplusRoles = useMemo(() => {
    const roles: Role[] = ["D", "C", "A", "P"]; // tipicamente offri D/C
    return roles.filter((r) => countRole(r) > ROLE_MIN[r]);
  }, [myPlayers]);

  // svincolati = listone - acquistati
  const ownedKeys = useMemo(() => new Set(league.map(key)), [league]);
  const freeAgents = useMemo(() => all.filter((p) => !ownedKeys.has(key(p))), [all, ownedKeys]);

  // ---- Suggerimento 1: trade/acquisto ----
  const tradeSuggestion = useMemo(() => {
    if (!windowNow.canTrade && !windowNow.canBuyForCredits) return null;

    const need: Role | null = needRoles[0] ?? null;
    if (!need) return null;

    const others = Array.from(new Set(league.map((p) => p.ownerTeam))).filter((t) => t !== myTeam);

    // candidati: giocatori degli altri nel ruolo "need"
    const candidates = league
      .filter((p) => p.ownerTeam !== myTeam)
      .filter((p) => p.role === need)
      .filter((p) => p.active);

    if (candidates.length === 0) return null;

    // target semplice: il primo (poi miglioriamo con MV/FM)
    const target = candidates[0];

    // contropartita: un tuo giocatore in surplus, stesso “valore” (MVP: costo più basso)
    const offerPoolRole = surplusRoles[0] ?? "D";
    const offers = myPlayers
      .filter((p) => p.role === offerPoolRole)
      .slice()
      .sort((a, b) => a.cost - b.cost);

    const offer = offers[0] ?? myPlayers.slice().sort((a, b) => a.cost - b.cost)[0];

    const creditOffer = Math.max(5, Math.min(35, Math.round(target.cost * 0.7)));

    return {
      need,
      targetTeam: target.ownerTeam,
      targetName: target.name,
      targetSerieA: target.serieATeam,
      offerName: offer?.name ?? "—",
      offerSerieA: offer?.serieATeam ?? "—",
      offerRole: offer?.role ?? "D",
      creditOffer,
      canBuyForCredits: windowNow.canBuyForCredits,
    };
  }, [needRoles, surplusRoles, league, myPlayers, myTeam]);

  // ---- Suggerimento 2: busta chiusa su svincolato ----
  const freeAgentSuggestion = useMemo(() => {
    if (!windowNow.canFreeAgents) return null;

    const need: Role | null = needRoles[0] ?? null;
    if (!need) return null;

    const candidates = freeAgents.filter((p) => p.role === need).filter((p) => p.active);
    if (candidates.length === 0) return null;

    const pick = candidates[0];

    const base =
      need === "A" ? 14 : need === "C" ? 12 : need === "D" ? 9 : 4;

    const offer = base; // MVP fisso (poi lo rendiamo intelligente)

    return { need, name: pick.name, serieATeam: pick.serieATeam, offer };
  }, [freeAgents, needRoles]);

  const why = useMemo(() => {
    if (!needRoles.length) return "La tua rosa non mostra emergenze immediate (soglie MVP).";
    const r = needRoles[0];
    const label = r === "A" ? "attacco" : r === "C" ? "centrocampo" : r === "D" ? "difesa" : "porta";
    return `Sei sotto soglia in ${label}: meglio muoversi ora per prevenire emergenze tra 2–3 giornate.`;
  }, [needRoles]);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h1">Mossa consigliata</div>
              <div className="sub">
                Finestra: {windowNow.type} • chiude tra: {windowNow.closesInLabel}
              </div>
            </div>
            <span className="badge">BETA</span>
          </div>
        </div>

        <div className="cardBody">
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Perché</div>
          <div className="sub">{why}</div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardBody">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                1) Scambio / Acquisto (da avversario)
              </div>

              {tradeSuggestion ? (
                <div className="sub">
                  Chiedi a <b>{tradeSuggestion.targetTeam}</b>: <b>{tradeSuggestion.targetName}</b> ({tradeSuggestion.targetSerieA})
                  <br />
                  Offri: <b>{tradeSuggestion.offerName}</b> ({tradeSuggestion.offerSerieA}) — ruolo {tradeSuggestion.offerRole}
                  {tradeSuggestion.canBuyForCredits ? (
                    <>
                      <br />
                      Oppure prova acquisto a crediti: <b>{tradeSuggestion.creditOffer}</b>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="sub">Nessun suggerimento trade disponibile (dati o finestra).</div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardBody">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                2) Busta chiusa su svincolato
              </div>

              {freeAgentSuggestion ? (
                <div className="sub">
                  Punta su: <b>{freeAgentSuggestion.name}</b> ({freeAgentSuggestion.serieATeam})<br />
                  Offerta consigliata: <b>{freeAgentSuggestion.offer}</b> crediti
                </div>
              ) : (
                <div className="sub">Nessun svincolato utile trovato nel ruolo in emergenza.</div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardBody">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Vincoli finestra</div>
              <div className="sub">
                Scambi: {windowNow.canTrade ? "✅" : "❌"} • Acquisti a crediti: {windowNow.canBuyForCredits ? "✅" : "❌"} •
                Svincolati: {windowNow.canFreeAgents ? "✅" : "❌"} • Svincoli: {windowNow.canDrop ? "✅" : "❌"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}