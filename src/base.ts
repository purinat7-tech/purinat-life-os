/** Base path handling for a GitHub Pages project site (e.g. "/purinat-life-os/"). */
export const BASE: string = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/**
 * Internal link: "/speaklog/import" -> "<base>speaklog/import/".
 * Trailing slashes match the folders written at build time, so GitHub Pages serves them without a redirect.
 */
export function href(path: string): string {
  const match = /^([^?#]*)(.*)$/.exec(path);
  const p = match?.[1] ?? '/';
  const rest = match?.[2] ?? '';
  const clean = p.replace(/^\/+|\/+$/g, '');
  return clean ? `${BASE}${clean}/${rest}` : `${BASE}${rest}`;
}

/** URL of a file in /public or a published data file, e.g. "images/places/x.webp". */
export function assetUrl(relative: string): string {
  return `${BASE}${relative.replace(/^\/+/, '')}`;
}

/** Path relative to the base, e.g. "/speaklog/import". */
export function appPath(pathname: string): string {
  const base = BASE.replace(/\/$/, '');
  let p = pathname;
  if (base && (p === base || p.startsWith(`${base}/`))) p = p.slice(base.length);
  return p || '/';
}
