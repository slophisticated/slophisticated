import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function parseContributions(html) {
  const days = [...html.matchAll(/<td\b[^>]*>/g)].flatMap(([tag]) => {
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const level = tag.match(/data-level="([0-4])"/)?.[1];
    return date && level !== undefined ? [{ date, level: Number(level) }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 350 || days.length > 372 || new Set(days.map(d => d.date)).size !== days.length) {
    throw new Error('Invalid contribution calendar; keeping the previous snapshot.');
  }
  for (let i = 1; i < days.length; i++) {
    if (Date.parse(days[i].date) - Date.parse(days[i - 1].date) !== 86400000) {
      throw new Error('Contribution calendar contains missing days.');
    }
  }
  return days;
}

export function renderContributions(days) {
  const first = new Date(days[0].date + 'T00:00:00Z');
  const offset = first.getUTCDay();
  const start = first.getTime();
  const positions = days.map(d => {
    const n = Math.round((Date.parse(d.date) - start) / 86400000) + offset;
    return { ...d, x: 32 + Math.floor(n / 7) * 17, y: 32 + n % 7 * 17 };
  });
  const active = positions.filter(d => d.level > 0);
  const colors = ['#e8dff0', '#d1b9e2', '#b18bce', '#8960aa', '#58356f'];
  const cells = positions.map(d => `<rect x="${d.x}" y="${d.y}" width="11" height="11" rx="3" fill="${colors[d.level]}"><title>${d.date}: contribution level ${d.level} of 4</title></rect>`).join('');
  const trail = active.length > 1 ? [...active, active[0]] : active;
  const frames = trail.length > 1 ? trail.map((d, i) => `${(i / (trail.length - 1) * 100).toFixed(3)}%{transform:translate(${d.x + 5.5}px,${d.y + 5.5}px)}`).join('') : '';
  const ring = active.length > 1 ? `<g class="traveler"><circle r="7.5" fill="none" stroke="#30203e" stroke-width="1.5"/><circle r="2" fill="#30203e"/></g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="210" viewBox="0 0 960 210" role="img" aria-labelledby="title desc">
<title id="title">slophisticated's GitHub contributions</title>
<desc id="desc">Actual GitHub contribution intensity from ${days[0].date} to ${days.at(-1).date}. A marker visits active days in chronological order. Darker squares mean more contributions.</desc>
<style>.traveler{animation:visit 28s linear infinite}@keyframes visit{${frames}}@media(prefers-reduced-motion:reduce){.traveler{display:none;animation:none}}</style>
<rect width="960" height="210" rx="16" fill="#f5f0fa"/>
${cells}${ring}
<g font-family="Arial,sans-serif" font-size="13" fill="#604b74"><text x="32" y="179">${days[0].date} — ${days.at(-1).date}</text><text x="763" y="179">less</text><text x="902" y="179">more</text></g>
${colors.map((c, i) => `<rect x="${800 + i * 18}" y="168" width="11" height="11" rx="3" fill="${c}"/>`).join('')}
</svg>\n`;
}

async function main() {
  const response = await fetch('https://github.com/users/slophisticated/contributions', {
    headers: { 'User-Agent': 'slophisticated-profile', Accept: 'text/html' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}; retaining previous asset.`);
  const days = parseContributions(await response.text());
  await mkdir('assets', { recursive: true });
  await writeFile('assets/contributions.svg', renderContributions(days));
  console.log(`Generated ${days.length} days, ${days.filter(d => d.level > 0).length} active days.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
