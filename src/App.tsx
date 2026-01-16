import React, { useMemo, useState } from "react";
import { ArrowRightLeft, ClipboardCopy, Sparkles, ShieldAlert, Swords, TrendingUp, Users } from "lucide-react";

type Role = "P" | "D" | "C" | "A";

type Player = {
  id: string;
  name: string;
  role: Role;
  team: string;
  mv: number;
  fm: number;
  mins: number;
  trend: number;
  status: "fit" | "inj" | "sus";
};

type Squad = { id: string; name: string; roster: Player[] };

type League = {
  name: string;
  mode: "Classico";
  platform: "Leghe FC";
  squads: Squad[];
};

type NeedLevel = "low" | "medium" | "high";
type RoleNeed = { role: Role; need: NeedLevel; score: number; reason: string };

type Suggestion = {
  opponent: string;
  give: Player[];
  get: Player[];
  whyMe: string[];
  whyThem: string[];
  acceptScore: number;
  message: string;
  variants: {
    title: string;
    opponent: string;
    give: Player[];
    get: Player[];
    acceptScore: number;
    message: string;
  }[];
};

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function roleLabel(r: Role) { return r === "P" ? "Por" : r === "D" ? "Dif" : r === "C" ? "Cen" : "Att"; }

function needBadge(need: NeedLevel) {
  if (need === "high") return <span className="badge danger">Emergenza</span>;
  if (need === "medium") return <span className="badge warn">Copertura ok</span>;
  return <span className="badge ok">Abbondanza</span>;
}
function statusBadge(s: Player["status"]) {
  if (s === "fit") return <span className="badge">OK</span>;
  if (s === "inj") return <span className="badge danger">INF</span>;
  return <span className="badge warn">SQUAL</span>;
}

function playerValue(p: Player) {
  const base = p.mins * 0.55 + p.fm * 8 + p.trend * 10;
  const malus = p.status === "fit" ? 0 : p.status === "sus" ? 10 : 18;
  return clamp(Math.round(base - malus), 0, 100);
}
function playable(p: Player) { return p.mins >= 55 && p.status !== "inj"; }

function computeRoleNeed(roster: Player[], role: Role): RoleNeed {
  const pool = roster.filter((p) => p.role === role);
  const fit = pool.filter((p) => p.status === "fit");
  const playableCount = pool.filter(playable).length;

  const safe = role === "A" ? 3 : role === "C" ? 5 : role === "D" ? 5 : 2;
  const critical = role === "A" ? 2 : role === "C" ? 4 : role === "D" ? 4 : 1;

  let score = 70;
  score -= (safe - playableCount) * 18;
  score -= pool.length < safe ? (safe - pool.length) * 10 : 0;
  score -= (pool.length - fit.length) * 6;
  score = clamp(score, 0, 100);

  let need: NeedLevel = "low";
  if (playableCount <= critical) need = "high";
  else if (playableCount <= safe) need = "medium";
  else need = "low";

  let reason = "";
  if (need === "high") reason = `Hai solo ${playableCount} ${roleLabel(role)} realmente schierabili.`;
  else if (need === "medium") reason = `Copertura ${roleLabel(role)} discreta (${playableCount} schierabili).`;
  else reason = `Abbondanza ${roleLabel(role)} (${playableCount} schierabili).`;

  return { role, need, score, reason };
}

function pickCedeable(roster: Player[], preferRole: Role, count: number): Player[] {
  const candidates = roster
    .filter((p) => p.role === preferRole)
    .filter((p) => p.status !== "inj")
    .sort((a, b) => playerValue(a) - playerValue(b));

  const picked: Player[] = [];
  for (const p of candidates) {
    if (picked.length >= count) break;
    const v = playerValue(p);
    if (v >= 80) continue; // evita perni
    picked.push(p);
  }

  if (picked.length < count) {
    const rest = roster
      .filter((p) => p.role !== "P")
      .filter((p) => p.status !== "inj")
      .sort((a, b) => playerValue(a) - playerValue(b));
    for (const p of rest) {
      if (picked.length >= count) break;
      if (picked.some((x) => x.id === p.id)) continue;
      const v = playerValue(p);
      if (v >= 82) continue;
      picked.push(p);
    }
  }
  return picked.slice(0, count);
}

function pickTarget(roster: Player[], needRole: Role): Player[] {
  const candidates = roster
    .filter((p) => p.role === needRole)
    .filter(playable)
    .sort((a, b) => playerValue(b) - playerValue(a));
  if (candidates.length === 0) return [];
  if (candidates.length <= 2) return [candidates[0]];
  return [candidates[1]]; // buono ma realistico
}

function acceptabilityScore(myNeed: RoleNeed, oppNeed: RoleNeed, give: Player[], get: Player[]) {
  const giveV = give.reduce((s, p) => s + playerValue(p), 0);
  const getV = get.reduce((s, p) => s + playerValue(p), 0);

  let score = 50;
  score += myNeed.need === "high" ? 18 : myNeed.need === "medium" ? 10 : 0;
  score += oppNeed.need === "high" ? 18 : oppNeed.need === "medium" ? 10 : 0;

  const delta = getV - giveV;
  score -= clamp(Math.round(delta * 0.35), -10, 22);

  if (give.length === 2 && get.length === 1 && oppNeed.need !== "low") score += 6;
  return clamp(score, 0, 100);
}

function buildMessage(opponent: string, give: Player[], get: Player[]) {
  const giveTxt = give.map(p => `${p.name} (${roleLabel(p.role)})`).join(" + ");
  const getTxt = get.map(p => `${p.name} (${roleLabel(p.role)})`).join(" + ");
  return `Ciao! Sto valutando uno scambio con te.\n\n👉 Ti propongo: ${giveTxt}\n👈 In cambio: ${getTxt}\n\nSe ti va ne parliamo, posso anche valutare piccole varianti 🙂`;
}

function buildSuggestion(league: League, myTeamId: string): Suggestion {
  const me = league.squads.find((s) => s.id === myTeamId)!;
  const others = league.squads.filter((s) => s.id !== myTeamId);

  const myNeeds = {
    A: computeRoleNeed(me.roster, "A"),
    C: computeRoleNeed(me.roster, "C"),
    D: computeRoleNeed(me.roster, "D"),
  } as const;

  const priority: RoleNeed[] = [myNeeds.A, myNeeds.D, myNeeds.C].sort((a, b) => {
    const w = (n: RoleNeed) => (n.need === "high" ? 3 : n.need === "medium" ? 2 : 1);
    return w(b) - w(a) || a.score - b.score;
  });

  const myPrimaryNeed = priority[0];
  const myNeedRole = myPrimaryNeed.role;

  const mySurplus = [myNeeds.C, myNeeds.D, myNeeds.A]
    .sort((a, b) => b.score - a.score)
    .find((x) => x.role !== myNeedRole)!;

  const candidates = others
    .map((opp) => {
      const oppNeedInGiveRole = computeRoleNeed(opp.roster, mySurplus.role);
      const oppHasTargets = opp.roster.some((p) => p.role === myNeedRole && playable(p));
      return { opp, oppNeedInGiveRole, oppHasTargets };
    })
    .filter((c) => c.oppHasTargets)
    .sort((a, b) => {
      const w = (n: RoleNeed) => (n.need === "high" ? 3 : n.need === "medium" ? 2 : 1);
      return w(b.oppNeedInGiveRole) - w(a.oppNeedInGiveRole);
    });

  const best = candidates[0] ?? {
    opp: others[0],
    oppNeedInGiveRole: computeRoleNeed(others[0].roster, mySurplus.role),
    oppHasTargets: true
  };

  const give = pickCedeable(me.roster, mySurplus.role, best.oppNeedInGiveRole.need === "high" ? 2 : 1);
  const get = pickTarget(best.opp.roster, myNeedRole);
  const acceptScore = acceptabilityScore(myPrimaryNeed, best.oppNeedInGiveRole, give, get);

  const whyMe = [
    `Risolvi un buco in ${roleLabel(myNeedRole)} senza indebolirti in modo critico.`,
    `Stai cedendo soprattutto surplus (${roleLabel(mySurplus.role)}).`,
  ];

  const whyThem = [
    `Hanno bisogno in ${roleLabel(mySurplus.role)}: aumenta le opzioni schierabili subito.`,
    `Proposta “vendibile”: risolve un problema concreto, non solo i numeri.`,
  ];

  const message = buildMessage(best.opp.name, give, get);

  const variants: Suggestion["variants"] = [];

  if (give.length === 2) {
    const vGive = [give[0]];
    const vScore = acceptabilityScore(myPrimaryNeed, best.oppNeedInGiveRole, vGive, get);
    variants.push({
      title: "Variante più semplice (1x1)",
      opponent: best.opp.name,
      give: vGive,
      get,
      acceptScore: vScore,
      message: buildMessage(best.opp.name, vGive, get)
    });
  }

  const alt = candidates[1];
  if (alt) {
    const aGive = pickCedeable(me.roster, mySurplus.role, alt.oppNeedInGiveRole.need === "high" ? 2 : 1);
    const aGet = pickTarget(alt.opp.roster, myNeedRole);
    const aScore = acceptabilityScore(myPrimaryNeed, alt.oppNeedInGiveRole, aGive, aGet);
    variants.push({
      title: "Alternativa su altro avversario",
      opponent: alt.opp.name,
      give: aGive,
      get: aGet,
      acceptScore: aScore,
      message: buildMessage(alt.opp.name, aGive, aGet)
    });
  }

  return { opponent: best.opp.name, give, get, whyMe, whyThem, acceptScore, message, variants };
}

const demoLeague: League = {
  name: "Demo League",
  mode: "Classico",
  platform: "Leghe FC",
  squads: [
    { id: "q2", name: "Q² Brothers", roster: [] },
    { id: "spich", name: "Spich United", roster: [] }
  ],
};

type Screen = "onboarding" | "dashboard" | "suggestion";

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="cardHeader">
      <div className="cardTitle">
        {icon}
        <span>{title}</span>
        {hint ? <span className="muted" style={{ fontWeight: 500 }}>· {hint}</span> : null}
      </div>
    </div>
  );
}

function PlayerTable({ roster }: { roster: Player[] }) {
  const rows = [...roster].sort((a, b) => a.role.localeCompare(b.role) || (playerValue(b) - playerValue(a)));
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Giocatore</th><th>Ruolo</th><th>Valore</th><th>Min</th><th>FM</th><th>Stato</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(p => (
          <tr key={p.id}>
            <td>{p.name}<div className="muted" style={{ fontSize: 12 }}>{p.team}</div></td>
            <td>{roleLabel(p.role)}</td>
            <td className="muted">{playerValue(p)}</td>
            <td>{p.mins}</td>
            <td>{p.fm.toFixed(1)}</td>
            <td>{statusBadge(p.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AccordionTab({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button className="tab" onClick={() => setOpen(!open)}>{title}</button>
      {open ? <div className="panel">{children}</div> : null}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [leagueName, setLeagueName] = useState("DREAM QSE LEAGUE");
const [myTeamId, setMyTeamId] = useState("q2");
const [note, setNote] = useState("");
const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

// NEW: league state + CSV
const [league, setLeague] = useState<League>({ ...demoLeague, name: "DREAM QSE LEAGUE" });
const [csvText, setCsvText] = useState(
  "squad,name,role,team,mv,fm,mins,trend,status\n" +
  "Q² Brothers,Attaccante Alpha,A,TeamX,6.2,7.1,72,0.4,fit\n" +
  "Q² Brothers,Centrocampista Perla,C,TeamA,6.4,7.2,84,0.6,fit\n" +
  "Spich United,Attaccante Toro,A,TeamL,6.3,7.3,83,0.4,fit\n"
);

// derive me
const me = useMemo(() => league.squads.find(s => s.id === myTeamId)!, [league.squads, myTeamId]);

// keep league name in sync
useMemo(() => {
  setLeague((prev) => ({ ...prev, name: leagueName }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [leagueName]);

  const needs = useMemo(() => ({
    A: computeRoleNeed(me.roster, "A"),
    C: computeRoleNeed(me.roster, "C"),
    D: computeRoleNeed(me.roster, "D"),
  }), [me.roster]);

function normRole(r: string): Role | null {
  const x = r.trim().toUpperCase();
  if (x === "P" || x === "D" || x === "C" || x === "A") return x as Role;
  return null;
}

function normStatus(s: string): Player["status"] {
  const x = s.trim().toLowerCase();
  if (x === "inj") return "inj";
  if (x === "sus") return "sus";
  return "fit";
}

function importCsv() {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    alert("CSV vuoto o incompleto.");
    return;
  }

  const header = lines[0].toLowerCase();
  if (!header.includes("squad") || !header.includes("name") || !header.includes("role")) {
    alert("Header CSV non valido. Usa: squad,name,role,team,mv,fm,mins,trend,status");
    return;
  }

  const rows = lines.slice(1);
  const parsed: { squad: string; p: Player }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i].split(",").map(c => c.trim());
    if (cols.length < 3) continue;

    const squad = cols[0] ?? "";
    const name = cols[1] ?? "";
    const roleRaw = cols[2] ?? "";
    const role = normRole(roleRaw);
    if (!squad || !name || !role) continue;

    const team = cols[3] ?? "";
    const mv = Number(cols[4] ?? 0) || 0;
    const fm = Number(cols[5] ?? 0) || 0;
    const mins = Number(cols[6] ?? 0) || 0;
    const trend = Number(cols[7] ?? 0) || 0;
    const status = normStatus(cols[8] ?? "fit");

    const p: Player = {
      id: `${squad}-${name}-${role}-${i}`.replace(/\s+/g, "_"),
      name,
      role,
      team,
      mv,
      fm,
      mins,
      trend,
      status,
    };
    parsed.push({ squad, p });
  }

  if (parsed.length === 0) {
    alert("Nessuna riga valida trovata.");
    return;
  }

  const squadMap = new Map<string, Player[]>();
  for (const r of parsed) {
    squadMap.set(r.squad, [...(squadMap.get(r.squad) ?? []), r.p]);
  }

  const squads: Squad[] = Array.from(squadMap.entries()).map(([name, roster]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/gi, "-"),
    name,
    roster,
  }));

  setLeague(prev => ({ ...prev, squads }));

  if (!squads.some(s => s.id === myTeamId)) {
    setMyTeamId(squads[0].id);
  }

  alert(`Import completato ✅ Squadre: ${squads.length} · Giocatori: ${parsed.length}`);
}

  function runSuggest() {
    const s = buildSuggestion(league, myTeamId);
    setSuggestion(s);
    setScreen("suggestion");
  }

  async function copyToClipboard(text: string) {
    try { await navigator.clipboard.writeText(text); alert("Messaggio copiato ✅"); }
    catch { alert("Impossibile copiare automaticamente. Seleziona e copia manualmente."); }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <Sparkles size={18} />
          <div>
            <h1>Fantamercato AI – MVP</h1>
            <div className="pill">{league.platform} · {league.mode} · {league.name}</div>
          </div>
        </div>
        <div className="btnGroup">
          {screen !== "onboarding" && (
  <>
    <button type="button" className="btn small" onClick={() => setScreen("onboarding")}>
      Home
    </button>
    <button type="button" className="btn small" onClick={() => setScreen("dashboard")}>
      <Users size={16} /> Dashboard
    </button>
  </>
)}
        </div>
      </div>

      {screen === "onboarding" && (
        <div className="card">
          <SectionTitle icon={<Users size={18} />} title="Onboarding" hint="Imposta lega e squadra" />
          <div className="cardContent">
            <div className="row">
              <div className="col">
                <label className="label">Nome lega</label>
                <input className="input" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} />
              </div>
              <div className="col">
                <label className="label">La tua squadra</label>
                <select value={myTeamId} onChange={(e) => setMyTeamId(e.target.value)} className="input">
                  {league.squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="hr" />
            <div className="notice">
              <div className="noticeTitle"><ShieldAlert size={18} /> Import dati (MVP)</div>
              <ul>
                <li>In questa demo i dati sono già caricati (rose di esempio).</li>
                <li>Nel prossimo step aggiungiamo upload CSV / inserimento rapido.</li>
              </ul>
            </div>

            <div className="hr" />
            <div className="btnGroup">
              <button type="button" className="btn primary" onClick={() => setScreen("dashboard")}>
<div className="hr" />
<div className="notice">
  <div className="noticeTitle"><ShieldAlert size={18} /> Importa rose (CSV)</div>
  <div className="muted" style={{ marginTop: 8 }}>
    Incolla qui un CSV con header: <code>squad,name,role,team,mv,fm,mins,trend,status</code>
  </div>
  <div style={{ marginTop: 10 }}>
    <textarea
  className="textarea"
  value={csvText}
  onChange={(e) => setCsvText(e.target.value)}
  onClick={(e) => e.stopPropagation()}
  onFocus={(e) => e.stopPropagation()}
/>
  </div>
  <div className="btnGroup" style={{ marginTop: 10 }}>
    <button type="button" className="btn primary" onClick={importCsv}>
Importa rose</button>
  </div>
</div>

                Vai alla dashboard <ArrowRightLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "dashboard" && (
        <>
          <div className="card">
            <SectionTitle icon={<Swords size={18} />} title="Stato rosa" hint={me.name} />
            <div className="cardContent">
              <div className="row">
                <div className="col">
                  <div className="kpi"><strong>Attacco</strong><div className="right">{needBadge(needs.A.need)}<span className="badge">{needs.A.score}/100</span></div></div>
                  <div className="muted" style={{ marginTop: 8 }}>{needs.A.reason}</div>
                  <div className="progressOuter" style={{ marginTop: 10 }}><div className="progressInner" style={{ width: `${needs.A.score}%` }} /></div>
                </div>
                <div className="col">
                  <div className="kpi"><strong>Centrocampo</strong><div className="right">{needBadge(needs.C.need)}<span className="badge">{needs.C.score}/100</span></div></div>
                  <div className="muted" style={{ marginTop: 8 }}>{needs.C.reason}</div>
                  <div className="progressOuter" style={{ marginTop: 10 }}><div className="progressInner" style={{ width: `${needs.C.score}%` }} /></div>
                </div>
                <div className="col">
                  <div className="kpi"><strong>Difesa</strong><div className="right">{needBadge(needs.D.need)}<span className="badge">{needs.D.score}/100</span></div></div>
                  <div className="muted" style={{ marginTop: 8 }}>{needs.D.reason}</div>
                  <div className="progressOuter" style={{ marginTop: 10 }}><div className="progressInner" style={{ width: `${needs.D.score}%` }} /></div>
                </div>
              </div>

              <div className="hr" />
              <div className="btnGroup">
                <button className="btn primary" onClick={runSuggest}><Sparkles size={16} /> Suggeriscimi una mossa</button>
              </div>

              <div className="hr" />
              <label className="label">Nota (opzionale)</label>
              <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es: mi manca un attaccante titolare..." />
            </div>
          </div>

          <div className="card">
            <SectionTitle icon={<Users size={18} />} title="La tua rosa (demo)" hint="dati fittizi" />
            <div className="cardContent"><PlayerTable roster={me.roster} /></div>
          </div>
        </>
      )}

      {screen === "suggestion" && suggestion && (
        <>
          <div className="card">
            <SectionTitle icon={<Sparkles size={18} />} title="Mossa consigliata" hint={`Accettazione: ${suggestion.acceptScore}/100`} />
            <div className="cardContent">
              <div className="row">
                <div className="col">
                  <div className="badge">Avversario: <strong style={{ color: "var(--text)" }}>{suggestion.opponent}</strong></div>
                  <div className="muted" style={{ marginTop: 10 }}>
                    <strong style={{ color: "var(--text)" }}>Tu dai</strong>
                    {suggestion.give.map(p => (
                      <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                        <span className="badge">{roleLabel(p.role)}</span><span>{p.name}</span>
                        <span className="muted">· valore {playerValue(p)}</span>{statusBadge(p.status)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col">
                  <div className="badge">Obiettivo: {roleLabel(suggestion.get[0]?.role ?? "A")}</div>
                  <div className="muted" style={{ marginTop: 10 }}>
                    <strong style={{ color: "var(--text)" }}>Tu ricevi</strong>
                    {suggestion.get.map(p => (
                      <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                        <span className="badge">{roleLabel(p.role)}</span><span>{p.name}</span>
                        <span className="muted">· valore {playerValue(p)}</span>{statusBadge(p.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hr" />
              <div className="row">
                <div className="col">
                  <div className="notice"><div className="noticeTitle"><TrendingUp size={18} /> Perché conviene a te</div>
                    <ul>{suggestion.whyMe.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                </div>
                <div className="col">
                  <div className="notice"><div className="noticeTitle"><Users size={18} /> Perché può accettare lui</div>
                    <ul>{suggestion.whyThem.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                </div>
              </div>

              <div className="hr" />
              <label className="label">Messaggio pronto</label>
              <textarea className="textarea" value={suggestion.message} readOnly />
              <div className="btnGroup" style={{ marginTop: 10 }}>
                <button className="btn primary" onClick={() => copyToClipboard(suggestion.message)}><ClipboardCopy size={16} /> Copia messaggio</button>
                <button className="btn" onClick={() => setScreen("dashboard")}>Torna</button>
              </div>
            </div>
          </div>

          <div className="card">
            <SectionTitle icon={<ArrowRightLeft size={18} />} title="Alternative" hint="se vuoi variare" />
            <div className="cardContent">
              {suggestion.variants.map((v, idx) => (
                <AccordionTab key={idx} title={`${idx + 1}. ${v.title} · accettazione ${v.acceptScore}/100`}>
                  <div className="muted"><strong style={{ color: "var(--text)" }}>Avversario:</strong> {v.opponent}</div>
                  <div className="hr" />
                  <label className="label">Messaggio</label>
                  <textarea className="textarea" value={v.message} readOnly />
                  <div className="btnGroup" style={{ marginTop: 10 }}>
                    <button className="btn primary" onClick={() => copyToClipboard(v.message)}><ClipboardCopy size={16} /> Copia</button>
                  </div>
                </AccordionTab>
              ))}
              {suggestion.variants.length === 0 && <div className="muted">Nessuna alternativa disponibile.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
