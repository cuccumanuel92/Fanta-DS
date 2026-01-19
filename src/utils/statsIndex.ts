import raw from "../data/fc_stats_flat.json";

export type FcStat = {
  id: string;
  role: "P" | "D" | "C" | "A";
  name: string;
  team: string;
  pg: number;
  mv: number;
  fm: number;
  gf: number;
  ass: number;
  amm: number;
  esp: number;
  au: number;
  rs: number;
  rf: number;
  rp: number;
};

const norm = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const makeKey = (role: string, name: string, team: string) =>
  `${role}|${norm(name)}|${norm(team)}`;

const stats = raw as FcStat[];

export const statsByKey = new Map<string, FcStat>(
  stats.map((s) => [makeKey(s.role, s.name, s.team), s])
);