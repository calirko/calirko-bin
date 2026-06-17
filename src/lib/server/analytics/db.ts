import { mkdirSync } from "fs";
import { dirname, resolve } from "path";

// node:sqlite is a built-in in Node (unflagged since Node 23.4 / runtime is Node 24).
// It is NOT available under Bun, so we load it defensively: if it can't be loaded,
// analytics silently disables itself rather than crashing the site. Production runs
// on Node, where this resolves; local `bun run dev` simply won't capture.
let DatabaseSync: (new (path: string) => SqliteDb) | null = null;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  DatabaseSync = null;
}

// Minimal structural type for the bits of node:sqlite we use.
interface SqliteStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

const DB_PATH = resolve(process.env.ANALYTICS_DB_PATH ?? "./data/analytics.db");

let _db: SqliteDb | null = null;
let _disabled = false;

function getDb(): SqliteDb | null {
  if (_disabled) return null;
  if (!_db) {
    if (!DatabaseSync) {
      _disabled = true;
      console.warn(
        "[analytics] node:sqlite unavailable — traffic analytics disabled for this runtime.",
      );
      return null;
    }
    try {
      mkdirSync(dirname(DB_PATH), { recursive: true });
      _db = new DatabaseSync(DB_PATH);
      _db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts INTEGER NOT NULL,
          path TEXT NOT NULL,
          referrer TEXT,
          country TEXT,
          ua TEXT,
          visitor_hash TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS dwell (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts INTEGER NOT NULL,
          path TEXT NOT NULL,
          dwell_ms INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_views_ts ON views(ts);
        CREATE INDEX IF NOT EXISTS idx_dwell_ts ON dwell(ts);
      `);
    } catch (err) {
      _disabled = true;
      console.warn("[analytics] failed to open SQLite store — analytics disabled:", err);
      return null;
    }
  }
  return _db;
}

export interface ViewRecord {
  ts: number;
  path: string;
  referrer: string | null;
  country: string | null;
  ua: string | null;
  visitorHash: string;
}

export function insertView(r: ViewRecord): void {
  const db = getDb();
  if (!db) return;
  db.prepare(
    `INSERT INTO views (ts, path, referrer, country, ua, visitor_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(r.ts, r.path, r.referrer, r.country, r.ua, r.visitorHash);
}

export function insertDwell(path: string, dwellMs: number): void {
  const db = getDb();
  if (!db) return;
  db.prepare(`INSERT INTO dwell (ts, path, dwell_ms) VALUES (?, ?, ?)`).run(
    Date.now(),
    path,
    Math.round(dwellMs),
  );
}

/** Delete rows older than `maxAgeDays`. Best-effort; called opportunistically. */
export function prune(maxAgeDays: number): void {
  const db = getDb();
  if (!db) return;
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  db.prepare(`DELETE FROM views WHERE ts < ?`).run(cutoff);
  db.prepare(`DELETE FROM dwell WHERE ts < ?`).run(cutoff);
}

// ---- aggregation ----

export interface AnalyticsData {
  enabled: boolean;
  rangeDays: number;
  totals: {
    views: number;
    uniqueVisitors: number;
    last24hViews: number;
    medianDwellMs: number | null;
  };
  viewsOverTime: { date: string; views: number; visitors: number }[];
  topPaths: { path: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
  countries: { country: string; views: number }[];
  recent: { ts: number; path: string; country: string | null; referrer: string | null }[];
}

const EMPTY: AnalyticsData = {
  enabled: false,
  rangeDays: 30,
  totals: { views: 0, uniqueVisitors: 0, last24hViews: 0, medianDwellMs: null },
  viewsOverTime: [],
  topPaths: [],
  topReferrers: [],
  countries: [],
  recent: [],
};

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function getAnalytics(rangeDays = 30): AnalyticsData {
  const db = getDb();
  if (!db) return { ...EMPTY };

  const now = Date.now();
  const since = now - rangeDays * 86_400_000;

  const totalsRow = db
    .prepare(
      `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
       FROM views WHERE ts >= ?`,
    )
    .get(since) as { views: number; visitors: number };

  const last24h = db
    .prepare(`SELECT COUNT(*) AS c FROM views WHERE ts >= ?`)
    .get(now - 86_400_000) as { c: number };

  const dwellRows = db
    .prepare(`SELECT dwell_ms FROM dwell WHERE ts >= ? ORDER BY dwell_ms`)
    .all(since) as { dwell_ms: number }[];
  const medianDwellMs =
    dwellRows.length === 0 ? null : dwellRows[Math.floor(dwellRows.length / 2)].dwell_ms;

  // daily buckets, zero-filled
  const byDay = new Map<string, { views: number; visitorSet: Set<string> }>();
  const dayRows = db
    .prepare(`SELECT ts, visitor_hash FROM views WHERE ts >= ?`)
    .all(since) as { ts: number; visitor_hash: string }[];
  for (const row of dayRows) {
    const k = dayKey(row.ts);
    let bucket = byDay.get(k);
    if (!bucket) {
      bucket = { views: 0, visitorSet: new Set() };
      byDay.set(k, bucket);
    }
    bucket.views++;
    bucket.visitorSet.add(row.visitor_hash);
  }
  const viewsOverTime: AnalyticsData["viewsOverTime"] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const k = dayKey(now - i * 86_400_000);
    const bucket = byDay.get(k);
    viewsOverTime.push({
      date: k,
      views: bucket?.views ?? 0,
      visitors: bucket?.visitorSet.size ?? 0,
    });
  }

  const topPaths = db
    .prepare(
      `SELECT path, COUNT(*) AS views FROM views WHERE ts >= ?
       GROUP BY path ORDER BY views DESC LIMIT 10`,
    )
    .all(since) as { path: string; views: number }[];

  const topReferrers = (
    db
      .prepare(
        `SELECT COALESCE(referrer, 'direct') AS referrer, COUNT(*) AS views
         FROM views WHERE ts >= ?
         GROUP BY COALESCE(referrer, 'direct') ORDER BY views DESC LIMIT 10`,
      )
      .all(since) as { referrer: string; views: number }[]
  );

  const countries = db
    .prepare(
      `SELECT COALESCE(country, '??') AS country, COUNT(*) AS views
       FROM views WHERE ts >= ?
       GROUP BY COALESCE(country, '??') ORDER BY views DESC LIMIT 12`,
    )
    .all(since) as { country: string; views: number }[];

  const recent = db
    .prepare(
      `SELECT ts, path, country, referrer FROM views
       ORDER BY ts DESC LIMIT 25`,
    )
    .all() as AnalyticsData["recent"];

  return {
    enabled: true,
    rangeDays,
    totals: {
      views: totalsRow.views,
      uniqueVisitors: totalsRow.visitors,
      last24hViews: last24h.c,
      medianDwellMs,
    },
    viewsOverTime,
    topPaths,
    topReferrers,
    countries,
    recent,
  };
}
