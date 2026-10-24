import { icons } from './components/icons.ts';

export type Theme = 'light' | 'dark';
const KEY = 'lifeos.theme';
const listeners = new Set<(t: Theme) => void>();

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  const button = document.getElementById('theme-toggle');
  if (button) {
    const next = theme === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
    button.innerHTML = (theme === 'dark' ? icons.sun : icons.moon).value;
  }
  for (const fn of listeners) fn(theme);
}

export function onThemeChange(fn: (t: Theme) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initTheme(): void {
  apply(currentTheme());
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage may be unavailable (private mode); the toggle still works for this page view */
    }
    apply(next);
  });
  // Follow the OS setting until the visitor picks a theme.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      stored = null;
    }
    if (!stored) apply(e.matches ? 'dark' : 'light');
  });
}
