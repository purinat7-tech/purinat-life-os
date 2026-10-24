import type { SafeHtml } from './lib/html.ts';

export type Section = 'home' | 'speaklog' | 'miles' | 'dreams' | 'about' | 'none';

export interface RouteContext {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  today: string;
}

export interface View {
  title: string;
  section: Section;
  body: SafeHtml;
  /** Runs after the HTML is in the DOM. May return a cleanup function. */
  mount?: (root: HTMLElement) => void | (() => void);
}

export type PageHandler = (ctx: RouteContext) => View | Promise<View>;

export class NotFoundError extends Error {}
