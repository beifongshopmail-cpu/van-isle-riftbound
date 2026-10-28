// parse.js -- turns a PlayRiftbound event page into RAVI's small live file.
// Shared by the server (worker.js) and the tests. No dependencies.
//
// The event page is server-rendered and streams its data as
// self.__next_f.push([1,"..."]) chunks. Joined, they hold one
// {"__typename":"CompeteTournament",...} object with the whole event:
// config, rounds, pairings, results and standings (M16 recon, 2026-10-27).
// Everything outside is untrusted: every field is rebuilt from checked
// values and anything unexpected is dropped, never passed through.

export const LIVE_VERSION = 1;

// ---- page -> stream text ----
export function streamFromHtml(html) {
  if (typeof html !== "string") return "";
  const out = [];
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse('"' + m[1] + '"')); } catch (e) { /* skip a broken chunk */ }
  }
  return out.join("");
}

// ---- stream text -> the raw tournament object ----
export function tournamentFromStream(text) {
  if (typeof text !== "string") return null;
  const key = '{"__typename":"CompeteTournament"';
  const start = text.indexOf(key);
  if (start < 0) return null;
  const end = matchBrace(text, start);
  if (end < 0) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { return null; }
}

function matchBrace(s, i) {
  let depth = 0, inStr = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (c === "\\") { j++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return j; }
  }
  return -1;
}

// ---- checked field readers ----
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{1,9})?Z$/;
const DIGITS = /^\d{1,24}$/;
const UUIDISH = /^[0-9a-f-]{8,40}$/i;

function str(v, max) {
  if (typeof v !== "string") return null;
  // The stream marks strings that start with $ by doubling it; a lone $ is a reference.
  if (v.charAt(0) === "$") { if (v.charAt(1) !== "$") return null; v = v.slice(1); }
  v = v.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, "").trim();
  if (!v) return null;
  return v.length > max ? v.slice(0, max) : v;
}
function iso(v) {
  if (typeof v !== "string" || !ISO.test(v)) return null;
  // keep milliseconds only
  return v.replace(/\.(\d{1,3})\d*Z$/, (a, ms) => "." + ms.padEnd(3, "0") + "Z");
}
function id(v) { return typeof v === "string" && DIGITS.test(v) ? v : null; }
function int(v, lo, hi) { return Number.isInteger(v) && v >= lo && v <= hi ? v : null; }
function pct(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && isFinite(n) && n >= 0 && n <= 1 ? Math.round(n * 1000) / 1000 : null;
}
function oneOf(v, list) { return list.indexOf(v) >= 0 ? v : null; }
function arr(v) { return Array.isArray(v) ? v : []; }

const ROUND_STATUS = { IN_PROGRESS: "live", FINALIZED: "done", UNSTARTED: "next", PENDING: "next", COMPLETED: "done" };
const MATCH_STATUS = { UNSTARTED: "open", IN_PROGRESS: "playing", COMPLETED: "done", FINALIZED: "done" };
const OUTCOME = { WIN: "W", LOSS: "L", DRAW: "D", TIE: "D" };

function player(p) {
  if (!p || typeof p !== "object") return null;
  const n = str(p.displayName, 40);
  if (!n) return null;
  return { n: n, tag: str(p.tagLine, 12) || "" };
}

// ---- the raw object -> RAVI's live file ----
export function liveFromTournament(t, fetchedAt) {
  if (!t || typeof t !== "object" || t.__typename !== "CompeteTournament") return null;
  const tid = id(t.id);
  if (!tid) return null;
  const c = t.config && typeof t.config === "object" ? t.config : {};
  const bo = /^BO([135])$/.exec(String(c.matchFormat || ""));

  // team id -> player, from the participants list (status kept for drops)
  const teams = Object.create(null);
  let active = 0, dropped = 0;
  for (const tp of arr(t.tournamentParticipants)) {
    const team = id(tp && tp.esportsTeamId);
    const pl = player(tp && tp.player);
    if (!team || !pl) continue;
    const st = tp.status === "ACTIVE" ? "in" : (typeof tp.status === "string" ? "out" : "in");
    if (st === "in") active++; else dropped++;
    teams[team] = { n: pl.n, tag: pl.tag, st: st };
  }

  const rounds = [];
  arr(t.stages).forEach(function (stage, si) {
    arr(stage && stage.sections).forEach(function (section) {
      for (const r of arr(section && section.rounds)) {
        const n = int(r && r.roundNumber, 1, 99);
        if (n === null) continue;
        const tables = [];
        // Riot sends a bye as a match against a pretend player named BYE
        // (team id "bye-opponent-..."): the player goes in byes, not tables.
        const byeSet = new Set(arr(r.byeTeamIds).map(id).filter(Boolean));
        const extraByes = [];
        for (const m of arr(r.matches)) {
          const raw = arr(m && m.teams).slice(0, 2).map(function (tm) { return String((tm && tm.esportsTeamId) || ""); });
          const real = raw.filter(function (x) { return /^\d+$/.test(x); });
          if (raw.some(function (x) { return /^bye-/i.test(x); }) || (real.length === 1 && byeSet.has(real[0]) && raw.length < 2)) {
            for (const x of raw) if (/^\d+$/.test(x) && !byeSet.has(x)) extraByes.push(x);
            continue;
          }
          const sides = arr(m && m.teams).slice(0, 2).map(function (tm) {
            const team = id(tm && tm.esportsTeamId);
            const pl = player(arr(tm && tm.players)[0]) || (team && teams[team]) || null;
            if (pl && team && !teams[team]) teams[team] = { n: pl.n, tag: pl.tag, st: "in" };
            return pl ? { n: pl.n, tag: pl.tag, team: team } : null;
          });
          if (!sides[0]) continue;
          const outcomeOf = function (list, team) {
            for (const o of arr(list)) if (o && id(o.esportsTeamId) === team) return OUTCOME[o.outcome] || null;
            return null;
          };
          const a = sides[0], b = sides[1] || null;
          const res = outcomeOf(m.teamOutcomes, a.team);
          const games = [];
          for (const g of arr(m.games)) {
            const gn = int(g && g.number, 1, 9);
            if (gn === null) continue;
            games.push(outcomeOf(g.teamOutcomes, a.team));
          }
          tables.push({
            t: int(m.tableNumber, 0, 9999),
            st: MATCH_STATUS[m.status] || "open",
            a: { n: a.n, tag: a.tag },
            b: b ? { n: b.n, tag: b.tag } : null,
            res: res,            // a's result: W, L, D, or null while unreported
            games: games         // a's result per game, null while unplayed
          });
        }
        tables.sort(function (x, y) { return (x.t === null ? 1e9 : x.t) - (y.t === null ? 1e9 : y.t); });
        const byes = [];
        for (const bt of arr(r.byeTeamIds).concat(extraByes)) { const k = id(bt); if (k && teams[k] && !byes.some(function (b) { return b.n === teams[k].n && b.tag === teams[k].tag; })) byes.push({ n: teams[k].n, tag: teams[k].tag }); }
        let standings = null;
        if (Array.isArray(r.endOfRoundStandings)) {
          standings = [];
          for (const s of r.endOfRoundStandings) {
            const k = id(s && s.esportsTeamId);
            const rank = int(s && s.rank, 1, 9999);
            if (!k || rank === null || !teams[k]) continue;
            standings.push({
              rank: rank, n: teams[k].n, tag: teams[k].tag,
              pts: int(s.matchPoints, 0, 999), w: int(s.matchWins, 0, 99), l: int(s.matchLosses, 0, 99), d: int(s.matchDraws, 0, 99),
              omw: pct(s.opponentMatchWinPercentage), gw: pct(s.gameWinPercentage), ogw: pct(s.opponentGameWinPercentage)
            });
          }
          standings.sort(function (x, y) { return x.rank - y.rank; });
        }
        rounds.push({
          stage: si + 1, n: n,
          st: ROUND_STATUS[r.status] || "next",
          start: iso(r.startedAt),
          min: int(r.roundDuration, 1, 600),
          byes: byes, tables: tables, standings: standings
        });
      }
    });
  });

  const want = int(c.roundCount, 1, 99);
  let status = "upcoming";
  if (rounds.some(function (r) { return r.st === "live"; })) status = "live";
  else if (rounds.length && want && rounds.filter(function (r) { return r.st === "done"; }).length >= want && rounds.every(function (r) { return r.st === "done"; })) status = "done";
  else if (rounds.length) status = "between";

  return {
    v: LIVE_VERSION,
    id: tid,
    name: str(t.name, 120),
    startsAt: iso(t.startsAt),
    endsAt: iso(t.endsAt),
    updatedAt: iso(t.updatedAt),
    fetchedAt: fetchedAt || null,
    type: str(c.tournamentType, 30),
    format: str(c.format, 30),
    structure: str(c.structure, 30),
    bestOf: bo ? Number(bo[1]) : null,
    roundCount: want,
    capacity: int(c.participantCapacity, 0, 100000),
    players: active,
    dropped: dropped,
    status: status,
    rounds: rounds
  };
}

export function liveFromHtml(html, fetchedAt) {
  return liveFromTournament(tournamentFromStream(streamFromHtml(html)), fetchedAt);
}
