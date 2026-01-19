export type Role = "P" | "D" | "C" | "A";

export type PlayerStats = {
  // chiave di matching
  name: string;
  serieATeam: string;
  role: Role;

  // probabilità voto
  presenze?: number;
  minuti?: number;
  titolaritaPct?: number; // 0-100
  injured?: boolean;
  suspended?: boolean;
  doubtful?: boolean;
  yellowRisk?: boolean; // diffidato

  // qualità voto
  mv?: number;
  fm?: number;
  gol?: number;
  assist?: number;
  amm?: number;
  esp?: number;

  // trend (ultime 5)
  mv5?: number;
  fm5?: number;
  minuti5?: number;

  // calendario (prossime 3)
  next?: Array<{ opp?: string; home?: boolean; difficulty?: number }>;
};

// placeholder: qui poi importeremo da Leghe FC
export const STATS: PlayerStats[] = [];