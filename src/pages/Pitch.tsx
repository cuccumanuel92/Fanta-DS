import { useMemo, useState } from "react";
import players from "../data/players.json";
import { statsByKey, makeKey, type FcStat } from "../utils/statsIndex";

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

const MODULES: Record<string, { D: number; C: number; A: number }> = {
  "3-4-3": { D: 3, C: 4, A: 3 },
  "3-5-2": { D: 3, C: 5, A: 2 },
  "4-3-3": { D: 4, C: 3, A: 3 },
  "4-4-2": { D: 4, C: 4, A: 2 },
  "4-5-1": { D: 4, C: 5, A: 1 },
  "5-3-2": { D: 5, C: 3, A: 2 },
};

function isEmpty(p: LeaguePlayer) {
  return p.id.startsWith("empty-") || p.name === "—";
}

export default function Pitch() {
  const league = players as LeaguePlayer[];

  const owners = useMemo(() => {
    return Array.from(new Set(league.map((p) => p.ownerTeam))).sort((a, b) => a.localeCompare(b));
  }, [league]);

  const [team, setTeam] = useState<string>(owners[0] ?? "Q² Brothers");
  const [module, setModule] = useState<string>("4-4-2");
  const [selected, setSelected] = useState<LeaguePlayer | null>(null);

const selectedStats: FcStat | null = useMemo(() => {
  if (!selected) return null;
  const k = makeKey(selected.role, selected.name, selected.serieATeam);
  return statsByKey.get(k) ?? null;
}, [selected]);
  const cfg = MODULES[module] ?? MODULES["4-4-2"];

  const myPlayers = useMemo(() => league.filter((p) => p.ownerTeam === team), [league, team]);
  const byRole = (r: Role) => myPlayers.filter((p) => p.role === r);

  // selezione formazione (semplice: primi N)
  const gk = byRole("P").slice(0, 1);
  const def = byRole("D").slice(0, cfg.D);
  const mid = byRole("C").slice(0, cfg.C);
  const att = byRole("A").slice(0, cfg.A);

  // slots vuoti per visualizzare lo schieramento
  const fill = (arr: LeaguePlayer[], n: number, role: Role) => {
    const out = [...arr];
    while (out.length < n) {
      out.push({
        id: `empty-${role}-${out.length}`,
        ownerTeam: team,
        role,
        name: "—",
        serieATeam: "",
        cost: 0,
        active: true,
      });
    }
    return out;
  };

  const gkLine = fill(gk, 1, "P");
  const defLine = fill(def, cfg.D, "D");
  const midLine = fill(mid, cfg.C, "C");
  const attLine = fill(att, cfg.A, "A");

  // titolari effettivi (no empty)
  const starters = useMemo(() => {
    const ids = new Set<string>();
    [...gkLine, ...defLine, ...midLine, ...attLine].forEach((p) => {
      if (!isEmpty(p)) ids.add(p.id);
    });
    return ids;
  }, [gkLine, defLine, midLine, attLine]);

  const bench = useMemo(() => myPlayers.filter((p) => !starters.has(p.id)), [myPlayers, starters]);

  // --- MODAL & CONFRONTO ---
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const selectedPlayer = useMemo(() => {
    if (!selectedId) return null;
    return myPlayers.find((p) => p.id === selectedId) ?? null;
  }, [selectedId, myPlayers]);

  const openPlayer = (p: LeaguePlayer) => {
    if (isEmpty(p)) return;
    setSelectedId(p.id);
    setOpen(true);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      // limitiamo a 3 per UX pulita
      return next.slice(0, 3);
    });
  };

  const comparedPlayers = useMemo(() => {
    const map = new Map(myPlayers.map((p) => [p.id, p]));
    return compareIds.map((id) => map.get(id)).filter(Boolean) as LeaguePlayer[];
  }, [compareIds, myPlayers]);

  // --- PREVENZIONE EMERGENZE (per ora demo) ---
  // (Qui poi ci attacchiamo a diffide/squalifiche/titolarità)
  const emergencyHint = useMemo(() => {
    const needA = byRole("A").length < 4;
    const needC = byRole("C").length < 6;
    const needD = byRole("D").length < 6;
    const needP = byRole("P").length < 2;

    const arr: string[] = [];
    if (needA) arr.push("Attacco sotto soglia: rischio emergenza tra 2–3 giornate.");
    if (needC) arr.push("Centrocampo corto: valuta una copertura da voto.");
    if (needD) arr.push("Difesa borderline: priorità titolari con minutaggio.");
    if (needP) arr.push("Portieri sotto soglia: intervento urgente.");
    if (!arr.length) arr.push("Nessuna emergenza evidente: controlla solo titolarità e diffide.");

    return arr;
  }, [myPlayers]);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h1">Visione Campo</div>
              <div className="sub">Formazione visuale + panchina (MVP)</div>
            </div>
            <span className="badge">{module}</span>
          </div>
        </div>

        <div className="cardBody">
          {/* FILTRI */}
          <div className="gridFilters" style={{ marginBottom: 10 }}>
            <label className="label">
              <span>Squadra</span>
              <select className="select" value={team} onChange={(e) => setTeam(e.target.value)}>
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="label">
              <span>Modulo</span>
              <select className="select" value={module} onChange={(e) => setModule(e.target.value)}>
                {Object.keys(MODULES).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* PREVENZIONE EMERGENZE -> SOPRA IL CAMPO */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="cardBody">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 900 }}>Prevenzione emergenze</div>
                <span className="badge">demo</span>
              </div>

              <div className="sub" style={{ marginBottom: 10 }}>
                Obiettivo: prevedere criticità su 2–3 giornate (diffide, squalifiche, titolarità).
              </div>

              <ul className="emList">
                {emergencyHint.map((t) => (
                  <li key={t} className="emItem">
                    {t}
                  </li>
                ))}
              </ul>

              {compareIds.length >= 2 && (
                <button className="btnPrimary" style={{ marginTop: 10 }} onClick={() => setCompareOpen(true)}>
                  Confronta ({compareIds.length})
                </button>
              )}
            </div>
          </div>

          {/* CAMPO */}
          <div className="pitch pitchField">
            {/* linee (le hai già sistemate nel CSS) */}
            <div className="pitchMarks">
              <div className="pitchOuter" />
              <div className="pitchMid" />
              <div className="pitchCenterCircle" />
              <div className="pitchCenterDot" />
              <div className="boxTop" />
              <div className="sixTop" />
              <div className="arcTop" />
              <div className="boxBottom" />
              <div className="sixBottom" />
              <div className="arcBottom" />
            </div>

            <div className="pitchPlayers">
              <div className="line lineAtt">
  {attLine.map((p) => (
    <PlayerChip key={p.id} p={p} onClick={() => p.id.startsWith("empty-") ? null : setSelected(p)} />
  ))}
</div>

              <div className="line lineMid">
  {attLine.map((p) => (
    <PlayerChip key={p.id} p={p} onClick={() => p.id.startsWith("empty-") ? null : setSelected(p)} />
  ))}
</div>

              <div className="line lineDef">
  {attLine.map((p) => (
    <PlayerChip key={p.id} p={p} onClick={() => p.id.startsWith("empty-") ? null : setSelected(p)} />
  ))}
</div>

              <div className="line lineGk">
  {attLine.map((p) => (
    <PlayerChip key={p.id} p={p} onClick={() => p.id.startsWith("empty-") ? null : setSelected(p)} />
  ))}
</div>
            </div>
          </div>

{selected ? (
  <div className="modalBackdrop" onClick={() => setSelected(null)}>
    <div className="modalCard" onClick={(e) => e.stopPropagation()}>
      <div className="modalHeader">
        <div style={{ fontWeight: 900 }}>{selected.name}</div>
        <button className="iconBtn" onClick={() => setSelected(null)} aria-label="Chiudi">
          ✕
        </button>
      </div>

      <div className="sub" style={{ marginBottom: 10 }}>
        {selected.role} • {selected.serieATeam}
      </div>

      {selectedStats ? (
        <div className="statsGrid">
          <div className="stat"><span>PG</span><b>{selectedStats.pg}</b></div>
          <div className="stat"><span>MV</span><b>{selectedStats.mv}</b></div>
          <div className="stat"><span>FM</span><b>{selectedStats.fm}</b></div>
          <div className="stat"><span>GOL</span><b>{selectedStats.gf}</b></div>
          <div className="stat"><span>ASS</span><b>{selectedStats.ass}</b></div>
          <div className="stat"><span>AMM</span><b>{selectedStats.amm}</b></div>
          <div className="stat"><span>ESP</span><b>{selectedStats.esp}</b></div>
          <div className="stat"><span>AU</span><b>{selectedStats.au}</b></div>
        </div>
      ) : (
        <div className="sub">
          Nessuna statistica trovata (match nome/squadra).  
          Se mi dici un esempio di giocatore che non matcha, aggiustiamo la normalizzazione.
        </div>
      )}
    </div>
  </div>
) : null}

          {/* PANCHINA SOTTO IL CAMPO */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardHeader">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 900 }}>A disposizione</div>
                <span className="badge">{bench.length}</span>
              </div>
              <div className="sub" style={{ marginTop: 6 }}>
                Tocca un giocatore per aprire la scheda. Puoi anche selezionare 2–3 nomi per confronto.
              </div>
            </div>

            <div className="cardBody">
              {bench.length ? (
                <div className="benchList">
                  {bench.map((p) => (
                    <button
                      key={p.id}
                      className={`benchItem ${compareIds.includes(p.id) ? "benchItemActive" : ""}`}
                      onClick={() => openPlayer(p)}
                    >
                      <div className="benchMain">
                        <div className="benchName">{p.name}</div>
                        <div className="benchMeta">
                          {p.serieATeam} • {p.role} • {p.active ? "attivo" : "non attivo"}
                        </div>
                      </div>

                      <div className="benchActions">
                        <button
                          className="miniBtn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(p.id);
                          }}
                        >
                          {compareIds.includes(p.id) ? "−" : "+"}
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="sub">Nessun giocatore in panchina (dati o modulo).</div>
              )}

              {compareIds.length >= 2 && (
                <button className="btnPrimary" style={{ marginTop: 12 }} onClick={() => setCompareOpen(true)}>
                  Apri confronto ({compareIds.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETTAGLIO */}
      {open && selectedPlayer && (
        <Modal
          title="Scheda giocatore"
          onClose={() => {
            setOpen(false);
            setSelectedId(null);
          }}
        >
          <div className="playerHeader">
            <div className="playerName">{selectedPlayer.name}</div>
            <div className="playerMeta">
              {selectedPlayer.serieATeam} • ruolo {selectedPlayer.role} • costo {selectedPlayer.cost}
            </div>
          </div>

          <div className="statGrid">
            <Stat label="Titolarità" value="(da integrare)" />
            <Stat label="Presenze" value="(da integrare)" />
            <Stat label="Gol" value="(da integrare)" />
            <Stat label="Assist" value="(da integrare)" />
            <Stat label="MV / FM" value="(da integrare)" />
            <Stat label="Rischio" value="(da integrare)" />
          </div>

          <div className="row" style={{ gap: 10, marginTop: 14, justifyContent: "space-between" }}>
            <button
              className={`btnGhost ${compareIds.includes(selectedPlayer.id) ? "btnGhostActive" : ""}`}
              onClick={() => toggleCompare(selectedPlayer.id)}
            >
              {compareIds.includes(selectedPlayer.id) ? "Rimuovi dal confronto" : "Aggiungi al confronto"}
            </button>

            <button
              className="btnPrimary"
              disabled={compareIds.length < 2}
              onClick={() => {
                setOpen(false);
                setCompareOpen(true);
              }}
            >
              Confronta ({compareIds.length})
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL CONFRONTO */}
      {compareOpen && (
        <Modal
          title={`Confronto (${comparedPlayers.length})`}
          onClose={() => setCompareOpen(false)}
        >
          {comparedPlayers.length < 2 ? (
            <div className="sub">Seleziona almeno 2 giocatori per il confronto.</div>
          ) : (
            <div className="compareGrid">
              {comparedPlayers.map((p) => (
                <div key={p.id} className="compareCard">
                  <div className="compareTitle">{p.name}</div>
                  <div className="compareSub">{p.serieATeam} • {p.role}</div>

                  <div className="compareStats">
                    <CompareRow label="Costo" value={`${p.cost}`} />
                    <CompareRow label="Attivo" value={p.active ? "✅" : "❌"} />
                    <CompareRow label="MV/FM" value="(da integrare)" />
                    <CompareRow label="Minuti" value="(da integrare)" />
                    <CompareRow label="Gol/Assist" value="(da integrare)" />
                    <CompareRow label="Rischio" value="(da integrare)" />
                  </div>

                  <button
                    className="miniBtnWide"
                    onClick={() => setCompareIds((prev) => prev.filter((x) => x !== p.id))}
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="row" style={{ gap: 10, marginTop: 12 }}>
            <button className="btnGhost" onClick={() => setCompareIds([])}>
              Svuota confronto
            </button>
            <button className="btnPrimary" onClick={() => setCompareOpen(false)}>
              Chiudi
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PlayerChip({ p, onClick }: { p: LeaguePlayer; onClick?: () => void }) {
  const initial = p.name?.[0]?.toUpperCase() ?? "?";
  const short = p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name;

  const isEmpty = p.name === "—" || p.id.startsWith("empty-");

  return (
    <button
      type="button"
      className={`pchip pchip_${p.role}`}
      onClick={onClick}
      disabled={isEmpty}
      style={{ cursor: isEmpty ? "default" : "pointer" }}
    >
      <div className="pchipAvatar">{initial}</div>
      <div className="pchipName">{short}</div>
      <div className="pchipMeta">{p.serieATeam}</div>
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="compareRow">
      <div className="compareLabel">{label}</div>
      <div className="compareValue">{value}</div>
    </div>
  );
}