import { html, type HtmlValue, type SafeHtml } from '../lib/html.ts';
import type { Place } from '../lib/types.ts';
import { isKnownNumber, isTodo } from '../lib/types.ts';
import { assetUrl, href } from '../base.ts';
import { icons } from './icons.ts';

export interface NavItem {
  path: string;
  label: string;
}

export const SPEAKLOG_NAV: NavItem[] = [
  { path: '/speaklog', label: 'Dashboard' },
  { path: '/speaklog/activities', label: 'Activities' },
  { path: '/speaklog/mistakes', label: 'Mistake Memory' },
  { path: '/speaklog/phrases', label: 'Phrase Bank' },
  { path: '/speaklog/library', label: 'Library' },
  { path: '/speaklog/plan', label: 'Training Plan' },
  { path: '/speaklog/readiness', label: 'Trip Readiness' },
  { path: '/speaklog/journal', label: 'Journal' },
  { path: '/speaklog/import', label: 'Import' },
];

export const MILES_NAV: NavItem[] = [
  { path: '/miles', label: 'Explore' },
  { path: '/miles/journeys', label: 'Journeys' },
  { path: '/miles/places', label: 'Places' },
  { path: '/miles/timeline', label: 'Timeline' },
  { path: '/dreams', label: 'Dreams' },
  { path: '/miles/wrapped', label: 'Wrapped' },
];

export function subnav(items: NavItem[], current: string, label: string): SafeHtml {
  return html`<nav class="subnav no-shot" aria-label="${label}">
    ${items.map((i) => html`<a href="${href(i.path)}" ${i.path === current ? html`aria-current="page"` : ''}>${i.label}</a>`)}
  </nav>`;
}

export function pageHead(opts: { eyebrow?: string; title: string; lead?: HtmlValue; titleClass?: string; extra?: HtmlValue }): SafeHtml {
  return html`<header class="page-head">
    ${opts.eyebrow ? html`<div class="eyebrow">${opts.eyebrow}</div>` : ''}
    <h1 tabindex="-1" class="${opts.titleClass ?? ''}">${opts.title}</h1>
    ${opts.lead ? html`<p class="lead">${opts.lead}</p>` : ''}
    ${opts.extra ?? ''}
  </header>`;
}

export function speaklogHead(current: string, title: string, lead?: HtmlValue): SafeHtml {
  return html`${pageHead({ eyebrow: 'SPEAKLOG', title, lead })}${subnav(SPEAKLOG_NAV, current, 'SPEAKLOG sections')}`;
}

export function milesHead(current: string, title: string, lead?: HtmlValue, titleClass?: string): SafeHtml {
  return html`${pageHead({ eyebrow: 'MILES', title, lead, titleClass })}${subnav(MILES_NAV, current, 'MILES sections')}`;
}

export function tile(label: string, value: HtmlValue | null, opts: { unit?: string; sub?: HtmlValue; accent?: boolean } = {}): SafeHtml {
  if (value === null || value === undefined) {
    return html`<div class="tile empty-value"><span class="label">${label}</span><span class="value">No data yet</span>${opts.sub ? html`<span class="sub">${opts.sub}</span>` : ''}</div>`;
  }
  return html`<div class="tile${opts.accent ? ' accent' : ''}">
    <span class="label">${label}</span>
    <span class="value">${value}${opts.unit ? html`<small>${opts.unit}</small>` : ''}</span>
    ${opts.sub ? html`<span class="sub">${opts.sub}</span>` : ''}
  </div>`;
}

export function empty(title = 'No data yet', hint?: HtmlValue): SafeHtml {
  return html`<div class="empty"><strong>${title}</strong>${hint ? html`<span>${hint}</span>` : ''}</div>`;
}

export function section(title: string, body: HtmlValue, action?: { path: string; label: string }, id?: string): SafeHtml {
  const headingId = id ?? `s-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return html`<section class="section" aria-labelledby="${headingId}">
    <div class="section-head"><h2 id="${headingId}">${title}</h2>${action ? html`<a href="${href(action.path)}">${action.label}</a>` : ''}</div>
    ${body}
  </section>`;
}

export function defaultFlag(file: string): SafeHtml {
  return html`<span class="default-flag" title="Edit ${file} to change it">Default · edit <span class="code">${file}</span></span>`;
}

export function progressRow(label: string, value: number, goal: number, unit: string): SafeHtml {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return html`<div class="progress-row">
    <div class="top"><span>${label}</span><span>${value} / ${goal} ${unit}</span></div>
    <div class="bar-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(value, goal)}" aria-valuetext="${value} of ${goal} ${unit}">
      <div class="bar-fill" style="width:${pct}%"></div>
    </div>
  </div>`;
}

export function scoreBar(label: string, score: number | undefined, max = 5): SafeHtml {
  if (typeof score !== 'number') return html``;
  const pct = Math.round((score / max) * 100);
  return html`<div class="progress-row">
    <div class="top"><span>${label}</span><span>${score.toFixed(1)} / ${max}</span></div>
    <div class="bar-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${score}"><div class="bar-fill" style="width:${pct}%"></div></div>
  </div>`;
}

export function stars(rating: Place['rating']): SafeHtml {
  if (!isKnownNumber(rating)) return html`<span class="muted">${isTodo(rating) ? 'Not rated yet' : ''}</span>`;
  return html`<span class="stars" role="img" aria-label="${rating} out of 5">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>`;
}

/** The single hero photo of a place, or a placeholder tile while the photo is TODO. */
export function placePhoto(place: Pick<Place, 'name' | 'photo' | 'photo_alt'>, opts: { className?: string; eager?: boolean; sizes?: string } = {}): SafeHtml {
  const cls = `photo ${opts.className ?? ''}`.trim();
  if (isTodo(place.photo) || !place.photo) {
    return html`<div class="${cls} placeholder" role="img" aria-label="No photo yet for ${place.name}">
      <span class="initial" aria-hidden="true">${place.name.charAt(0)}</span>
      <span class="ph-label" aria-hidden="true">Photo to add</span>
    </div>`;
  }
  const alt = isTodo(place.photo_alt) || !place.photo_alt ? place.name : place.photo_alt;
  return html`<div class="${cls}"><img src="${assetUrl(place.photo)}" alt="${alt}" ${opts.eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async" sizes="${opts.sizes ?? '100vw'}"></div>`;
}

export function arrowLink(path: string, label: string): SafeHtml {
  return html`<a class="go" href="${href(path)}">${label} <span aria-hidden="true">→</span></a>`;
}

export function todoText(value: string | undefined, fallback = 'TODO'): string {
  if (!value || isTodo(value)) return fallback;
  return value;
}

export { icons };
