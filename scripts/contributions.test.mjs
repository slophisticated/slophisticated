import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContributions, renderContributions } from './contributions.mjs';

const fixture = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(Date.UTC(2025, 0, 1) + i * 86400000).toISOString().slice(0, 10);
  return `<td data-level="${i % 5}" data-date="${date}"></td>`;
});
test('parses calendar in date order regardless of table ordering', () => {
  const days = parseContributions([...fixture].reverse().join(''));
  assert.equal(days[0].date, '2025-01-01');
  assert.equal(days.at(-1).date, '2025-12-31');
  assert.equal(days[1].level, 1);
});
test('rejects an error page, duplicate dates and missing days', () => {
  assert.throws(() => parseContributions('<h1>Rate limited</h1>'));
  assert.throws(() => parseContributions([...fixture, fixture[0]].join('')));
  assert.throws(() => parseContributions(fixture.filter((_, i) => i !== 25).join('')));
});
test('empty activity remains valid without an invented animated marker', () => {
  const days = parseContributions(fixture.join('').replace(/data-level="[0-4]"/g, 'data-level="0"'));
  const svg = renderContributions(days);
  assert.ok(!svg.includes('<g class="traveler">'));
  assert.ok(!svg.includes('NaN'));
  assert.match(svg, /prefers-reduced-motion/);
});
