import { PlayerStats } from "../data/stats";

export function scorePlayer(s: PlayerStats) {
  // score = probabilità voto + qualità voto + bonus - rischio
  const tit = (s.titolaritaPct ?? 50) / 100;     // 0..1
  const mv = s.mv ?? 6;
  const fm = s.fm ?? mv;
  const trend = ((s.fm5 ?? fm) - fm) * 0.6;      // se fm5 > fm sale
  const bonus = (s.gol ?? 0) * 0.35 + (s.assist ?? 0) * 0.25;

  const risk =
    (s.injured ? 0.9 : 0) +
    (s.suspended ? 1.0 : 0) +
    (s.doubtful ? 0.35 : 0) +
    (s.yellowRisk ? 0.15 : 0);

  const availability = Math.max(0, 1 - risk);

  // peso maggiore a probabilità voto
  const score =
    (tit * 6.2) +
    (mv * 0.9) +
    (fm * 1.1) +
    trend +
    bonus * 10;

  return score * availability;
}