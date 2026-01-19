const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normTeam = (t: string) => norm(t);

export const keyPlayer = (p: { name: string; serieATeam: string }) =>
  `${norm(p.name)}|${normTeam(p.serieATeam)}`;