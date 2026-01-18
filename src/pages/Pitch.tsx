import { useMemo, useState } from "react";
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

export default function Pitch() {
  const league = players as LeaguePlayer[];

  const owners = useMemo(() => {
    return Array.from(new Set(league.map((p) => p.ownerTeam))).sort((a, b) => a.localeCompare(b));
  }, [league]);

  const [team, setTeam] = useState<string>(owners[0] ?? "Q² Brothers");

  const myPlayers = useMemo(() => league.filter((p) => p.ownerTeam === team), [league, team]);
  const byRole = (r: Role) => myPlayers.filter((p) => p.role === r);

  // Demo: 4-4-2 (solo visual)
  const gk = byRole("P").slice(0, 1);
  const def = byRole("D").slice(0, 4);
  const mid = byRole("C").slice(0, 4);
  const att = byRole("A").slice(0, 2);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="h1">Visione Campo</div>
              <div className="sub">Formazione visuale (demo)</div>
            </div>
            <span className="badge">4-4-2</span>
          </div>
        </div>

        <div className="cardBody">
          <label className="label" style={{ marginBottom: 10 }}>
            <span>Squadra</span>
            <select className="select" value={team} onChange={(e) => setTeam(e.target.value)}>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <div className="pitch pitchField">
  <div className="pitchLines" />
  <div className="pitchPlayers">
    <div className="line lineAtt">{att.map((p) => <PlayerChip key={p.id} p={p} />)}</div>
    <div className="line lineMid">{mid.map((p) => <PlayerChip key={p.id} p={p} />)}</div>
    <div className="line lineDef">{def.map((p) => <PlayerChip key={p.id} p={p} />)}</div>
    <div className="line lineGk">{gk.map((p) => <PlayerChip key={p.id} p={p} />)}</div>
  </div>
</div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardBody">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Prevenzione emergenze (demo)</div>
              <div className="sub">
                Qui inseriremo: diffide, squalifiche previste, rischio titolarità, e suggerimenti “entro 2-3 giornate”.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerChip({ p }: { p: LeaguePlayer }) {
  const initial = p.name?.[0]?.toUpperCase() ?? "?";
  const short = p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name;

  return (
    <div className={`pchip pchip_${p.role}`}>
      <div className="pchipAvatar">{initial}</div>
      <div className="pchipName">{short}</div>
      <div className="pchipMeta">{p.serieATeam}</div>
    </div>
  );
}