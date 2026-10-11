// Pulls Hackatime stats and saves a daily snapshot into the repo.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public', 'data');
const snapDir = path.join(dataDir, 'snapshots');

const config = JSON.parse(await readFile(path.join(root, 'terra.config.json'), 'utf8'));
const USER = process.env.HACKATIME_USER || config.username;
const BASE = (process.env.HACKATIME_API || config.apiBase).replace(/\/$/, '');
const MAX_PROJECTS = config.maxProjects ?? 24;
const START = config.startDate ?? '2023-01-01';

if (!USER) {
  console.error('No Hackatime username. Set "username" in terra.config.json or the HACKATIME_USER variable.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (iso, n) => isoDay(new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5));

async function api(params, tries = 4) {
  const url = `${BASE}/api/v1/users/${encodeURIComponent(USER)}/stats?${new URLSearchParams(params)}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.status === 404) throw new Error(`Hackatime user "${USER}" not found`);
      if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`HTTP ${res.status}`), { retry: true });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const json = await res.json();
      if (!json.data) throw new Error('Unexpected response (no "data")');
      return json.data;
    } catch (err) {
      if (!err.retry && !(err instanceof TypeError)) throw err;
      if (attempt >= tries) throw err;
      await sleep(1000 * attempt * attempt);
    }
  }
}

const compact = (list = []) =>
  list.filter((x) => x.total_seconds > 0).map((x) => ({
    name: x.name, seconds: x.total_seconds, ...(x.color ? { color: x.color } : {}),
  }));

const realProject = (p) => p.name && !['<<LAST_PROJECT>>', 'Other'].includes(p.name);

async function fetchSnapshot(date) {
  const base = { features: 'projects,languages', start_date: START, end_date: addDays(date, 1) };
  const all = await api({ ...base });
  if (all.is_coding_activity_visible === false) {
    throw new Error('Coding activity is hidden. Enable it in your Hackatime settings so the farm can read it.');
  }
  const projects = compact(all.projects).filter(realProject).slice(0, MAX_PROJECTS);
  for (const p of projects) {
    await sleep(350);
    try {
      const d = await api({ features: 'languages', start_date: START, end_date: base.end_date, filter_by_project: p.name });
      p.languages = compact(d.languages);
    } catch (err) {
      console.warn(`  languages for "${p.name}" skipped: ${err.message}`);
      p.languages = [];
    }
  }
  return {
    date, username: all.username ?? USER, generatedAt: new Date().toISOString(),
    totalSeconds: all.total_seconds ?? 0, projects, languages: compact(all.languages),
  };
}

// Cheap snapshot for backfill: totals + projects only (languages come from the latest snapshot).
async function fetchLight(date) {
  const all = await api({ features: 'projects', start_date: START, end_date: addDays(date, 1) });
  return {
    date, username: all.username ?? USER, totalSeconds: all.total_seconds ?? 0,
    projects: compact(all.projects).filter(realProject),
  };
}

async function save(snap) {
  await writeFile(path.join(snapDir, `${snap.date}.json`), JSON.stringify(snap) + '\n');
}

async function rebuildHistory() {
  const files = (await readdir(snapDir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  const history = [];
  for (const f of files) {
    const s = JSON.parse(await readFile(path.join(snapDir, f), 'utf8'));
    history.push({ date: s.date, total: s.totalSeconds, projects: Object.fromEntries(s.projects.map((p) => [p.name, p.seconds])) });
  }
  await writeFile(path.join(dataDir, 'history.json'), JSON.stringify(history) + '\n');
  return history.length;
}

await mkdir(snapDir, { recursive: true });
const today = isoDay(new Date());
const bf = process.argv.indexOf('--backfill');
const backfill = bf > -1 ? Math.max(0, parseInt(process.argv[bf + 1], 10) || 0) : 0;

console.log(`Fetching ${USER} @ ${BASE}`);
const latest = await fetchSnapshot(today);
await writeFile(path.join(dataDir, 'latest.json'), JSON.stringify(latest) + '\n');
await save(latest);
console.log(`  ${today}: ${(latest.totalSeconds / 3600).toFixed(1)}h across ${latest.projects.length} projects`);

for (let i = backfill; i >= 1; i--) {
  const day = addDays(today, -i);
  if (existsSync(path.join(snapDir, `${day}.json`))) continue;
  await sleep(350);
  try {
    const snap = await fetchLight(day);
    if (snap.totalSeconds > 0) { await save(snap); console.log(`  backfilled ${day}`); }
  } catch (err) { console.warn(`  backfill ${day} failed: ${err.message}`); }
}

console.log(`History: ${await rebuildHistory()} snapshots`);
