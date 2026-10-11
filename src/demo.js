import { rng } from './util.js';

// Fake data for test
const PROJECTS = [
  { name: 'terra-garden', start: 0, rate: 1.2, langs: [['JavaScript', 0.6, '#f1e05a'], ['CSS', 0.25, '#563d7c'], ['HTML', 0.15, '#e34c26']] },
  { name: 'discord-bot', start: 8, rate: 0.9, langs: [['Python', 0.9, '#3572A5'], ['Markdown', 0.1, '#083fa1']] },
  { name: 'portfolio', start: 15, rate: 0.7, langs: [['TypeScript', 0.55, '#3178c6'], ['CSS', 0.3, '#563d7c'], ['HTML', 0.15, '#e34c26']] },
  { name: 'gba-emulator', start: 3, rate: 1.0, langs: [['Rust', 0.85, '#dea584'], ['C', 0.15, '#555555']] },
  { name: 'pico-game', start: 22, rate: 0.8, langs: [['Lua', 1, '#000080']] },
  { name: 'api-server', start: 30, rate: 0.6, langs: [['Go', 0.8, '#00ADD8'], ['YAML', 0.2, '#cb171e']] },
  { name: 'dotfiles', start: 12, rate: 0.15, langs: [['Shell', 0.7, '#89e051'], ['Lua', 0.3, '#000080']] },
  { name: 'ml-notes', start: 36, rate: 0.5, langs: [['Python', 0.6, '#3572A5'], ['Markdown', 0.4, '#083fa1']] },
  { name: 'robot-arm', start: 44, rate: 0.7, langs: [['C++', 0.75, '#f34b7d'], ['Python', 0.25, '#3572A5']] },
  { name: 'android-app', start: 50, rate: 0.55, langs: [['Kotlin', 0.7, '#A97BFF'], ['Java', 0.3, '#b07219']] },
  { name: 'blog', start: 56, rate: 0.35, langs: [['Markdown', 0.5, '#083fa1'], ['HTML', 0.3, '#e34c26'], ['CSS', 0.2, '#563d7c']] },
];

const DAYS = 66;
const isoDay = (d) => d.toISOString().slice(0, 10);

export function makeDemo() {
  const rand = rng(7);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const cum = Object.fromEntries(PROJECTS.map((p) => [p.name, 0]));
  const history = [];
  for (let i = 0; i < DAYS; i++) {
    const date = isoDay(new Date(today.getTime() - (DAYS - 1 - i) * 864e5));
    let total = 0;
    for (const p of PROJECTS) {
      if (i >= p.start && rand() < 0.72) cum[p.name] += Math.round(p.rate * (0.3 + rand() * 1.4) * 3600);
      total += cum[p.name];
    }
    history.push({ date, total, projects: { ...cum } });
  }
  const last = history[history.length - 1];
  const langTotals = {};
  const projects = PROJECTS.map((p) => ({
    name: p.name,
    seconds: last.projects[p.name],
    languages: p.langs.map(([name, share, color]) => {
      const seconds = Math.round(last.projects[p.name] * share);
      langTotals[name] = langTotals[name] || { name, seconds: 0, color };
      langTotals[name].seconds += seconds;
      return { name, seconds, color };
    }),
  })).filter((p) => p.seconds > 0);
  const latest = {
    date: last.date, username: 'demo-farmer', totalSeconds: last.total, projects,
    languages: Object.values(langTotals).sort((a, b) => b.seconds - a.seconds),
  };
  return { latest, history };
}