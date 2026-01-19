import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const INPUT = path.resolve("data_in", "fc_stats.xlsx");
const OUT_DIR = path.resolve("src", "data");
const OUT_FILE = path.resolve(OUT_DIR, "fc_stats_flat.json");

// parole chiave tipiche intestazioni Fantacalcio
const HEADER_HINTS = ["Nome", "R", "Ruolo", "Squadra", "Pg", "Mv", "FM", "Gf", "Ass", "Amm", "Esp", "Au"];

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function norm(s: unknown) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function findHeaderRow(rows: any[][]) {
  // trova la riga con più "hint" presenti
  let bestIdx = -1;
  let bestScore = 0;

  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i] || [];
    const cells = row.map(norm);

    let score = 0;
    for (const h of HEADER_HINTS) {
      if (cells.some((c) => c.toLowerCase() === h.toLowerCase())) score++;
    }

    // spesso ci sono righe vuote o titoli: le scartiamo
    const nonEmpty = cells.filter((c) => c !== "").length;

    if (score > bestScore && nonEmpty >= 4) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return { bestIdx, bestScore };
}

function buildIndexMap(header: string[]) {
  // mappa colonne (tollerante a variazioni)
  const idx = (names: string[]) => {
    const lower = header.map((h) => h.toLowerCase());
    for (const n of names) {
      const j = lower.indexOf(n.toLowerCase());
      if (j >= 0) return j;
    }
    return -1;
  };

  return {
    role: idx(["r", "ruolo"]),
    name: idx(["nome", "calciatore"]),
    team: idx(["squadra", "squadra a", "sq"]),
    pg: idx(["pg", "partite", "presenze"]),
    mv: idx(["mv", "media voto", "mediavoto"]),
    fm: idx(["fm", "f.m.", "fantamedia", "fanta media"]),
    gf: idx(["gf", "gol", "reti"]),
    ass: idx(["ass", "assist"]),
    amm: idx(["amm", "ammonizioni"]),
    esp: idx(["esp", "espulsioni"]),
    au: idx(["au", "autogol"]),
    rs: idx(["rs", "rigori segnati"]),
    rf: idx(["rf", "rigori falliti"]),
    rp: idx(["rp", "rigori parati"]),
  };
}

function toNum(x: unknown) {
  const s = norm(x).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ File non trovato: ${INPUT}`);
    process.exit(1);
  }

  const wb = (XLSX as any).readFile(INPUT, { cellDates: true });

  const sheetName = "Tutti";
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.error(`❌ Foglio "${sheetName}" non trovato. Fogli:`, wb.SheetNames);
    process.exit(1);
  }

  // Leggiamo come matrice grezza
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
  console.log("✅ File letto:", INPUT);
  console.log("📄 Foglio usato:", sheetName);
  console.log("📦 Righe totali:", rows.length);

  const { bestIdx, bestScore } = findHeaderRow(rows);
  if (bestIdx < 0) {
    console.error("❌ Non trovo la riga intestazioni. Prime 10 righe:");
    console.log(rows.slice(0, 10));
    process.exit(1);
  }

  const header = (rows[bestIdx] || []).map(norm);
  console.log("🧾 Header trovato a riga:", bestIdx, "score:", bestScore);
  console.log("🧾 Header:", header);

  const map = buildIndexMap(header);
  console.log("🧭 Mappa colonne:", map);

  // dati = righe dopo l'header
  const dataRows = rows.slice(bestIdx + 1);

  // Filtriamo righe vuote / separatori
  const out = dataRows
    .map((r) => r.map(norm))
    .filter((r) => r.some((c) => c !== ""))
    .map((r, i) => {
      const role = map.role >= 0 ? r[map.role] : "";
      const name = map.name >= 0 ? r[map.name] : "";
      const team = map.team >= 0 ? r[map.team] : "";

      // se manca il nome, scartiamo (probabile separatore)
      if (!name || name.length < 2) return null;

      return {
        id: `${role}|${team}|${name}`.toLowerCase(),
        role,
        name,
        team,
        pg: map.pg >= 0 ? toNum(r[map.pg]) : 0,
        mv: map.mv >= 0 ? toNum(r[map.mv]) : 0,
        fm: map.fm >= 0 ? toNum(r[map.fm]) : 0,
        gf: map.gf >= 0 ? toNum(r[map.gf]) : 0,
        ass: map.ass >= 0 ? toNum(r[map.ass]) : 0,
        amm: map.amm >= 0 ? toNum(r[map.amm]) : 0,
        esp: map.esp >= 0 ? toNum(r[map.esp]) : 0,
        au: map.au >= 0 ? toNum(r[map.au]) : 0,
        rs: map.rs >= 0 ? toNum(r[map.rs]) : 0,
        rf: map.rf >= 0 ? toNum(r[map.rf]) : 0,
        rp: map.rp >= 0 ? toNum(r[map.rp]) : 0,
      };
    })
    .filter(Boolean);

  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf-8");

  console.log("✅ Creato:", OUT_FILE);
  console.log("🔎 Esempio prima riga:", out[0]);
  console.log("📊 Totale record:", out.length);
}

main();