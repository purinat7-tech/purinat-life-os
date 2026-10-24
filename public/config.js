/*
 * PURINAT LIFE OS: runtime configuration. This is the ONLY place where map
 * style URLs and the map API key are set.
 *
 * Everything in this file is public. Anyone can read it in the browser.
 * If you add an API key, restrict it at your map provider to your site's origin
 * (for example "yourname.github.io") and set a usage quota. See README.md, "Map setup".
 *
 * How the map picks a style:
 *   1. styleUrl (or styleUrlDark in dark mode). "{key}" is replaced with apiKey.
 *      Skipped when empty, or when it contains "{key}" and apiKey is empty.
 *   2. If that fails (no key, key rejected, offline), the keyless fallback style is used.
 *   3. If no style loads, the Explore page shows the place list instead of the map.
 *
 * Attribution: MapLibre shows the attribution embedded in the style
 * (e.g. "© OpenMapTiles Data from OpenStreetMap"). Use `attribution` for anything extra
 * your provider requires.
 */
window.LIFE_OS_CONFIG = {
  map: {
    // Example with MapTiler (needs a key restricted by "Allowed HTTP origins"):
    //   styleUrl:     "https://api.maptiler.com/maps/dataviz-v4-light/style.json?key={key}",
    //   styleUrlDark: "https://api.maptiler.com/maps/dataviz-v4-dark/style.json?key={key}",
    styleUrl: "",
    styleUrlDark: "",
    apiKey: "",

    // Keyless fallback: OpenFreeMap (free, no key, no cookies). Positron = clean light style.
    fallbackStyleUrl: "https://tiles.openfreemap.org/styles/positron",
    fallbackStyleUrlDark: "https://tiles.openfreemap.org/styles/dark",

    attribution: ""
  }
};
