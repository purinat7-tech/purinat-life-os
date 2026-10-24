/**
 * Hand-rolled charts: HTML bars (text stays readable at any width) and small SVGs.
 * Every chart has a text alternative (aria-label or a visually hidden table).
 */
import { html, raw, type SafeHtml } from '../lib/html.ts';
import type { HeatDay } from '../lib/speaklog.ts';
import { formatDate, monthName } from '../lib/dates.ts';

export interface BarDatum {
  label: string;
  value: number;
  title: string;
  current?: boolean;
}

export function barChart(data: BarDatum[], opts: { caption: string; unit: string }): SafeHtml {
  const max = Math.max(1, ...data.map((d) => d.value));
  return html`<figure class="bars-figure">
    <div class="bars" style="--n:${data.length}" aria-hidden="true">
      ${data.map(
        (d) => html`<div class="col" title="${d.title}">
          <span class="v">${d.current || d.value === max ? d.value : ''}</span>
          <div class="b${d.current ? ' current' : ''}" style="height:${d.value > 0 ? Math.max(3, Math.round((d.value / max) * 100)) : 0}%"></div>
          <span class="lbl">${d.label}</span>
        </div>`,
      )}
    </div>
    <figcaption class="sr-only">${opts.caption}</figcaption>
    <table class="sr-only"><thead><tr><th>Week</th><th>${opts.unit}</th></tr></thead>
      <tbody>${data.map((d) => html`<tr><td>${d.title}</td><td>${d.value}</td></tr>`)}</tbody></table>
  </figure>`;
}

/** Sparkline on a 0-100 scale. Null values break the line. */
export function sparkline(values: (number | null)[], label: string): SafeHtml {
  const W = 200;
  const H = 56;
  const pad = 4;
  const n = values.length;
  const x = (i: number) => (n <= 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1));
  const y = (v: number) => H - pad - (v / 100) * (H - pad * 2);
  const segments: string[] = [];
  let current = '';
  values.forEach((v, i) => {
    if (v === null) {
      if (current) segments.push(current);
      current = '';
      return;
    }
    current += `${current ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
  });
  if (current) segments.push(current);
  // A single point is drawn as a short flat tick so it stays visible.
  const paths = segments
    .map((d) => (d.trim().split('L').length === 1 ? d.replace(/M([\d.]+) ([\d.]+)/, (_m, px: string, py: string) => `M${Number(px) - 6} ${py} L${Number(px) + 6} ${py}`) : d))
    .map((d) => `<path class="line" d="${d.trim()}" vector-effect="non-scaling-stroke"/>`)
    .join('');
  return html`<svg class="chart spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${label}" height="${H}">
    <line class="grid" x1="0" x2="${W}" y1="${y(50)}" y2="${y(50)}" vector-effect="non-scaling-stroke" stroke-dasharray="3 4"/>
    ${raw(paths)}
  </svg>`;
}

function heatLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

/** Practice calendar, Monday-Sunday columns. Rendered at natural size inside a scroll container. */
export function heatmap(weeks: HeatDay[][]): SafeHtml {
  const cell = 13;
  const gap = 3;
  const left = 26;
  const top = 16;
  const width = left + weeks.length * (cell + gap);
  const height = top + 7 * (cell + gap);
  const parts: string[] = [];
  let lastMonth = '';
  let lastLabelCol = -10;
  weeks.forEach((week, w) => {
    const first = week[0];
    if (first) {
      const m = first.date.slice(5, 7);
      if (m !== lastMonth) {
        // Skip a label that would overlap the previous one (needs ~3 columns of room).
        if (w - lastLabelCol >= 3 && w < weeks.length - 1) {
          parts.push(`<text class="axis" x="${left + w * (cell + gap)}" y="11">${monthName(Number(m), 'short')}</text>`);
          lastLabelCol = w;
        }
        lastMonth = m;
      }
    }
    week.forEach((day, d) => {
      const cls = day.future ? 'heat-future' : `heat-${heatLevel(day.minutes)}`;
      const title = day.future ? '' : `<title>${formatDate(day.date)}: ${day.minutes} min</title>`;
      parts.push(`<rect class="${cls}" x="${left + w * (cell + gap)}" y="${top + d * (cell + gap)}" width="${cell}" height="${cell}" rx="2.5">${title}</rect>`);
    });
  });
  ['Mon', 'Wed', 'Fri'].forEach((label, i) => {
    parts.push(`<text class="axis" x="0" y="${top + i * 2 * (cell + gap) + cell - 2}">${label}</text>`);
  });
  const practised = weeks.flat().filter((d) => !d.future && d.minutes > 0).length;
  const total = weeks.flat().filter((d) => !d.future).length;
  return html`<div class="heatmap-wrap" data-scroll-end>
    <svg class="chart heatmap" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Practice calendar: practised on ${practised} of the last ${total} days">${raw(parts.join(''))}</svg>
  </div>
  <div class="legend" aria-hidden="true">Less
    <svg viewBox="0 0 72 12"><rect class="heat-0" x="0" width="12" height="12" rx="2"/><rect class="heat-1" x="15" width="12" height="12" rx="2"/><rect class="heat-2" x="30" width="12" height="12" rx="2"/><rect class="heat-3" x="45" width="12" height="12" rx="2"/><rect class="heat-4" x="60" width="12" height="12" rx="2"/></svg>
  More · 15 / 30 / 60 min steps</div>`;
}

/** Donut gauge 0-100. */
export function gauge(value: number, label: string): SafeHtml {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;
  return html`<svg class="gauge" viewBox="0 0 140 140" role="img" aria-label="${label}: ${value}%">
    <circle class="track" cx="70" cy="70" r="${r}" fill="none" stroke-width="14"/>
    <circle class="fill" cx="70" cy="70" r="${r}" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 70 70)"/>
    <text x="70" y="78" text-anchor="middle" font-size="30" font-weight="850">${value}%</text>
  </svg>`;
}
