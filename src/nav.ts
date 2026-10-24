/** Small indirection so pages can ask for navigation/re-render without importing the router. */
type Navigate = (to: string, opts?: { replace?: boolean }) => void;

let navigateFn: Navigate | undefined;

export function setNavigator(fn: Navigate): void {
  navigateFn = fn;
}

export function navigate(to: string, opts?: { replace?: boolean }): void {
  if (navigateFn) navigateFn(to, opts);
  else location.assign(to);
}

/** Re-renders the current page (e.g. after clearing local preview data). */
export function refresh(): void {
  navigate(location.pathname + location.search + location.hash, { replace: true });
}
