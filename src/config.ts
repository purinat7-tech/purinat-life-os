/**
 * Runtime configuration from public/config.js (loaded before the app).
 * The map style URLs and the optional API key live ONLY in that file.
 */

export interface MapConfig {
  /** Primary style URL. "{key}" is replaced with apiKey. Empty = use the keyless fallback. */
  styleUrl: string;
  styleUrlDark: string;
  /** Client-side key. It is public: restrict it by allowed origin at your provider. */
  apiKey: string;
  /** Keyless styles used when the primary style is not configured or fails to load. */
  fallbackStyleUrl: string;
  fallbackStyleUrlDark: string;
  /** Extra attribution text added to the map's attribution control. */
  attribution: string;
}

interface LifeOsConfig {
  map?: Partial<MapConfig>;
}

declare global {
  interface Window {
    LIFE_OS_CONFIG?: LifeOsConfig;
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function getMapConfig(): MapConfig | null {
  const map = window.LIFE_OS_CONFIG?.map;
  if (!map) return null;
  return {
    styleUrl: str(map.styleUrl),
    styleUrlDark: str(map.styleUrlDark),
    apiKey: str(map.apiKey),
    fallbackStyleUrl: str(map.fallbackStyleUrl),
    fallbackStyleUrlDark: str(map.fallbackStyleUrlDark),
    attribution: str(map.attribution),
  };
}

/** Candidate style URLs in the order to try for the given theme. */
export function styleCandidates(config: MapConfig, theme: 'light' | 'dark'): { url: string; keyed: boolean }[] {
  const out: { url: string; keyed: boolean }[] = [];
  const primary = theme === 'dark' ? config.styleUrlDark || config.styleUrl : config.styleUrl;
  if (primary) {
    const needsKey = primary.includes('{key}');
    if (!needsKey || config.apiKey) {
      out.push({ url: primary.replace('{key}', encodeURIComponent(config.apiKey)), keyed: needsKey });
    }
  }
  const fallback = theme === 'dark' ? config.fallbackStyleUrlDark || config.fallbackStyleUrl : config.fallbackStyleUrl;
  if (fallback) out.push({ url: fallback, keyed: false });
  if (theme === 'dark' && config.fallbackStyleUrl && config.fallbackStyleUrl !== fallback) out.push({ url: config.fallbackStyleUrl, keyed: false });
  return out;
}
